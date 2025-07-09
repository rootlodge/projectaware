import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface CacheEntry {
  key: string;
  prompt: string;
  response: string;
  model: string;
  temperature: number;
  timestamp: string;
  hits: number;
  last_accessed: string;
}

export interface CacheStats {
  total_entries: number;
  total_hits: number;
  total_misses: number;
  hit_rate: number;
  cache_size_mb: number;
  oldest_entry: string;
  newest_entry: string;
}

export class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();
  private cachePath: string;
  private maxEntries: number = 1000;
  private maxSizeMB: number = 10;
  private hits: number = 0;
  private misses: number = 0;

  constructor() {
    this.cachePath = path.join(process.cwd(), 'src', 'lib', 'cache', 'responses.json');
    this.loadCache();
  }

  private loadCache(): void {
    try {
      const cacheData = fs.readFileSync(this.cachePath, 'utf-8');
      const cacheObject = JSON.parse(cacheData);
      
      // Convert object back to Map
      this.cache = new Map(Object.entries(cacheObject.entries || {}));
      this.hits = cacheObject.hits || 0;
      this.misses = cacheObject.misses || 0;
      
      console.log(`Loaded ${this.cache.size} cache entries`);
    } catch (error) {
      console.warn('Cache file not found, starting with empty cache');
      this.cache = new Map();
      this.hits = 0;
      this.misses = 0;
    }
  }

  private saveCache(): void {
    try {
      // Ensure cache directory exists
      const cacheDir = path.dirname(this.cachePath);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      // Convert Map to object for JSON serialization
      const cacheObject = {
        entries: Object.fromEntries(this.cache),
        hits: this.hits,
        misses: this.misses,
        last_saved: new Date().toISOString()
      };

      fs.writeFileSync(this.cachePath, JSON.stringify(cacheObject, null, 2));
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  }

  private generateKey(prompt: string, model: string, temperature: number): string {
    const normalized = {
      prompt: prompt.trim().toLowerCase(),
      model,
      temperature: Math.round(temperature * 100) / 100 // Round to 2 decimal places
    };
    
    return crypto.createHash('md5').update(JSON.stringify(normalized)).digest('hex');
  }

  private calculateSize(): number {
    const jsonString = JSON.stringify(Object.fromEntries(this.cache));
    return Buffer.byteLength(jsonString, 'utf8') / (1024 * 1024); // MB
  }

  private cleanupCache(): void {
    const currentSize = this.calculateSize();
    
    // Remove entries if cache is too large or has too many entries
    if (this.cache.size > this.maxEntries || currentSize > this.maxSizeMB) {
      // Sort by last accessed (oldest first)
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => new Date(a.last_accessed).getTime() - new Date(b.last_accessed).getTime());
      
      // Remove oldest entries
      const removeCount = Math.max(
        this.cache.size - this.maxEntries,
        Math.floor(this.cache.size * 0.1) // Remove 10% if size limit exceeded
      );
      
      for (let i = 0; i < removeCount; i++) {
        const [key] = sortedEntries[i];
        this.cache.delete(key);
      }
      
      console.log(`Cleaned up ${removeCount} cache entries`);
      this.saveCache();
    }
  }

  get(prompt: string, model: string, temperature: number): CacheEntry | null {
    const key = this.generateKey(prompt, model, temperature);
    const entry = this.cache.get(key);
    
    if (entry) {
      // Update access statistics
      entry.hits++;
      entry.last_accessed = new Date().toISOString();
      this.hits++;
      
      console.log(`Cache hit for key: ${key.substring(0, 8)}...`);
      return entry;
    }
    
    this.misses++;
    console.log(`Cache miss for key: ${key.substring(0, 8)}...`);
    return null;
  }

  set(prompt: string, response: string, model: string, temperature: number): void {
    const key = this.generateKey(prompt, model, temperature);
    const now = new Date().toISOString();
    
    const entry: CacheEntry = {
      key,
      prompt,
      response,
      model,
      temperature,
      timestamp: now,
      hits: 0,
      last_accessed: now
    };
    
    this.cache.set(key, entry);
    
    // Cleanup if needed
    this.cleanupCache();
    
    // Save cache periodically
    if (this.cache.size % 10 === 0) {
      this.saveCache();
    }
    
    console.log(`Cached response for key: ${key.substring(0, 8)}...`);
  }

  shouldCache(prompt: string, response: string): boolean {
    // Don't cache very short or very long prompts
    if (prompt.length < 20 || prompt.length > 5000) {
      return false;
    }
    
    // Don't cache very short responses
    if (response.length < 10) {
      return false;
    }
    
    // Don't cache error responses
    if (response.includes('Unable to process request') || 
        response.includes('Error') || 
        response.includes('No factual information available')) {
      return false;
    }
    
    // Don't cache responses with current timestamps or user-specific info
    const userSpecificPatterns = [
      /\b\d{4}-\d{2}-\d{2}\b/, // dates
      /\b\d{2}:\d{2}:\d{2}\b/, // times
      /\buser\b/i,
      /\byou\b/i,
      /\btoday\b/i,
      /\bnow\b/i
    ];
    
    if (userSpecificPatterns.some(pattern => pattern.test(response))) {
      return false;
    }
    
    return true;
  }

  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const hitRate = this.hits + this.misses > 0 ? this.hits / (this.hits + this.misses) : 0;
    
    let oldestEntry = '';
    let newestEntry = '';
    
    if (entries.length > 0) {
      const sortedByTime = entries.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      oldestEntry = sortedByTime[0].timestamp;
      newestEntry = sortedByTime[sortedByTime.length - 1].timestamp;
    }
    
    return {
      total_entries: this.cache.size,
      total_hits: totalHits,
      total_misses: this.misses,
      hit_rate: hitRate,
      cache_size_mb: this.calculateSize(),
      oldest_entry: oldestEntry,
      newest_entry: newestEntry
    };
  }

  clearCache(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.saveCache();
    console.log('Cache cleared');
  }

  removeEntry(key: string): boolean {
    const removed = this.cache.delete(key);
    if (removed) {
      this.saveCache();
      console.log(`Removed cache entry: ${key.substring(0, 8)}...`);
    }
    return removed;
  }

  exportCache(): string {
    return JSON.stringify({
      entries: Object.fromEntries(this.cache),
      stats: this.getStats(),
      exported_at: new Date().toISOString()
    }, null, 2);
  }

  importCache(cacheData: string): void {
    try {
      const imported = JSON.parse(cacheData);
      this.cache = new Map(Object.entries(imported.entries || {}));
      this.saveCache();
      console.log(`Imported ${this.cache.size} cache entries`);
    } catch (error) {
      console.error('Error importing cache:', error);
      throw error;
    }
  }

  getTopQueries(limit: number = 10): Array<{
    prompt: string;
    hits: number;
    model: string;
    last_accessed: string;
  }> {
    return Array.from(this.cache.values())
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit)
      .map(entry => ({
        prompt: entry.prompt.substring(0, 100) + '...',
        hits: entry.hits,
        model: entry.model,
        last_accessed: entry.last_accessed
      }));
  }

  getRecentQueries(limit: number = 10): Array<{
    prompt: string;
    response: string;
    model: string;
    timestamp: string;
  }> {
    return Array.from(this.cache.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
      .map(entry => ({
        prompt: entry.prompt.substring(0, 100) + '...',
        response: entry.response.substring(0, 200) + '...',
        model: entry.model,
        timestamp: entry.timestamp
      }));
  }

  optimizeCache(): void {
    // Remove entries with no hits after a certain time
    const cutoffTime = new Date();
    cutoffTime.setDate(cutoffTime.getDate() - 7); // 7 days ago
    
    let removedCount = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits === 0 && new Date(entry.timestamp) < cutoffTime) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`Optimized cache: removed ${removedCount} unused entries`);
      this.saveCache();
    }
  }

  // Save cache on process exit
  destroy(): void {
    this.saveCache();
  }
}
