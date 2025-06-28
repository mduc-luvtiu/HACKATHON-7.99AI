const fs = require('fs');
const path = require('path');
const database = require('./connection');

function stripSqlComments(sql) {
  // Remove /* ... */ block comments
  sql = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove -- line comments
  sql = sql.replace(/^\s*--.*$/gm, '');
  return sql;
}

async function migrate() {
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
    
    // Close database connection
    await database.close();
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate();
}

module.exports = migrate; 