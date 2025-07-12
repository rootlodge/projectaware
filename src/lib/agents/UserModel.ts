/**
 * UserModel: Tracks and predicts user intent, preferences, and behavioral patterns.
 * Part of Advanced Autonomous Intelligence.
 */

export interface UserIntent {
  intent: string;
  confidence: number;
  lastDetected: string;
}

export interface UserBehavior {
  pattern: string;
  frequency: number;
  lastObserved: string;
}

export class UserModel {
  private intents: UserIntent[] = [];
  private behaviors: UserBehavior[] = [];
  private preferences: Record<string, any> = {};

  updateIntent(intent: string, confidence: number) {
    this.intents.push({ intent, confidence, lastDetected: new Date().toISOString() });
    if (this.intents.length > 50) this.intents.shift();
  }

  updateBehavior(pattern: string, frequency: number) {
    this.behaviors.push({ pattern, frequency, lastObserved: new Date().toISOString() });
    if (this.behaviors.length > 100) this.behaviors.shift();
  }

  setPreference(key: string, value: any) {
    this.preferences[key] = value;
  }

  getPreferences() {
    return this.preferences;
  }

  getRecentIntents() {
    return this.intents.slice(-5);
  }

  getRecentBehaviors() {
    return this.behaviors.slice(-5);
  }
}
