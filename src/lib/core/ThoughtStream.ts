import { EventEmitter } from 'events';

export interface ThoughtEvent {
  timestamp: string;
  type: 'reasoning' | 'decision' | 'confidence' | 'tree' | 'reflection' | 'thought' | 'action' | 'emotion' | 'memory' | 'goal' | 'system' | 'user_interaction' | 'learning' | 'error' | 'insight' | 'prediction';
  content: string;
  confidence?: number;
  details?: {
    goalId?: string;
    relatedEmotions?: string[];
    outcome?: string;
    effectiveness?: number;
    agentId?: string;
    memoryType?: 'episodic' | 'semantic' | 'procedural' | 'working';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
    context?: string;
    userId?: string;
    sessionId?: string;
    duration?: number;
    reasoning?: string[];
    alternatives?: string[];
    impact?: 'none' | 'minor' | 'moderate' | 'major' | 'critical';
    learningType?: 'pattern' | 'correction' | 'reinforcement' | 'exploration';
    errorType?: 'syntax' | 'logic' | 'data' | 'network' | 'user' | 'system';
    predictionAccuracy?: number;
    sources?: string[];
    relatedEvents?: string[];
  };
}

/**
 * ThoughtStream is a singleton event emitter for real-time thought process streaming.
 * It provides comprehensive cognitive event tracking and visualization capabilities.
 */
export class ThoughtStream extends EventEmitter {
  private static instance: ThoughtStream | null = null;
  private history: ThoughtEvent[] = [];
  private maxHistory = 1000;
  private isRecording = true;
  private filters: Set<string> = new Set();
  private sessionId: string = '';

  private constructor() {
    super();
    this.sessionId = this.generateSessionId();
  }

  public static getInstance(): ThoughtStream {
    if (!ThoughtStream.instance) {
      ThoughtStream.instance = new ThoughtStream();
    }
    return ThoughtStream.instance;
  }

  /**
   * Generate a unique session ID for tracking
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Emit a new thought event and store it in history.
   */
  public log(event: ThoughtEvent) {
    if (!this.isRecording) return;

    // Enhance event with session information
    const enhancedEvent: ThoughtEvent = {
      ...event,
      details: {
        ...event.details,
        sessionId: this.sessionId,
      }
    };

    this.history.push(enhancedEvent);
    
    // Maintain history size limit
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    
    this.emit('thought', enhancedEvent);
  }

  /**
   * Get the current thought history with optional filtering.
   */
  public getHistory(filters?: {
    type?: string;
    timeRange?: { start: string; end: string };
    confidence?: { min: number; max: number };
    tags?: string[];
    priority?: string;
  }): ThoughtEvent[] {
    let filteredHistory = [...this.history];

    if (filters) {
      if (filters.type) {
        filteredHistory = filteredHistory.filter(event => event.type === filters.type);
      }
      
      if (filters.timeRange) {
        const start = new Date(filters.timeRange.start).getTime();
        const end = new Date(filters.timeRange.end).getTime();
        filteredHistory = filteredHistory.filter(event => {
          const eventTime = new Date(event.timestamp).getTime();
          return eventTime >= start && eventTime <= end;
        });
      }
      
      if (filters.confidence) {
        filteredHistory = filteredHistory.filter(event => 
          event.confidence !== undefined && 
          event.confidence >= filters.confidence!.min && 
          event.confidence <= filters.confidence!.max
        );
      }
      
      if (filters.tags && filters.tags.length > 0) {
        filteredHistory = filteredHistory.filter(event => 
          event.details?.tags?.some(tag => filters.tags!.includes(tag))
        );
      }
      
      if (filters.priority) {
        filteredHistory = filteredHistory.filter(event => 
          event.details?.priority === filters.priority
        );
      }
    }

    return filteredHistory;
  }

  /**
   * Get analytics about the thought stream
   */
  public getAnalytics(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    averageConfidence: number;
    sessionDuration: number;
    eventsByPriority: Record<string, number>;
    recentActivity: { timestamp: string; count: number }[];
  } {
    const eventsByType: Record<string, number> = {};
    const eventsByPriority: Record<string, number> = {};
    let totalConfidence = 0;
    let confidenceCount = 0;

    this.history.forEach(event => {
      // Count by type
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      
      // Count by priority
      const priority = event.details?.priority || 'medium';
      eventsByPriority[priority] = (eventsByPriority[priority] || 0) + 1;
      
      // Calculate average confidence
      if (event.confidence !== undefined) {
        totalConfidence += event.confidence;
        confidenceCount++;
      }
    });

    // Calculate recent activity (last hour in 10-minute buckets)
    const now = Date.now();
    const recentActivity = [];
    for (let i = 5; i >= 0; i--) {
      const bucketStart = now - (i + 1) * 10 * 60 * 1000;
      const bucketEnd = now - i * 10 * 60 * 1000;
      const count = this.history.filter(event => {
        const eventTime = new Date(event.timestamp).getTime();
        return eventTime >= bucketStart && eventTime < bucketEnd;
      }).length;
      
      recentActivity.push({
        timestamp: new Date(bucketEnd).toISOString(),
        count
      });
    }

    return {
      totalEvents: this.history.length,
      eventsByType,
      averageConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
      sessionDuration: now - new Date(this.sessionId.split('_')[1]).getTime(),
      eventsByPriority,
      recentActivity
    };
  }

  /**
   * Clear all thought history
   */
  public clearHistory(): void {
    this.history = [];
    this.emit('history-cleared');
  }

  /**
   * Start/stop recording events
   */
  public setRecording(recording: boolean): void {
    this.isRecording = recording;
    this.emit('recording-changed', recording);
  }

  /**
   * Search through thought history
   */
  public search(query: string): ThoughtEvent[] {
    const lowercaseQuery = query.toLowerCase();
    return this.history.filter(event => 
      event.content.toLowerCase().includes(lowercaseQuery) ||
      event.details?.context?.toLowerCase().includes(lowercaseQuery) ||
      event.details?.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * Export thought history as JSON
   */
  public exportHistory(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      exportTime: new Date().toISOString(),
      events: this.history,
      analytics: this.getAnalytics()
    }, null, 2);
  }

  /**
   * Static log property for singleton-style usage (ThoughtStream.log(event))
   */
  public static log(event: ThoughtEvent) {
    ThoughtStream.getInstance().log(event);
  }
}