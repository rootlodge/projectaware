/**
 * TemporalContextManager: Tracks time-based events, session history, and enables time-aware planning.
 * Part of Advanced Autonomous Intelligence.
 */

export interface TemporalEvent {
  type: string;
  timestamp: string;
  details?: any;
}

export class TemporalContextManager {
  private events: TemporalEvent[] = [];

  logEvent(type: string, details?: any) {
    this.events.push({ type, timestamp: new Date().toISOString(), details });
    if (this.events.length > 500) this.events.shift();
  }

  getRecentEvents(limit = 10): TemporalEvent[] {
    return this.events.slice(-limit);
  }

  getEventsByType(type: string): TemporalEvent[] {
    return this.events.filter(e => e.type === type);
  }

  getLastEventOfType(type: string): TemporalEvent | undefined {
    return [...this.events].reverse().find(e => e.type === type);
  }
}
