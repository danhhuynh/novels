const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, 'novels.db');

// Create a singleton database connection
let db = null;

/**
 * Initialize database connection
 * @returns {Promise<sqlite3.Database>}
 */
function initializeDb() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        reject(err);
      } else {
        console.log('Connected to SQLite database');
        resolve(db);
      }
    });
  });
}

/**
 * Create database tables
 * @returns {Promise}
 */
function createTables() {
  return new Promise((resolve, reject) => {
    const createNovelsTable = `
      CREATE TABLE IF NOT EXISTS novels (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        description TEXT,
        coverImage TEXT,
        genre TEXT,
        status TEXT,
        totalChapters INTEGER DEFAULT 0,
        lastUpdated TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createChaptersTable = `
      CREATE TABLE IF NOT EXISTS chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        novelId TEXT,
        number INTEGER,
        title TEXT NOT NULL,
        publishDate TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (novelId) REFERENCES novels (id),
        UNIQUE(novelId, number)
      )
    `;

    db.serialize(() => {
      db.run(createNovelsTable, (err) => {
        if (err) {
          reject(err);
          return;
        }
      });

      db.run(createChaptersTable, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  });
}

/**
 * Get database instance
 * @returns {sqlite3.Database}
 */
function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDb() first.');
  }
  return db;
}

/**
 * Close database connection
 * @returns {Promise}
 */
function closeDb() {
  return new Promise((resolve) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        }
        db = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

/**
 * Check if database is initialized
 * @returns {boolean}
 */
function isDbInitialized() {
  return db !== null;
}

module.exports = {
  initializeDb,
  createTables,
  getDb,
  closeDb,
  isDbInitialized
};
