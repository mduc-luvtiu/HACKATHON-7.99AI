const fs = require('fs');
const path = require('path');
const database = require('./connection');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/ai_video_hub.db');

function stripSqlComments(sql) {
  // Remove /* ... */ block comments
  sql = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove -- line comments
  sql = sql.replace(/^\s*--.*$/gm, '');
  return sql;
} 

async function migrate(shouldCloseConnection = true) {
  try {
    console.log('Starting database migration...');
    
    // Connect to database
    await database.connect();
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }
    
    let schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('Schema file loaded successfully');
    
    // Remove comments
    schema = stripSqlComments(schema);
    
    // Split schema into individual statements and clean them
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Separate CREATE TABLE and CREATE INDEX statements
    const createTableStatements = [];
    const createIndexStatements = [];
    
    for (const statement of statements) {
      const upperStmt = statement.toUpperCase();
      if (upperStmt.includes('CREATE TABLE')) {
        createTableStatements.push(statement);
      } else if (upperStmt.includes('CREATE INDEX')) {
        createIndexStatements.push(statement);
      }
    }
    
    console.log(`Found ${createTableStatements.length} CREATE TABLE statements`);
    console.log(`Found ${createIndexStatements.length} CREATE INDEX statements`);
    
    // Execute CREATE TABLE statements first
    console.log('\nExecuting CREATE TABLE statements...');
    for (let i = 0; i < createTableStatements.length; i++) {
      const statement = createTableStatements[i];
      try {
        await database.run(statement);
        const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
        console.log(`[${i + 1}/${createTableStatements.length}] Created table: ${preview}...`);
      } catch (error) {
        console.error(`Failed to execute CREATE TABLE statement ${i + 1}:`, error.message);
        console.error('Statement:', statement.substring(0, 100) + '...');
        throw error;
      }
    }
    
    // Execute CREATE INDEX statements after tables are created
    console.log('\nExecuting CREATE INDEX statements...');
    for (let i = 0; i < createIndexStatements.length; i++) {
      const statement = createIndexStatements[i];
      try {
        await database.run(statement);
        const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
        console.log(`[${i + 1}/${createIndexStatements.length}] Created index: ${preview}...`);
      } catch (error) {
        console.error(`Failed to execute CREATE INDEX statement ${i + 1}:`, error.message);
        console.error('Statement:', statement.substring(0, 100) + '...');
        throw error;
      }
    }
    
    console.log('\nDatabase migration completed successfully!');
    
    // Verify tables were created
    const tables = await database.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    
    console.log('Created tables:', tables.map(t => t.name).join(', '));
    
    // Verify indexes were created
    const indexes = await database.all(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    
    console.log('Created indexes:', indexes.map(i => i.name).join(', '));
    
    // Add columns to videos table
    await addColumnIfNotExists('videos', 'processing_started_at', 'TEXT');
    await addColumnIfNotExists('videos', 'estimated_finish_at', 'TEXT');
    
    // Only close database connection if explicitly requested
    if (shouldCloseConnection) {
      await database.close();
      db.close();
    }
    
    console.log('Migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

function addColumnIfNotExists(table, column, type) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${table})`, (err, columns) => {
      if (err) return reject(err);
      const exists = columns.some(col => col.name === column);
      if (!exists) {
        db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`, (err) => {
          if (err) return reject(err);
          console.log(`Added column ${column} to ${table}`);
          resolve();
        });
      } else {
        console.log(`Column ${column} already exists in ${table}`);
        resolve();
      }
    });
  });
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate();
}

module.exports = migrate; 