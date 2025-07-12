/**
 * ContextEnhancer: Extends context objects with multi-modal data (text, emotion, user actions, agent state).
 * Part of Advanced Autonomous Intelligence.
 */

export interface EnhancedContext {
  text: string;
  emotion?: string;
  emotionIntensity?: number;
  userActions?: string[];
  agentState?: Record<string, any>;
  environment?: Record<string, any>;
  timestamp: string;
}

export class ContextEnhancer {
  static enhance(base: Partial<EnhancedContext>, additions: Partial<EnhancedContext>): EnhancedContext {
    return {
      text: additions.text || base.text || '',
      emotion: additions.emotion || base.emotion,
      emotionIntensity: additions.emotionIntensity || base.emotionIntensity,
      userActions: [...(base.userActions || []), ...(additions.userActions || [])],
      agentState: { ...(base.agentState || {}), ...(additions.agentState || {}) },
      environment: { ...(base.environment || {}), ...(additions.environment || {}) },
      timestamp: additions.timestamp || base.timestamp || new Date().toISOString(),
    };
  }
}
