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
  modelPreferences: number;
  currentModel: string;
}

export interface ModelPreference {
  id?: number;
  model_name: string;
  description: string;
  speed_rating: number; // 1-5 scale
  intelligence_rating: number; // 1-5 scale
  is_default: boolean;
  created_at: string;
  last_used: string;
}

export interface Configuration {
  id?: number;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  category: string;
  created_at?: string;
  updated_at?: string;
}

export interface ConfigurationStats {
  total: number;
  byCategory: Record<string, number>;
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
            this.createTables()
              .then(() => this.initializeDefaultModels())
              .then(resolve)
              .catch(reject);
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
      )`,
      `CREATE TABLE IF NOT EXISTS model_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model_name TEXT NOT NULL,
        description TEXT,
        speed_rating INTEGER CHECK(speed_rating BETWEEN 1 AND 5),
        intelligence_rating INTEGER CHECK(intelligence_rating BETWEEN 1 AND 5),
        is_default BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used DATETIME
      )`,
      `CREATE TABLE IF NOT EXISTS configurations (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('string', 'number', 'boolean', 'object', 'array')),
        description TEXT,
        category TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE INDEX IF NOT EXISTS idx_configurations_category ON configurations(category)`,
      `CREATE INDEX IF NOT EXISTS idx_configurations_key ON configurations(key)`
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
      const modelPreferenceCount = await this.getQuery('SELECT COUNT(*) as count FROM model_preferences');
      const currentModel = await this.getCurrentModel();
      
      return {
        messages: messageCount.count,
        conversations: conversationCount.count,
        learningEvents: learningEventCount.count,
        dbSize: this.getDatabaseSize(),
        modelPreferences: modelPreferenceCount.count,
        currentModel: currentModel?.model_name || 'gemma3:latest'
      };
    } catch (error) {
      console.error('Failed to get memory stats:', error);
      return { 
        messages: 0, 
        conversations: 0, 
        learningEvents: 0, 
        dbSize: 0,
        modelPreferences: 0,
        currentModel: 'gemma3:latest'
      };
    }
  }

  async getStats(): Promise<MemoryStats> {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      const [messagesCount, conversationsCount, learningEventsCount, modelPreferenceCount] = await Promise.all([
        this.getQuery('SELECT COUNT(*) as count FROM messages'),
        this.getQuery('SELECT COUNT(*) as count FROM conversations'),
        this.getQuery('SELECT COUNT(*) as count FROM learning_events'),
        this.getQuery('SELECT COUNT(*) as count FROM model_preferences')
      ]);

      const currentModel = await this.getCurrentModel();

      // Get database file size
      let dbSize = 0;
      try {
        const fs = await import('fs');
        const stats = fs.statSync(this.dbPath);
        dbSize = stats.size;
      } catch (error) {
        console.warn('Could not get database file size:', error);
      }

      return {
        messages: messagesCount?.count || 0,
        conversations: conversationsCount?.count || 0,
        learningEvents: learningEventsCount?.count || 0,
        dbSize,
        modelPreferences: modelPreferenceCount?.count || 0,
        currentModel: currentModel?.model_name || 'gemma3:latest'
      };
    } catch (error) {
      console.error('Failed to get memory stats:', error);
      return {
        messages: 0,
        conversations: 0,
        learningEvents: 0,
        dbSize: 0,
        modelPreferences: 0,
        currentModel: 'gemma3:latest'
      };
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

  // Model preference methods
  async addModelPreference(model: Omit<ModelPreference, 'id' | 'created_at' | 'last_used'>): Promise<number> {
    try {
      const result = await this.runQuery(
        'INSERT INTO model_preferences (model_name, description, speed_rating, intelligence_rating, is_default) VALUES (?, ?, ?, ?, ?)',
        [model.model_name, model.description, model.speed_rating, model.intelligence_rating, model.is_default ? 1 : 0]
      );
      return result.id!;
    } catch (error) {
      console.error('Failed to add model preference:', error);
      throw error;
    }
  }

  async getModelPreferences(): Promise<ModelPreference[]> {
    try {
      const models = await this.getAllQuery('SELECT * FROM model_preferences ORDER BY is_default DESC, last_used DESC');
      return models.map((model: any) => ({
        ...model,
        is_default: Boolean(model.is_default)
      }));
    } catch (error) {
      console.error('Failed to get model preferences:', error);
      return [];
    }
  }

  async getCurrentModel(): Promise<ModelPreference | null> {
    try {
      const model = await this.getQuery('SELECT * FROM model_preferences WHERE is_default = 1 LIMIT 1');
      if (model) {
        return {
          ...model,
          is_default: Boolean(model.is_default)
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get current model:', error);
      return null;
    }
  }

  async setDefaultModel(modelName: string): Promise<void> {
    try {
      // First, remove default from all models
      await this.runQuery('UPDATE model_preferences SET is_default = 0');
      // Then set the new default
      await this.runQuery(
        'UPDATE model_preferences SET is_default = 1, last_used = CURRENT_TIMESTAMP WHERE model_name = ?',
        [modelName]
      );
    } catch (error) {
      console.error('Failed to set default model:', error);
      throw error;
    }
  }

  async updateModelLastUsed(modelName: string): Promise<void> {
    try {
      await this.runQuery(
        'UPDATE model_preferences SET last_used = CURRENT_TIMESTAMP WHERE model_name = ?',
        [modelName]
      );
    } catch (error) {
      console.error('Failed to update model last used:', error);
    }
  }

  async initializeDefaultModels(): Promise<void> {
    try {
      const existingModels = await this.getModelPreferences();
      
      if (existingModels.length === 0) {
        // Add default models
        await this.addModelPreference({
          model_name: 'gemma3:latest',
          description: 'Good balance of speed and intelligence for general conversations',
          speed_rating: 4,
          intelligence_rating: 4,
          is_default: true
        });

        await this.addModelPreference({
          model_name: 'llama3.2:latest',
          description: 'Blazing fast speed for quick responses and tool usage',
          speed_rating: 5,
          intelligence_rating: 3,
          is_default: false
        });

        console.log('Default models initialized');
      }
    } catch (error) {
      console.error('Failed to initialize default models:', error);
    }
  }

  async getLearningEvents(limit: number = 50): Promise<LearningEvent[]> {
    try {
      const sql = 'SELECT * FROM learning_events ORDER BY timestamp DESC LIMIT ?';
      return await this.getAllQuery(sql, [limit]);
    } catch (error) {
      console.error('Failed to get learning events:', error);
      return [];
    }
  }

  async searchMessages(query: string, type: string = 'all', limit: number = 20): Promise<Message[]> {
    try {
      let sql = 'SELECT * FROM messages WHERE ';
      let params: any[] = [];

      if (type !== 'all') {
        sql += 'type = ? AND ';
        params.push(type);
      }

      sql += 'content LIKE ? ORDER BY timestamp DESC LIMIT ?';
      params.push(`%${query}%`, limit);

      return await this.getAllQuery(sql, params);
    } catch (error) {
      console.error('Failed to search messages:', error);
      return [];
    }
  }

  async getAdvancedAnalytics(): Promise<any> {
    try {
      const analytics = {
        message_stats: await this.getMessageStats(),
        conversation_patterns: await this.getConversationPatterns(),
        user_engagement: await this.getUserEngagementMetrics(),
        emotion_trends: await this.getEmotionTrends(),
        learning_insights: await this.getLearningInsights(),
        peak_activity_hours: await this.getPeakActivityHours(),
        response_quality: await this.getResponseQualityMetrics()
      };

      return analytics;
    } catch (error) {
      console.error('Failed to get advanced analytics:', error);
      return {};
    }
  }

  private async getMessageStats(): Promise<any> {
    try {
      const totalMessages = await this.getQuery('SELECT COUNT(*) as count FROM messages');
      const messagesByType = await this.getAllQuery(`
        SELECT type, COUNT(*) as count 
        FROM messages 
        GROUP BY type 
        ORDER BY count DESC
      `);
      const recentActivity = await this.getAllQuery(`
        SELECT DATE(timestamp) as date, COUNT(*) as count 
        FROM messages 
        WHERE timestamp >= datetime('now', '-7 days') 
        GROUP BY DATE(timestamp) 
        ORDER BY date DESC
      `);

      return {
        total: totalMessages?.count || 0,
        by_type: messagesByType,
        recent_activity: recentActivity
      };
    } catch (error) {
      console.error('Failed to get message stats:', error);
      return {};
    }
  }

  private async getConversationPatterns(): Promise<any> {
    try {
      const avgSatisfaction = await this.getQuery(`
        SELECT AVG(satisfaction_score) as avg_score 
        FROM conversations 
        WHERE satisfaction_score IS NOT NULL
      `);
      
      const conversationLengths = await this.getAllQuery(`
        SELECT 
          LENGTH(user_message) + LENGTH(ai_response) as total_length,
          COUNT(*) as count
        FROM conversations 
        GROUP BY ROUND(LENGTH(user_message) + LENGTH(ai_response), -2)
        ORDER BY total_length
      `);

      const responseTimePatterns = await this.getAllQuery(`
        SELECT 
          strftime('%H', timestamp) as hour,
          COUNT(*) as count
        FROM conversations 
        GROUP BY strftime('%H', timestamp)
        ORDER BY hour
      `);

      return {
        avg_satisfaction: avgSatisfaction?.avg_score || 0,
        conversation_lengths: conversationLengths,
        response_time_patterns: responseTimePatterns
      };
    } catch (error) {
      console.error('Failed to get conversation patterns:', error);
      return {};
    }
  }

  private async getUserEngagementMetrics(): Promise<any> {
    try {
      const uniqueSessions = await this.getQuery(`
        SELECT COUNT(DISTINCT session_id) as count 
        FROM conversations
      `);
      
      const avgMessagesPerSession = await this.getQuery(`
        SELECT AVG(session_msg_count) as avg_messages 
        FROM (
          SELECT session_id, COUNT(*) as session_msg_count 
          FROM conversations 
          GROUP BY session_id
        )
      `);

      const sessionLengths = await this.getAllQuery(`
        SELECT 
          session_id,
          COUNT(*) as message_count,
          MAX(timestamp) as last_activity,
          MIN(timestamp) as first_activity
        FROM conversations 
        GROUP BY session_id 
        ORDER BY message_count DESC 
        LIMIT 10
      `);

      return {
        unique_sessions: uniqueSessions?.count || 0,
        avg_messages_per_session: avgMessagesPerSession?.avg_messages || 0,
        top_sessions: sessionLengths
      };
    } catch (error) {
      console.error('Failed to get engagement metrics:', error);
      return {};
    }
  }

  private async getEmotionTrends(): Promise<any> {
    try {
      const emotionDistribution = await this.getAllQuery(`
        SELECT 
          emotion_state,
          COUNT(*) as count
        FROM conversations 
        WHERE emotion_state IS NOT NULL
        GROUP BY emotion_state 
        ORDER BY count DESC
      `);

      const emotionTrends = await this.getAllQuery(`
        SELECT 
          DATE(timestamp) as date,
          emotion_state,
          COUNT(*) as count
        FROM conversations 
        WHERE emotion_state IS NOT NULL 
        AND timestamp >= datetime('now', '-30 days')
        GROUP BY DATE(timestamp), emotion_state 
        ORDER BY date DESC
      `);

      return {
        distribution: emotionDistribution,
        trends: emotionTrends
      };
    } catch (error) {
      console.error('Failed to get emotion trends:', error);
      return {};
    }
  }

  private async getLearningInsights(): Promise<any> {
    try {
      const learningEventTypes = await this.getAllQuery(`
        SELECT 
          event_type,
          COUNT(*) as count
        FROM learning_events 
        GROUP BY event_type 
        ORDER BY count DESC
      `);

      const recentLearning = await this.getAllQuery(`
        SELECT 
          event_type,
          description,
          timestamp
        FROM learning_events 
        ORDER BY timestamp DESC 
        LIMIT 20
      `);

      return {
        event_types: learningEventTypes,
        recent_events: recentLearning
      };
    } catch (error) {
      console.error('Failed to get learning insights:', error);
      return {};
    }
  }

  private async getPeakActivityHours(): Promise<any> {
    try {
      const hourlyActivity = await this.getAllQuery(`
        SELECT 
          strftime('%H', timestamp) as hour,
          COUNT(*) as activity_count
        FROM messages 
        GROUP BY strftime('%H', timestamp)
        ORDER BY activity_count DESC
      `);

      return hourlyActivity;
    } catch (error) {
      console.error('Failed to get peak activity hours:', error);
      return [];
    }
  }

  private async getResponseQualityMetrics(): Promise<any> {
    try {
      const qualityMetrics = await this.getQuery(`
        SELECT 
          AVG(satisfaction_score) as avg_satisfaction,
          COUNT(CASE WHEN satisfaction_score >= 4 THEN 1 END) as high_quality,
          COUNT(CASE WHEN satisfaction_score <= 2 THEN 1 END) as low_quality,
          COUNT(*) as total_rated
        FROM conversations 
        WHERE satisfaction_score IS NOT NULL
      `);

      const satisfactionTrends = await this.getAllQuery(`
        SELECT 
          DATE(timestamp) as date,
          AVG(satisfaction_score) as avg_satisfaction
        FROM conversations 
        WHERE satisfaction_score IS NOT NULL 
        AND timestamp >= datetime('now', '-30 days')
        GROUP BY DATE(timestamp) 
        ORDER BY date DESC
      `);

      return {
        metrics: qualityMetrics,
        trends: satisfactionTrends
      };
    } catch (error) {
      console.error('Failed to get response quality metrics:', error);
      return {};
    }
  }

  // Configuration Management Methods
  async saveConfiguration(config: Omit<Configuration, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const id = `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    await this.runQuery(`
      INSERT OR REPLACE INTO configurations (id, key, value, type, description, category, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, config.key, config.value, config.type, config.description || '', config.category, now, now]);
    
    return id;
  }

  async getConfiguration(id: string): Promise<Configuration | null> {
    const config = await this.getQuery('SELECT * FROM configurations WHERE id = ?', [id]);
    return config as Configuration | null;
  }

  async getConfigurationByKey(key: string, category?: string): Promise<Configuration | null> {
    const query = category 
      ? 'SELECT * FROM configurations WHERE key = ? AND category = ?'
      : 'SELECT * FROM configurations WHERE key = ?';
    const params = category ? [key, category] : [key];
    
    const config = await this.getQuery(query, params);
    return config as Configuration | null;
  }

  async getAllConfigurations(category?: string, search?: string): Promise<Configuration[]> {
    let query = 'SELECT * FROM configurations';
    const params: any[] = [];
    const conditions: string[] = [];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (search) {
      conditions.push('(key LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY category, key';
    
    const configs = await this.getAllQuery(query, params);
    return configs as Configuration[];
  }

  async updateConfiguration(id: string, updates: Partial<Omit<Configuration, 'id' | 'created_at'>>): Promise<void> {
    const now = new Date().toISOString();
    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at');
    
    if (fields.length === 0) return;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updates as any)[field]);
    values.push(now, id);

    await this.runQuery(`
      UPDATE configurations 
      SET ${setClause}, updated_at = ?
      WHERE id = ?
    `, values);
  }

  async deleteConfiguration(id: string): Promise<void> {
    await this.runQuery('DELETE FROM configurations WHERE id = ?', [id]);
  }

  async getConfigurationStats(): Promise<ConfigurationStats> {
    const total = await this.getQuery('SELECT COUNT(*) as count FROM configurations');
    const byCategory = await this.getAllQuery(`
      SELECT category, COUNT(*) as count 
      FROM configurations 
      GROUP BY category 
      ORDER BY category
    `);

    const categoryMap: Record<string, number> = {};
    byCategory.forEach((row: any) => {
      categoryMap[row.category] = row.count;
    });

    return {
      total: total?.count || 0,
      byCategory: categoryMap
    };
  }

  async migrateJsonToDatabase(jsonData: Record<string, any>, category: string): Promise<number> {
    let migratedCount = 0;
    const now = new Date().toISOString();

    for (const [key, value] of Object.entries(jsonData)) {
      try {
        const id = `migrated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        let type: string;
        let serializedValue: string;

        if (typeof value === 'string') {
          type = 'string';
          serializedValue = JSON.stringify(value);
        } else if (typeof value === 'number') {
          type = 'number';
          serializedValue = JSON.stringify(value);
        } else if (typeof value === 'boolean') {
          type = 'boolean';
          serializedValue = JSON.stringify(value);
        } else if (Array.isArray(value)) {
          type = 'array';
          serializedValue = JSON.stringify(value);
        } else if (typeof value === 'object' && value !== null) {
          type = 'object';
          serializedValue = JSON.stringify(value);
        } else {
          type = 'string';
          serializedValue = JSON.stringify(String(value));
        }

        const description = `Migrated from ${category}.json`;

        await this.runQuery(`
          INSERT OR REPLACE INTO configurations (id, key, value, type, description, category, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, key, serializedValue, type, description, category, now, now]);

        migratedCount++;
      } catch (error) {
        console.error(`Error migrating key ${key} from ${category}:`, error);
      }
    }

    return migratedCount;
  }

  async clearAllConfigurations(): Promise<void> {
    await this.runQuery('DELETE FROM configurations');
  }
}
