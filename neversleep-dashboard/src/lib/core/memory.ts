import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs-extra';

export interface Message {
  id?: number;
  type: string;
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Conversation {
  id?: number;
  session_id: string;
  user_message: string;
  ai_response: string;
  timestamp: string;
  satisfaction_score?: number;
  emotion_state?: string;
}

export interface UserPattern {
  id?: number;
  pattern_type: string;
  pattern_data: string;
  frequency: number;
  last_seen: string;
}

export interface LearningEvent {
  id?: number;
  event_type: string;
  description: string;
  context: string;
  timestamp: string;
}

export interface MemoryStats {
  messages: number;
  conversations: number;
  learningEvents: number;
  dbSize: number;
}

export class MemorySystem {
  private db: sqlite3.Database | null = null;
  private dbPath: string;
  private isConnected: boolean = false;

  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'memory.db');
  }

  async initialize(): Promise<void> {
    try {
      // Ensure data directory exists
      await fs.ensureDir(path.dirname(this.dbPath));

      return new Promise((resolve, reject) => {
        this.db = new sqlite3.Database(this.dbPath, (err) => {
          if (err) {
            console.error('Database connection failed:', err.message);
            reject(err);
          } else {
            this.isConnected = true;
            console.log('Connected to SQLite database');
            this.createTables().then(resolve).catch(reject);
          }
        });
      });
    } catch (error) {
      console.error('Memory system initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    const tables = [
      `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        user_message TEXT,
        ai_response TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        satisfaction_score REAL,
        emotion_state TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS user_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern_type TEXT,
        pattern_data TEXT,
        frequency INTEGER DEFAULT 1,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS learning_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT,
        description TEXT,
        context TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await this.runQuery(table);
    }
    console.log('Database tables created/verified');
  }

  private runQuery(sql: string, params: any[] = []): Promise<{ id?: number; changes?: number }> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Query failed:', err.message);
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  private getQuery(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      this.db.get(sql, params, (err, row) => {
        if (err) {
          console.error('Query failed:', err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  private getAllQuery(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Query failed:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async saveMessage(type: string, content: string, metadata: Record<string, any> = {}): Promise<void> {
    try {
      const metadataStr = JSON.stringify(metadata);
      await this.runQuery(
        'INSERT INTO messages (type, content, metadata) VALUES (?, ?, ?)',
        [type, content, metadataStr]
      );
      console.log('Message saved:', { type, content: content.substring(0, 100) });
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  }

  async saveConversation(
    sessionId: string,
    userMessage: string,
    aiResponse: string,
    satisfactionScore?: number,
    emotionState?: string
  ): Promise<void> {
    try {
      await this.runQuery(
        'INSERT INTO conversations (session_id, user_message, ai_response, satisfaction_score, emotion_state) VALUES (?, ?, ?, ?, ?)',
        [sessionId, userMessage, aiResponse, satisfactionScore, emotionState]
      );
      console.log('Conversation saved');
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }

  async getConversationHistory(limit: number = 20, sessionId?: string): Promise<Conversation[]> {
    try {
      let sql = 'SELECT * FROM conversations';
      let params: any[] = [];
      
      if (sessionId) {
        sql += ' WHERE session_id = ?';
        params.push(sessionId);
      }
      
      sql += ' ORDER BY timestamp DESC LIMIT ?';
      params.push(limit);

      const rows = await this.getAllQuery(sql, params);
      return rows.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Failed to get conversation history:', error);
      return [];
    }
  }

  async getRecentMessages(limit: number = 10, type?: string): Promise<Message[]> {
    try {
      let sql = 'SELECT * FROM messages';
      let params: any[] = [];
      
      if (type) {
        sql += ' WHERE type = ?';
        params.push(type);
      }
      
      sql += ' ORDER BY timestamp DESC LIMIT ?';
      params.push(limit);

      return await this.getAllQuery(sql, params);
    } catch (error) {
      console.error('Failed to get recent messages:', error);
      return [];
    }
  }

  async getUserResponsePatterns(): Promise<UserPattern[]> {
    try {
      const patterns = await this.getAllQuery(
        'SELECT pattern_type, pattern_data, frequency FROM user_patterns ORDER BY frequency DESC'
      );
      return patterns;
    } catch (error) {
      console.error('Failed to get user patterns:', error);
      return [];
    }
  }

  async recordLearningEvent(eventType: string, description: string, context: string = ''): Promise<void> {
    try {
      await this.runQuery(
        'INSERT INTO learning_events (event_type, description, context) VALUES (?, ?, ?)',
        [eventType, description, context]
      );
      console.log('Learning event recorded:', eventType);
    } catch (error) {
      console.error('Failed to record learning event:', error);
    }
  }

  async getMemoryStats(): Promise<MemoryStats> {
    try {
      const messageCount = await this.getQuery('SELECT COUNT(*) as count FROM messages');
      const conversationCount = await this.getQuery('SELECT COUNT(*) as count FROM conversations');
      const learningEventCount = await this.getQuery('SELECT COUNT(*) as count FROM learning_events');
      
      return {
        messages: messageCount.count,
        conversations: conversationCount.count,
        learningEvents: learningEventCount.count,
        dbSize: this.getDatabaseSize()
      };
    } catch (error) {
      console.error('Failed to get memory stats:', error);
      return { messages: 0, conversations: 0, learningEvents: 0, dbSize: 0 };
    }
  }

  private getDatabaseSize(): number {
    try {
      const stats = fs.statSync(this.dbPath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  async cleanup(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      await this.runQuery(
        'DELETE FROM messages WHERE timestamp < ?',
        [cutoffDate.toISOString()]
      );
      
      console.log(`Cleaned up messages older than ${daysToKeep} days`);
    } catch (error) {
      console.error('Failed to cleanup memory:', error);
    }
  }

  async close(): Promise<void> {
    if (this.db && this.isConnected) {
      return new Promise((resolve) => {
        this.db!.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
          } else {
            console.log('Database connection closed');
          }
          this.isConnected = false;
          resolve();
        });
      });
    }
  }
}
