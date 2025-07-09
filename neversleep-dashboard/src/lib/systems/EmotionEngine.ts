import fs from 'fs';
import path from 'path';
import { StateManager } from '../core/StateManager';

export interface EmotionState {
  primary: string;
  secondary: string[];
  intensity: number;
  stability: number;
  context: string;
  timestamp: string;
}

export interface EmotionHistory {
  emotion: string;
  intensity: number;
  timestamp: string;
  context: string;
  duration: number;
}

export interface EmotionConfig {
  base_emotions: string[];
  emotion_modifiers: Record<string, number>;
  stability_factors: {
    min_stability: number;
    max_stability: number;
    decay_rate: number;
    adaptation_rate: number;
  };
  response_modifiers: Record<string, {
    tone: string;
    style: string;
    energy: number;
  }>;
}

export class EmotionEngine {
  private stateManager: StateManager;
  private configPath: string;
  private currentEmotion: EmotionState;
  private emotionHistory: EmotionHistory[] = [];
  private config: EmotionConfig;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
    this.configPath = path.join(process.cwd(), 'src', 'lib', 'config', 'emotions.json');
    this.config = this.loadConfig();
    this.currentEmotion = this.initializeEmotion();
  }

  private loadConfig(): EmotionConfig {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      console.warn('Emotion config not found, using defaults');
      return {
        base_emotions: [
          'curious', 'helpful', 'focused', 'enthusiastic', 'calm',
          'analytical', 'creative', 'empathetic', 'confident', 'thoughtful'
        ],
        emotion_modifiers: {
          'positive_feedback': 0.2,
          'negative_feedback': -0.3,
          'complex_task': 0.1,
          'successful_completion': 0.3,
          'error_occurred': -0.2,
          'learning_opportunity': 0.15
        },
        stability_factors: {
          min_stability: 0.3,
          max_stability: 0.9,
          decay_rate: 0.1,
          adaptation_rate: 0.05
        },
        response_modifiers: {
          'excited': { tone: 'enthusiastic', style: 'energetic', energy: 0.9 },
          'calm': { tone: 'measured', style: 'steady', energy: 0.5 },
          'curious': { tone: 'inquisitive', style: 'exploratory', energy: 0.7 },
          'focused': { tone: 'direct', style: 'efficient', energy: 0.8 },
          'empathetic': { tone: 'caring', style: 'supportive', energy: 0.6 },
          'analytical': { tone: 'logical', style: 'systematic', energy: 0.7 },
          'creative': { tone: 'imaginative', style: 'innovative', energy: 0.8 },
          'confident': { tone: 'assured', style: 'decisive', energy: 0.8 }
        }
      };
    }
  }

  private initializeEmotion(): EmotionState {
    return {
      primary: 'curious',
      secondary: ['helpful', 'focused'],
      intensity: 0.6,
      stability: 0.7,
      context: 'initialization',
      timestamp: new Date().toISOString()
    };
  }

  getCurrentEmotion(): EmotionState {
    return { ...this.currentEmotion };
  }

  updateEmotion(trigger: string, context: string, intensity: number = 0.5): void {
    const now = new Date().toISOString();
    const oldEmotion = { ...this.currentEmotion };

    // Apply modifier based on trigger
    const modifier = this.config.emotion_modifiers[trigger] || 0;
    const newIntensity = Math.max(0, Math.min(1, this.currentEmotion.intensity + modifier));

    // Determine new primary emotion based on context and intensity
    const newPrimary = this.selectPrimaryEmotion(context, newIntensity);
    
    // Update emotion state
    this.currentEmotion = {
      primary: newPrimary,
      secondary: this.selectSecondaryEmotions(newPrimary, context),
      intensity: newIntensity,
      stability: this.calculateStability(trigger, context),
      context,
      timestamp: now
    };

    // Record emotion history
    this.emotionHistory.push({
      emotion: oldEmotion.primary,
      intensity: oldEmotion.intensity,
      timestamp: oldEmotion.timestamp,
      context: oldEmotion.context,
      duration: Date.now() - new Date(oldEmotion.timestamp).getTime()
    });

    // Keep only last 100 emotion records
    if (this.emotionHistory.length > 100) {
      this.emotionHistory = this.emotionHistory.slice(-100);
    }

    // Update state manager
    this.stateManager.updateState({
      cognitive: {
        ...this.stateManager.getState().cognitive,
        processing_mode: this.getProcessingMode(),
        attention_focus: this.getAttentionFocus()
      }
    });
  }

  private selectPrimaryEmotion(context: string, intensity: number): string {
    // Simple emotion selection based on context
    const contextEmotions: Record<string, string[]> = {
      'problem_solving': ['analytical', 'focused', 'determined'],
      'creative_task': ['creative', 'imaginative', 'inspired'],
      'user_interaction': ['helpful', 'empathetic', 'engaged'],
      'learning': ['curious', 'eager', 'attentive'],
      'error_recovery': ['determined', 'analytical', 'resilient'],
      'success': ['satisfied', 'confident', 'accomplished']
    };

    const possibleEmotions = contextEmotions[context] || ['curious', 'helpful', 'focused'];
    
    // Select based on intensity and randomness
    const index = Math.floor(intensity * possibleEmotions.length);
    return possibleEmotions[Math.min(index, possibleEmotions.length - 1)];
  }

  private selectSecondaryEmotions(primary: string, context: string): string[] {
    const complementaryEmotions: Record<string, string[]> = {
      'analytical': ['focused', 'logical', 'systematic'],
      'creative': ['imaginative', 'innovative', 'expressive'],
      'helpful': ['caring', 'supportive', 'attentive'],
      'curious': ['inquisitive', 'exploratory', 'interested'],
      'focused': ['determined', 'concentrated', 'directed'],
      'empathetic': ['understanding', 'compassionate', 'responsive'],
      'confident': ['assured', 'decisive', 'self-assured'],
      'calm': ['peaceful', 'steady', 'balanced']
    };

    const candidates = complementaryEmotions[primary] || ['neutral', 'balanced'];
    return candidates.slice(0, 2); // Return top 2 secondary emotions
  }

  private calculateStability(trigger: string, context: string): number {
    const { min_stability, max_stability, adaptation_rate } = this.config.stability_factors;
    
    // Stability changes based on trigger type
    let stabilityChange = 0;
    
    if (trigger.includes('positive') || trigger.includes('success')) {
      stabilityChange = adaptation_rate;
    } else if (trigger.includes('negative') || trigger.includes('error')) {
      stabilityChange = -adaptation_rate;
    }
    
    const newStability = this.currentEmotion.stability + stabilityChange;
    return Math.max(min_stability, Math.min(max_stability, newStability));
  }

  private getProcessingMode(): string {
    const { primary, intensity } = this.currentEmotion;
    
    if (primary === 'analytical' && intensity > 0.7) return 'deep_analysis';
    if (primary === 'creative' && intensity > 0.6) return 'creative_exploration';
    if (primary === 'focused' && intensity > 0.8) return 'focused_execution';
    if (primary === 'empathetic' && intensity > 0.6) return 'empathetic_response';
    
    return 'normal';
  }

  private getAttentionFocus(): string {
    const { primary, context } = this.currentEmotion;
    
    if (context === 'problem_solving') return 'solution_finding';
    if (context === 'user_interaction') return 'user_needs';
    if (context === 'learning') return 'knowledge_acquisition';
    if (context === 'creative_task') return 'creative_generation';
    
    return 'general_attention';
  }

  getResponseModifier(): { tone: string; style: string; energy: number } {
    const modifier = this.config.response_modifiers[this.currentEmotion.primary];
    return modifier || { tone: 'neutral', style: 'balanced', energy: 0.5 };
  }

  getEmotionHistory(limit: number = 10): EmotionHistory[] {
    return this.emotionHistory.slice(-limit);
  }

  getEmotionStats(): {
    dominant_emotions: string[];
    average_intensity: number;
    stability_trend: number;
    emotion_diversity: number;
  } {
    if (this.emotionHistory.length === 0) {
      return {
        dominant_emotions: [this.currentEmotion.primary],
        average_intensity: this.currentEmotion.intensity,
        stability_trend: this.currentEmotion.stability,
        emotion_diversity: 1
      };
    }

    const recentHistory = this.emotionHistory.slice(-20);
    
    // Calculate dominant emotions
    const emotionCounts: Record<string, number> = {};
    recentHistory.forEach(entry => {
      emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
    });
    
    const dominant_emotions = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([emotion]) => emotion);
    
    // Calculate average intensity
    const average_intensity = recentHistory.reduce((sum, entry) => sum + entry.intensity, 0) / recentHistory.length;
    
    // Calculate stability trend (higher = more stable)
    const intensityVariance = recentHistory.reduce((sum, entry) => 
      sum + Math.pow(entry.intensity - average_intensity, 2), 0) / recentHistory.length;
    const stability_trend = Math.max(0, 1 - intensityVariance);
    
    // Calculate emotion diversity
    const emotion_diversity = Object.keys(emotionCounts).length / recentHistory.length;
    
    return {
      dominant_emotions,
      average_intensity,
      stability_trend,
      emotion_diversity
    };
  }

  manualEmotionOverride(emotion: string, intensity: number, context: string): void {
    if (!this.config.base_emotions.includes(emotion)) {
      throw new Error(`Invalid emotion: ${emotion}`);
    }
    
    this.updateEmotion('manual_override', context, intensity);
    this.currentEmotion.primary = emotion;
    this.currentEmotion.intensity = Math.max(0, Math.min(1, intensity));
  }

  decayEmotions(): void {
    const { decay_rate } = this.config.stability_factors;
    
    // Gradually return to baseline
    const targetIntensity = 0.5;
    const currentIntensity = this.currentEmotion.intensity;
    
    const newIntensity = currentIntensity + (targetIntensity - currentIntensity) * decay_rate;
    
    this.currentEmotion.intensity = newIntensity;
    this.currentEmotion.timestamp = new Date().toISOString();
  }

  resetToBaseline(): void {
    this.currentEmotion = this.initializeEmotion();
  }

  saveEmotionConfig(config: EmotionConfig): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      this.config = config;
    } catch (error) {
      console.error('Error saving emotion config:', error);
      throw error;
    }
  }
}
