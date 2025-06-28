const fs = require('fs');

// Read the schema file
const schema = fs.readFileSync('./src/database/schema.sql', 'utf8');
console.log('Schema file loaded, length:', schema.length);

// Split by semicolons
const rawStatements = schema.split(';');
console.log('Raw statements after split:', rawStatements.length);

// Show all raw statements
console.log('\n=== RAW STATEMENTS ===');
rawStatements.forEach((stmt, i) => {
  const trimmed = stmt.trim();
  if (trimmed.length > 0) {
    console.log(`\n${i + 1}. Length: ${trimmed.length}`);
    console.log('Content:', trimmed.substring(0, 100) + (trimmed.length > 100 ? '...' : ''));
  }
});

// Filter and clean statements
const statements = rawStatements
  .map(stmt => stmt.trim())
  .filter(stmt => {
    const cleanStmt = stmt.replace(/\s+/g, ' ').trim();
    return cleanStmt.length > 0 && 
           !cleanStmt.startsWith('--') && 
           !cleanStmt.startsWith('/*') &&
           !cleanStmt.startsWith('*/');
  });

console.log('\n=== FILTERED STATEMENTS ===');
console.log('Filtered statements:', statements.length);

// Show each statement
statements.forEach((stmt, i) => {
  const upperStmt = stmt.toUpperCase();
  const isTable = upperStmt.includes('CREATE TABLE');
  const isIndex = upperStmt.includes('CREATE INDEX');
  
  console.log(`\n${i + 1}. Type: ${isTable ? 'TABLE' : isIndex ? 'INDEX' : 'OTHER'}`);
  console.log('Preview:', stmt.substring(0, 80) + '...');
  console.log('Length:', stmt.length);
});

// Count by type
const tableCount = statements.filter(s => s.toUpperCase().includes('CREATE TABLE')).length;
const indexCount = statements.filter(s => s.toUpperCase().includes('CREATE INDEX')).length;

console.log(`\nSummary:`);
console.log(`- CREATE TABLE statements: ${tableCount}`);
console.log(`- CREATE INDEX statements: ${indexCount}`);
console.log(`- Other statements: ${statements.length - tableCount - indexCount}`); 