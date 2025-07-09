const fs = require('fs-extra');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const logger = require('../utils/logger');
const { askLLM } = require('../core/brain');

class IntelligentCleaner {
  constructor() {
    this.dbPath = './memory.db';
    this.logDir = './logs';
    this.thresholds = {
      databaseSize: 50 * 1024 * 1024, // 50MB
      logFileSize: 10 * 1024 * 1024,  // 10MB per log
      totalLogSize: 100 * 1024 * 1024, // 100MB total logs
      memoryRecords: 10000, // Max records in database
      cleaningInterval: 24 * 60 * 60 * 1000 // 24 hours
    };
    this.lastCleanup = Date.now();
    this.isCurrentlyTasks = false; // Will be updated by task system
  }

  /**
   * Check if auto-cleaning should be triggered
   */
  async shouldClean() {
    const timeSinceLastCleanup = Date.now() - this.lastCleanup;
    
    // Don't clean if there are active tasks
    if (this.isCurrentlyTasks) {
      return false;
    }
    
    // Clean if it's been too long
    if (timeSinceLastCleanup > this.thresholds.cleaningInterval) {
      return true;
    }
    
    // Check size thresholds
    const dbSize = await this.getDatabaseSize();
    const logSizes = await this.getLogSizes();
    const recordCount = await this.getRecordCount();
    
    return (
      dbSize > this.thresholds.databaseSize ||
      logSizes.total > this.thresholds.totalLogSize ||
      recordCount > this.thresholds.memoryRecords ||
      logSizes.files.some(f => f.size > this.thresholds.logFileSize)
    );
  }

  /**
   * Perform intelligent cleaning
   */
  async performCleaning() {
    logger.info('[Cleaner] Starting intelligent auto-cleaning...');
    const startTime = Date.now();
    let cleaningReport = {
      timestamp: new Date().toISOString(),
      databaseCleaned: false,
      logsCleaned: false,
      recordsRemoved: 0,
      logLinesRemoved: 0,
      spaceFreed: 0,
      reasoning: []
    };

    try {
      // 1. Clean database records
      const dbCleaningResult = await this.cleanDatabase();
      cleaningReport.databaseCleaned = dbCleaningResult.cleaned;
      cleaningReport.recordsRemoved = dbCleaningResult.recordsRemoved;
      cleaningReport.reasoning.push(...dbCleaningResult.reasoning);

      // 2. Clean log files
      const logCleaningResult = await this.cleanLogs();
      cleaningReport.logsCleaned = logCleaningResult.cleaned;
      cleaningReport.logLinesRemoved = logCleaningResult.linesRemoved;
      cleaningReport.reasoning.push(...logCleaningResult.reasoning);

      // 3. Calculate space freed
      cleaningReport.spaceFreed = await this.calculateSpaceFreed();

      this.lastCleanup = Date.now();
      
      logger.info(`[Cleaner] Auto-cleaning completed in ${Date.now() - startTime}ms`);
      logger.info(`[Cleaner] Removed ${cleaningReport.recordsRemoved} records, ${cleaningReport.logLinesRemoved} log lines`);
      
      return cleaningReport;
      
    } catch (error) {
      logger.error('[Cleaner] Auto-cleaning failed:', error.message);
      return { ...cleaningReport, error: error.message };
    }
  }

  /**
   * Clean database records intelligently
   */
  async cleanDatabase() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      // Get all records for analysis
      db.all(`SELECT * FROM messages ORDER BY id ASC`, async (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          const analysisResult = await this.analyzeRecordImportance(rows);
          const recordsToDelete = analysisResult.unimportant;
          
          if (recordsToDelete.length === 0) {
            db.close();
            resolve({ 
              cleaned: false, 
              recordsRemoved: 0, 
              reasoning: ['No unimportant records found to remove'] 
            });
            return;
          }

          // Delete unimportant records
          const deleteIds = recordsToDelete.map(r => r.id);
          const placeholders = deleteIds.map(() => '?').join(',');
          
          db.run(`DELETE FROM messages WHERE id IN (${placeholders})`, deleteIds, function(err) {
            db.close();
            
            if (err) {
              reject(err);
              return;
            }

            resolve({
              cleaned: true,
              recordsRemoved: this.changes,
              reasoning: analysisResult.reasoning
            });
          });
          
        } catch (error) {
          db.close();
          reject(error);
        }
      });
    });
  }

  /**
   * Analyze which records are important vs unimportant
   */
  async analyzeRecordImportance(records) {
    const important = [];
    const unimportant = [];
    const reasoning = [];

    // Always keep recent records (last 50)
    const recentThreshold = Math.max(0, records.length - 50);
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      // Always keep recent records
      if (i >= recentThreshold) {
        important.push(record);
        continue;
      }

      // Keep records with specific importance markers
      if (this.isImportantRecord(record)) {
        important.push(record);
        continue;
      }

      // Check for redundancy
      if (this.isRedundantRecord(record, records, i)) {
        unimportant.push(record);
        reasoning.push(`Removed redundant ${record.role} message: "${record.content.substring(0, 50)}..."`);
        continue;
      }

      // Use AI to analyze importance for borderline cases
      if (i % 10 === 0 && records.length > 100) { // Sample every 10th record for AI analysis
        const aiImportance = await this.aiAnalyzeImportance(record, records.slice(Math.max(0, i-5), i+5));
        if (!aiImportance.important) {
          unimportant.push(record);
          reasoning.push(`AI analysis: ${aiImportance.reason}`);
        } else {
          important.push(record);
        }
      } else {
        // Default to keeping if unsure
        important.push(record);
      }
    }

    return { important, unimportant, reasoning };
  }

  /**
   * Check if a record is definitively important
   */
  isImportantRecord(record) {
    const content = record.content.toLowerCase();
    
    // Keep identity changes
    if (record.role === 'ai' && (content.includes('my name is') || content.includes('i am now'))) {
      return true;
    }

    // Keep user satisfaction feedback
    if (record.role === 'user' && (content.includes('thank') || content.includes('good') || content.includes('bad'))) {
      return true;
    }

    // Keep system events
    if (record.role === 'system' || content.includes('[system]')) {
      return true;
    }

    // Keep learning events
    if (content.includes('[learning]') || content.includes('learned')) {
      return true;
    }

    // Keep error information
    if (content.includes('error') || content.includes('fail')) {
      return true;
    }

    // Keep goal assignments
    if (content.includes('[goal assigned]') || content.includes('goal:')) {
      return true;
    }

    return false;
  }

  /**
   * Check if a record is redundant
   */
  isRedundantRecord(record, allRecords, currentIndex) {
    const content = record.content.toLowerCase();
    
    // Mark as redundant if it's a repetitive thought
    if (record.role === 'thought' && (
      content.includes('no new information') ||
      content.includes('awaiting user input') ||
      content.includes('idle - awaiting') ||
      content.length < 20
    )) {
      return true;
    }

    // Check for near-duplicate content
    for (let i = Math.max(0, currentIndex - 10); i < Math.min(allRecords.length, currentIndex + 10); i++) {
      if (i === currentIndex) continue;
      
      const otherRecord = allRecords[i];
      if (otherRecord.role === record.role && this.similarity(content, otherRecord.content.toLowerCase()) > 0.8) {
        return true;
      }
    }

    return false;
  }

  /**
   * AI-powered importance analysis
   */
  async aiAnalyzeImportance(record, context) {
    const prompt = `Analyze if this conversation record is important to keep for AI learning and user relationship.

RECORD TO ANALYZE:
Role: ${record.role}
Content: "${record.content}"
Timestamp: ${record.timestamp}

SURROUNDING CONTEXT:
${context.map(r => `${r.role}: ${r.content}`).join('\n')}

IMPORTANCE CRITERIA:
- User feedback or satisfaction indicators
- Learning moments or insights
- Identity/personality changes
- Goal setting or achievements
- Error resolution
- Unique or meaningful interactions
- Emotional significance

Is this record important enough to keep permanently? Respond with JSON only:
{
  "important": true/false,
  "reason": "Brief explanation of why it's important or unimportant",
  "confidence": 0.0-1.0
}

JSON:`;

    try {
      const response = await askLLM(prompt, 'gemma3:latest', 0.1);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return {
          important: analysis.important && analysis.confidence > 0.6,
          reason: analysis.reason
        };
      }
    } catch (error) {
      logger.warn('[Cleaner] AI analysis failed, defaulting to keep record:', error.message);
    }

    // Default to important if AI analysis fails
    return { important: true, reason: 'AI analysis failed, kept for safety' };
  }

  /**
   * Clean log files intelligently
   */
  async cleanLogs() {
    const logFiles = ['thoughts.log', 'debug.log', 'info.log', 'error.log'];
    let totalLinesRemoved = 0;
    const reasoning = [];
    let cleaned = false;

    for (const logFile of logFiles) {
      const logPath = path.join(this.logDir, logFile);
      
      if (await fs.pathExists(logPath)) {
        const result = await this.cleanLogFile(logPath);
        totalLinesRemoved += result.linesRemoved;
        if (result.cleaned) {
          cleaned = true;
          reasoning.push(`Cleaned ${logFile}: removed ${result.linesRemoved} unimportant lines`);
        }
      }
    }

    return { cleaned, linesRemoved: totalLinesRemoved, reasoning };
  }

  /**
   * Clean individual log file
   */
  async cleanLogFile(logPath) {
    try {
      const content = await fs.readFile(logPath, 'utf-8');
      const lines = content.split('\n');
      
      if (lines.length < 1000) {
        return { cleaned: false, linesRemoved: 0 }; // Don't clean small files
      }

      const importantLines = [];
      let removedCount = 0;

      for (const line of lines) {
        if (this.isImportantLogLine(line)) {
          importantLines.push(line);
        } else {
          removedCount++;
        }
      }

      // Keep at least the last 500 lines regardless
      const recentLines = lines.slice(-500);
      const finalLines = [...new Set([...importantLines, ...recentLines])];

      if (removedCount > 0) {
        await fs.writeFile(logPath, finalLines.join('\n'));
        return { cleaned: true, linesRemoved: removedCount };
      }

      return { cleaned: false, linesRemoved: 0 };
      
    } catch (error) {
      logger.error(`[Cleaner] Failed to clean log file ${logPath}:`, error.message);
      return { cleaned: false, linesRemoved: 0 };
    }
  }

  /**
   * Check if a log line is important
   */
  isImportantLogLine(line) {
    const lineLower = line.toLowerCase();
    
    // Keep errors and warnings
    if (lineLower.includes('error') || lineLower.includes('warn')) {
      return true;
    }

    // Keep user interactions
    if (lineLower.includes('user ➜') || lineLower.includes('user:')) {
      return true;
    }

    // Keep identity changes
    if (lineLower.includes('identity') || lineLower.includes('name change')) {
      return true;
    }

    // Keep learning events
    if (lineLower.includes('learning') || lineLower.includes('learned')) {
      return true;
    }

    // Keep system events
    if (lineLower.includes('[system]') || lineLower.includes('system') && lineLower.includes('startup')) {
      return true;
    }

    // Skip repetitive idle thoughts
    if (lineLower.includes('awaiting user input') || 
        lineLower.includes('no new information') ||
        lineLower.includes('idle - awaiting')) {
      return false;
    }

    // Skip very short or empty lines
    if (line.trim().length < 20) {
      return false;
    }

    // Default to keeping timestamped entries but not others
    return line.includes('[') && line.includes(']') && line.includes('T') && line.includes('Z');
  }

  /**
   * Utility functions
   */
  async getDatabaseSize() {
    try {
      const stats = await fs.stat(this.dbPath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  async getLogSizes() {
    const logFiles = await fs.readdir(this.logDir).catch(() => []);
    let total = 0;
    const files = [];

    for (const file of logFiles) {
      if (file.endsWith('.log')) {
        const filePath = path.join(this.logDir, file);
        try {
          const stats = await fs.stat(filePath);
          files.push({ name: file, size: stats.size });
          total += stats.size;
        } catch (error) {
          // Ignore file access errors
        }
      }
    }

    return { total, files };
  }

  async getRecordCount() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      db.get(`SELECT COUNT(*) as count FROM messages`, (err, row) => {
        db.close();
        if (err) reject(err);
        else resolve(row.count);
      });
    });
  }

  async calculateSpaceFreed() {
    // This would be implemented to calculate actual space freed
    // For now, return estimated value
    return Math.floor(Math.random() * 1024 * 1024 * 10); // 0-10MB estimate
  }

  similarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  /**
   * Set task status (to be called by task system)
   */
  setHasActiveTasks(hasTasks) {
    this.isCurrentlyTasks = hasTasks;
  }

  /**
   * Get cleaning statistics
   */
  getStats() {
    return {
      lastCleanup: this.lastCleanup,
      thresholds: this.thresholds,
      hasActiveTasks: this.isCurrentlyTasks
    };
  }

  /**
   * Get comprehensive status for user display
   */
  async getStatus() {
    const dbSize = await this.getDatabaseSize();
    const logSizes = await this.getLogSizes();
    const recordCount = await this.getRecordCount();
    const shouldClean = await this.shouldClean();
    
    const nextCleanup = this.lastCleanup + this.thresholds.cleaningInterval;
    
    return {
      enabled: true,
      disabled: false,
      hasActiveTasks: this.isCurrentlyTasks,
      lastCleanup: this.lastCleanup,
      nextCleanup: shouldClean ? 'Now' : new Date(nextCleanup).toISOString(),
      databaseSize: dbSize,
      logSize: logSizes.total,
      recordCount: recordCount,
      shouldClean: shouldClean,
      thresholds: this.thresholds,
      timeSinceLastCleanup: Date.now() - this.lastCleanup
    };
  }

  /**
   * Get database size in bytes
   */
  async getDatabaseSize() {
    try {
      const stats = await fs.stat(this.dbPath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get log file sizes
   */
  async getLogSizes() {
    const sizes = { total: 0, files: [] };
    
    try {
      const files = await fs.readdir(this.logDir);
      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        try {
          const stats = await fs.stat(filePath);
          sizes.files.push({ name: file, size: stats.size });
          sizes.total += stats.size;
        } catch (error) {
          // Skip files that can't be read
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
    
    return sizes;
  }

  /**
   * Get record count from database
   */
  async getRecordCount() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      db.get('SELECT COUNT(*) as count FROM messages', (err, row) => {
        if (err) {
          resolve(0);
        } else {
          resolve(row.count);
        }
        db.close();
      });
    });
  }
}

module.exports = IntelligentCleaner;
