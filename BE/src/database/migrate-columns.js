const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/ai_video_hub.db');

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

(async () => {
  try {
    await addColumnIfNotExists('videos', 'processing_started_at', 'TEXT');
    await addColumnIfNotExists('videos', 'estimated_finish_at', 'TEXT');
    db.close();
    console.log('Migration completed!');
  } catch (e) {
    console.error('Migration failed:', e);
    db.close();
  }
})(); 