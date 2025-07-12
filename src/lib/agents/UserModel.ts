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
  /**
   * Predicts the user's next likely actions based on recent intents and behaviors.
   * @returns Promise resolving to an array of objects: { action, confidence }
   * @example
   *   const predictions = await userModel.predictNextActions();
   *   // [{ action: 'Intent: ...', confidence: 0.9 }, ...]
   */
  async predictNextActions(): Promise<{ action: string; confidence: number }[]> {
    // Use the most recent intent and behavior as a simple prediction
    const recentIntents = this.getRecentIntents();
    const recentBehaviors = this.getRecentBehaviors();
    const predictions: { action: string; confidence: number }[] = [];

    if (recentIntents.length > 0) {
      predictions.push({
        action: `Intent: ${recentIntents[recentIntents.length - 1].intent}`,
        confidence: recentIntents[recentIntents.length - 1].confidence
      });
    }
    if (recentBehaviors.length > 0) {
      predictions.push({
        action: `Behavior: ${recentBehaviors[recentBehaviors.length - 1].pattern}`,
        confidence: Math.min(1, recentBehaviors[recentBehaviors.length - 1].frequency / 10)
      });
    }
    // If no data, return a default message
    if (predictions.length === 0) {
      predictions.push({ action: 'No recent user data available', confidence: 0 });
    }
    return predictions;
  }
}
