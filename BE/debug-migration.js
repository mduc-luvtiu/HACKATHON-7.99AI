const fs = require('fs');
const path = require('path');
const database = require('./src/database/connection');

async function debugMigration() {
  try {
    console.log('=== Debug Migration ===');
    
    // Test 1: Check if schema file exists
    const schemaPath = path.join(__dirname, 'src/database/schema.sql');
    console.log('1. Schema file exists:', fs.existsSync(schemaPath));
    
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      console.log('2. Schema file size:', schema.length, 'characters');
      console.log('3. First 200 characters:', schema.substring(0, 200));
    }
    
    // Test 2: Connect to database
    console.log('\n4. Connecting to database...');
    await database.connect();
    console.log('5. Database connected successfully');
    
    // Test 3: Check if database is empty
    console.log('\n6. Checking existing tables...');
    const tables = await database.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    console.log('7. Existing tables:', tables.map(t => t.name));
    
    // Test 4: Read and parse schema
    console.log('\n8. Reading schema file...');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => {
        const cleanStmt = stmt.replace(/\s+/g, ' ').trim();
        return cleanStmt.length > 0 && 
               !cleanStmt.startsWith('--') && 
               !cleanStmt.startsWith('/*') &&
               !cleanStmt.startsWith('*/');
      });
    
    console.log('9. Found', statements.length, 'SQL statements');
    
    // Test 5: Execute first few statements
    console.log('\n10. Testing first statement...');
    if (statements.length > 0) {
      const firstStatement = statements[0];
      console.log('First statement preview:', firstStatement.substring(0, 100) + '...');
      
      try {
        await database.run(firstStatement);
        console.log('11. First statement executed successfully');
      } catch (error) {
        console.log('11. First statement failed:', error.message);
        console.log('Statement:', firstStatement);
      }
    }
    
    // Test 6: Check tables again
    console.log('\n12. Checking tables after first statement...');
    const tablesAfter = await database.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    console.log('13. Tables after first statement:', tablesAfter.map(t => t.name));
    
    await database.close();
    console.log('\n=== Debug Complete ===');
    
  } catch (error) {
    console.error('Debug failed:', error);
    process.exit(1);
  }
}

debugMigration(); 