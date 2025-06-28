const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.db = null;
    this.dbPath = process.env.DATABASE_URL?.replace('sqlite:', '') || './database/ai_video_hub.db';
  }

  async connect() {
    return new Promise((resolve, reject) => {
      // Ensure database directory exists
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log(`Created database directory: ${dbDir}`);
      }

      console.log(`Connecting to database: ${this.dbPath}`);

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error connecting to database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.enableForeignKeys();
          resolve();
        }
      });
    });
  }

  enableForeignKeys() {
    this.db.run('PRAGMA foreign_keys = ON');
  }

  async ping() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT 1 as ping', (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row && row.ping === 1);
        }
      });
    });
  }

  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    });
  }

  // Helper method to parse JSON fields
  parseJsonField(field) {
    if (!field) return null;
    try {
      return JSON.parse(field);
    } catch (error) {
      console.warn('Failed to parse JSON field:', field);
      return null;
    }
  }

  // Helper method to stringify JSON fields
  stringifyJsonField(field) {
    if (!field) return null;
    try {
      return JSON.stringify(field);
    } catch (error) {
      console.warn('Failed to stringify JSON field:', field);
      return null;
    }
  }
}

// Create singleton instance
const database = new Database();

module.exports = database; 