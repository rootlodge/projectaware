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
  // Don't save empty or repetitive messages
  if (!content || content.trim().length === 0) return;
  if (content === "No new information to process.") return;
  if (content === "No new actionable insights from logs.") return;
  
  db.run(`INSERT INTO messages (role, content) VALUES (?, ?)`, [role, content.trim()]);
}

function getRecentMessages(limit = 10) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM messages ORDER BY id DESC LIMIT ?`, [limit], (err, rows) => {
      if (err) return reject(err);
      
      // Filter out repetitive or empty messages
      const filtered = rows
        .filter(row => row.content && row.content.trim().length > 0)
        .filter(row => row.content !== "No new information to process.")
        .filter(row => row.content !== "No new actionable insights from logs.")
        .reverse();
      
      resolve(filtered);
    });
  });
}

function getContextSummary(limit = 50) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT role, content FROM messages ORDER BY id DESC LIMIT ?`, [limit], (err, rows) => {
      if (err) return reject(err);
      
      // Summarize context to prevent repetition
      const summary = rows
        .reverse()
        .filter(row => row.content.length > 10) // Filter out very short messages
        .slice(-20) // Keep only last 20 meaningful messages
        .map(row => `${row.role}: ${row.content}`)
        .join('\n');
      
      resolve(summary);
    });
  });
}

function getConversationHistory(limit = 30) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT role, content, timestamp FROM messages 
            WHERE role IN ('user', 'ai') 
            ORDER BY id DESC LIMIT ?`, [limit], (err, rows) => {
      if (err) return reject(err);
      
      // Format for satisfaction analysis
      const formatted = rows
        .reverse()
        .map(row => {
          const time = new Date(row.timestamp).toLocaleTimeString();
          return `[${time}] ${row.role.toUpperCase()}: ${row.content}`;
        })
        .join('\n');
      
      resolve(formatted);
    });
  });
}

function getUserResponsePatterns(limit = 50) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT content, timestamp FROM messages 
            WHERE role = 'user' 
            ORDER BY id DESC LIMIT ?`, [limit], (err, rows) => {
      if (err) return reject(err);
      
      const patterns = {
        short_responses: rows.filter(r => r.content.length < 20).length,
        questions: rows.filter(r => r.content.includes('?')).length,
        positive_indicators: rows.filter(r => 
          /good|great|thanks|perfect|excellent|nice|helpful/i.test(r.content)
        ).length,
        negative_indicators: rows.filter(r => 
          /no|wrong|bad|stop|fix|problem|error|issue/i.test(r.content)
        ).length,
        commands: rows.filter(r => 
          r.content.startsWith('goal:') || r.content.startsWith('reward:')
        ).length,
        total_interactions: rows.length
      };
      
      resolve(patterns);
    });
  });
}

function clearAllMemory() {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM messages`, (err) => {
      if (err) return reject(err);
      console.log('All memory cleared from database');
      resolve();
    });
  });
}

module.exports = { saveMessage, getRecentMessages, getContextSummary, getConversationHistory, getUserResponsePatterns, clearAllMemory };
