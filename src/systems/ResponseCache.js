const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

class ResponseCache {
  constructor() {
    this.cacheDir = path.join(__dirname, 'cache');
    this.cacheFile = path.join(this.cacheDir, 'responses.json');
    this.metadataFile = path.join(this.cacheDir, 'metadata.json');
    this.maxCacheSize = 1000; // Maximum number of cached responses
    this.maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    this.hitCount = 0;
    this.missCount = 0;
    
    this.cache = new Map();
    this.metadata = {
      created: new Date().toISOString(),
      lastCleanup: new Date().toISOString(),
      totalHits: 0,
      totalMisses: 0,
      cacheSize: 0
    };
    
    this.initializeCache();
  }
  
  initializeCache() {
    try {
      // Ensure cache directory exists
      fs.ensureDirSync(this.cacheDir);
      
      // Load existing cache if it exists
      if (fs.existsSync(this.cacheFile)) {
        const cacheData = fs.readFileSync(this.cacheFile, 'utf-8');
        const entries = JSON.parse(cacheData);
        
        // Convert array back to Map
        this.cache = new Map(entries);
        logger.info(`[Cache] Loaded ${this.cache.size} cached responses`);
      }
      
      // Load metadata if it exists
      if (fs.existsSync(this.metadataFile)) {
        const metadataData = fs.readFileSync(this.metadataFile, 'utf-8');
        this.metadata = { ...this.metadata, ...JSON.parse(metadataData) };
      }
      
      // Clean up expired entries
      this.cleanup();
      
    } catch (err) {
      logger.error('[Cache] Failed to initialize cache:', err.message);
    }
  }
  
  /**
   * Generate a cache key for a prompt
   * @param {string} prompt - The prompt to generate a key for
   * @param {string} model - The model used (optional)
   * @param {number} temperature - The temperature used (optional)
   * @returns {string} Cache key
   */
  generateKey(prompt, model = 'default', temperature = 0.3) {
    const normalizedPrompt = prompt.trim().toLowerCase();
    const keyData = `${normalizedPrompt}:${model}:${temperature}`;
    return crypto.createHash('sha256').update(keyData).digest('hex');
  }
  
  /**
   * Check if a response is cached
   * @param {string} prompt - The prompt to check
   * @param {string} model - The model used (optional)
   * @param {number} temperature - The temperature used (optional)
   * @returns {Object|null} Cached response or null if not found
   */
  get(prompt, model = 'default', temperature = 0.3) {
    const key = this.generateKey(prompt, model, temperature);
    const cached = this.cache.get(key);
    
    if (!cached) {
      this.missCount++;
      this.metadata.totalMisses++;
      return null;
    }
    
    // Check if cache entry is expired
    const now = Date.now();
    if (now - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      this.missCount++;
      this.metadata.totalMisses++;
      logger.debug(`[Cache] Expired entry removed for key: ${key.substring(0, 8)}...`);
      return null;
    }
    
    // Update access time and hit count
    cached.lastAccessed = now;
    cached.hitCount++;
    
    this.hitCount++;
    this.metadata.totalHits++;
    
    logger.debug(`[Cache] Cache hit for key: ${key.substring(0, 8)}... (${cached.hitCount} hits)`);
    
    return {
      response: cached.response,
      model: cached.model,
      temperature: cached.temperature,
      timestamp: cached.timestamp,
      hitCount: cached.hitCount
    };
  }
  
  /**
   * Cache a response
   * @param {string} prompt - The prompt that generated the response
   * @param {string} response - The response to cache
   * @param {string} model - The model used (optional)
   * @param {number} temperature - The temperature used (optional)
   */
  set(prompt, response, model = 'default', temperature = 0.3) {
    if (!prompt || !response) {
      return;
    }
    
    const key = this.generateKey(prompt, model, temperature);
    const now = Date.now();
    
    // Check if we need to make room in cache
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldest();
    }
    
    const cacheEntry = {
      prompt: prompt.trim(),
      response: response.trim(),
      model: model,
      temperature: temperature,
      timestamp: now,
      lastAccessed: now,
      hitCount: 0
    };
    
    this.cache.set(key, cacheEntry);
    this.metadata.cacheSize = this.cache.size;
    
    logger.debug(`[Cache] Cached response for key: ${key.substring(0, 8)}... (cache size: ${this.cache.size})`);
    
    // Save cache periodically
    if (this.cache.size % 10 === 0) {
      this.saveCache();
    }
  }
  
  /**
   * Evict the oldest entries from cache
   */
  evictOldest() {
    const entries = Array.from(this.cache.entries());
    
    // Sort by last accessed time (oldest first)
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    // Remove the oldest 10% of entries
    const toRemove = Math.floor(this.maxCacheSize * 0.1);
    
    for (let i = 0; i < toRemove && entries.length > 0; i++) {
      const [key] = entries[i];
      this.cache.delete(key);
      logger.debug(`[Cache] Evicted old entry: ${key.substring(0, 8)}...`);
    }
  }
  
  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    const toDelete = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        toDelete.push(key);
      }
    }
    
    for (const key of toDelete) {
      this.cache.delete(key);
    }
    
    if (toDelete.length > 0) {
      logger.info(`[Cache] Cleaned up ${toDelete.length} expired entries`);
    }
    
    this.metadata.lastCleanup = new Date().toISOString();
    this.metadata.cacheSize = this.cache.size;
  }
  
  /**
   * Save cache to disk
   */
  saveCache() {
    try {
      fs.ensureDirSync(this.cacheDir);
      
      // Convert Map to array for JSON serialization
      const cacheArray = Array.from(this.cache.entries());
      fs.writeFileSync(this.cacheFile, JSON.stringify(cacheArray, null, 2));
      
      // Save metadata
      this.metadata.cacheSize = this.cache.size;
      fs.writeFileSync(this.metadataFile, JSON.stringify(this.metadata, null, 2));
      
      logger.debug(`[Cache] Saved ${this.cache.size} entries to disk`);
    } catch (err) {
      logger.error('[Cache] Failed to save cache:', err.message);
    }
  }
  
  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0;
    
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: hitRate.toFixed(1) + '%',
      totalHits: this.metadata.totalHits,
      totalMisses: this.metadata.totalMisses,
      totalRequests: totalRequests,
      created: this.metadata.created,
      lastCleanup: this.metadata.lastCleanup
    };
  }
  
  /**
   * Get cache entries sorted by various criteria
   * @param {string} sortBy - Sort criteria ('hits', 'recent', 'oldest')
   * @param {number} limit - Maximum number of entries to return
   * @returns {Array} Sorted cache entries
   */
  getEntries(sortBy = 'hits', limit = 10) {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key: key.substring(0, 8) + '...',
      prompt: entry.prompt.substring(0, 50) + '...',
      response: entry.response.substring(0, 100) + '...',
      model: entry.model,
      temperature: entry.temperature,
      timestamp: new Date(entry.timestamp).toLocaleString(),
      lastAccessed: new Date(entry.lastAccessed).toLocaleString(),
      hitCount: entry.hitCount
    }));
    
    switch (sortBy) {
      case 'hits':
        entries.sort((a, b) => b.hitCount - a.hitCount);
        break;
      case 'recent':
        entries.sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed));
        break;
      case 'oldest':
        entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        break;
    }
    
    return entries.slice(0, limit);
  }
  
  /**
   * Clear all cached responses
   */
  clear() {
    this.cache.clear();
    this.metadata.cacheSize = 0;
    
    try {
      if (fs.existsSync(this.cacheFile)) {
        fs.unlinkSync(this.cacheFile);
      }
      if (fs.existsSync(this.metadataFile)) {
        fs.unlinkSync(this.metadataFile);
      }
      logger.info('[Cache] Cache cleared successfully');
    } catch (err) {
      logger.error('[Cache] Failed to clear cache files:', err.message);
    }
  }
  
  /**
   * Check if a prompt is worth caching based on various criteria
   * @param {string} prompt - The prompt to evaluate
   * @param {string} response - The response to evaluate
   * @returns {boolean} Whether the response should be cached
   */
  shouldCache(prompt, response) {
    // Don't cache if prompt or response is too short
    if (prompt.length < 10 || response.length < 10) {
      return false;
    }
    
    // Don't cache if response is too long (might be unique)
    if (response.length > 5000) {
      return false;
    }
    
    // Don't cache if prompt contains time-sensitive information
    const timeSensitivePatterns = [
      /\b(now|today|yesterday|tomorrow|current|latest|recent)\b/i,
      /\b(time|date|timestamp|moment)\b/i,
      /\b\d{4}-\d{2}-\d{2}\b/, // Date patterns
      /\b\d{1,2}:\d{2}\b/ // Time patterns
    ];
    
    for (const pattern of timeSensitivePatterns) {
      if (pattern.test(prompt)) {
        return false;
      }
    }
    
    // Don't cache if response contains time-sensitive information
    for (const pattern of timeSensitivePatterns) {
      if (pattern.test(response)) {
        return false;
      }
    }
    
    // Don't cache if prompt is asking for user-specific information
    const userSpecificPatterns = [
      /\b(user|you|your|my|me|i|dylan)\b/i,
      /\b(personal|private|individual)\b/i
    ];
    
    for (const pattern of userSpecificPatterns) {
      if (pattern.test(prompt)) {
        return false;
      }
    }
    
    return true;
  }
}

module.exports = ResponseCache;
