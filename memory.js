// memory.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./memory.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

function saveMessage(role, content) {
  db.run(`INSERT INTO messages (role, content) VALUES (?, ?)`, [role, content]);
}

function getRecentMessages(limit = 10) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM messages ORDER BY id DESC LIMIT ?`, [limit], (err, rows) => {
      if (err) return reject(err);
      resolve(rows.reverse());
    });
  });
}

module.exports = { saveMessage, getRecentMessages };
