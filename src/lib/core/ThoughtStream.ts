import { EventEmitter } from 'events';

export interface ThoughtEvent {
  timestamp: string;
  type: 'reasoning' | 'decision' | 'confidence' | 'tree' | 'reflection' | 'thought' | 'action';
  content: string;
  confidence?: number;
  details?: any;
}

/**
 * ThoughtStream is a singleton event emitter for real-time thought process streaming.
 * It is used by the GoalEngine and other cognitive modules to emit and subscribe to internal reasoning events.
 */
export class ThoughtStream extends EventEmitter {
  private static instance: ThoughtStream | null = null;
  private history: ThoughtEvent[] = [];
  private maxHistory = 500;

  private constructor() {
    super();
  }

  public static getInstance(): ThoughtStream {
    if (!ThoughtStream.instance) {
      ThoughtStream.instance = new ThoughtStream();
    }
    return ThoughtStream.instance;
  }

  /**
   * Emit a new thought event and store it in history.
   */
  public log(event: ThoughtEvent) {
    this.history.push(event);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    this.emit('thought', event);
  }

  /**
   * Get the current thought history (for initial dashboard load).
   */
  public getHistory(): ThoughtEvent[] {
    return [...this.history];
  }

  /**
   * Static log property for singleton-style usage (ThoughtStream.log(event))
   */
  public static log(event: ThoughtEvent) {
    ThoughtStream.getInstance().log(event);
  }
}

// (No longer needed: log method is now part of the ThoughtStream class)