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
  source: 'user_detected' | 'ai_generated' | 'contextual' | 'decay';
  empathy_level: number; // How much AI is mirroring user emotion
  decay_timer: number; // Time until emotion starts decaying
}

export interface EmotionHistory {
  emotion: string;
  intensity: number;
  timestamp: string;
  context: string;
  duration: number;
  source: string;
  user_emotion_detected?: string;
}

export interface UserEmotionAnalysis {
  detected_emotions: Array<{
    emotion: string;
    confidence: number;
    intensity: number;
  }>;
  overall_sentiment: 'positive' | 'negative' | 'neutral';
  emotional_indicators: string[];
  tone_shift: 'stable' | 'increasing' | 'decreasing';
}

export interface EmotionConfig {
  base_emotions: string[];
  user_emotion_patterns: Record<string, string[]>; // Keywords that indicate emotions
  emotion_mappings: Record<string, string>; // User emotion -> AI response emotion
  empathy_settings: {
    base_empathy: number;
    max_empathy: number;
    empathy_buildup_rate: number;
    empathy_decay_rate: number;
  };
  decay_settings: {
    base_decay_time: number; // ms before decay starts
    decay_rate: number; // how fast emotions fade
    minimum_intensity: number; // floor for emotion intensity
  };
  emotion_transitions: Record<string, string[]>; // Valid emotion transitions
  response_modifiers: Record<string, {
    tone: string;
    style: string;
    energy: number;
    empathy_multiplier: number;
  }>;
}

export class EmotionEngine {
  private stateManager: StateManager;
  private configPath: string;
  private currentEmotion: EmotionState;
  private emotionHistory: EmotionHistory[] = [];
  private config: EmotionConfig;
  private lastUserEmotionAnalysis: UserEmotionAnalysis | null = null;
  private decayInterval: NodeJS.Timeout | null = null;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
    this.configPath = path.join(process.cwd(), 'src', 'lib', 'config', 'emotions.json');
    this.config = this.loadConfig();
    this.currentEmotion = this.initializeEmotion();
    this.startDecayTimer();
  }

  private loadConfig(): EmotionConfig {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      console.warn('Emotion config not found, using enhanced defaults');
      return {
        base_emotions: [
          'curious', 'helpful', 'focused', 'enthusiastic', 'calm',
          'analytical', 'creative', 'empathetic', 'confident', 'thoughtful',
          'sad', 'happy', 'excited', 'concerned', 'frustrated', 'relieved',
          'amused', 'contemplative', 'determined', 'compassionate'
        ],
        user_emotion_patterns: {
          'sad': ['sad', 'depressed', 'down', 'upset', 'crying', 'tears', 'lost', 'hurt', 'pain', 'grief', 'mourning', 'heartbroken'],
          'happy': ['happy', 'joy', 'excited', 'great', 'awesome', 'wonderful', 'amazing', 'fantastic', 'celebration', 'celebrate'],
          'angry': ['angry', 'mad', 'furious', 'rage', 'pissed', 'annoyed', 'irritated', 'frustrated', 'outraged'],
          'anxious': ['worried', 'anxiety', 'nervous', 'stressed', 'panic', 'fear', 'scared', 'afraid', 'concerned'],
          'confused': ['confused', 'lost', 'don\'t understand', 'unclear', 'puzzled', 'bewildered'],
          'amused': ['funny', 'hilarious', 'laugh', 'lol', 'haha', 'joke', 'humor', 'witty', 'comedy'],
          'grateful': ['thank', 'grateful', 'appreciate', 'thanks', 'thankful'],
          'disappointed': ['disappointed', 'let down', 'expected', 'hoped for', 'underwhelmed'],
          'surprised': ['wow', 'amazing', 'can\'t believe', 'surprising', 'unexpected', 'shocking']
        },
        emotion_mappings: {
          'sad': 'empathetic',
          'happy': 'enthusiastic', 
          'angry': 'calm',
          'anxious': 'reassuring',
          'confused': 'helpful',
          'amused': 'playful',
          'grateful': 'warm',
          'disappointed': 'understanding',
          'surprised': 'curious'
        },
        empathy_settings: {
          base_empathy: 0.3,
          max_empathy: 0.9,
          empathy_buildup_rate: 0.15,
          empathy_decay_rate: 0.05
        },
        decay_settings: {
          base_decay_time: 30000, // 30 seconds
          decay_rate: 0.02, // 2% per cycle
          minimum_intensity: 0.1
        },
        emotion_transitions: {
          'sad': ['empathetic', 'compassionate', 'understanding', 'supportive'],
          'happy': ['enthusiastic', 'excited', 'joyful', 'warm'],
          'angry': ['calm', 'understanding', 'patient', 'diplomatic'],
          'anxious': ['reassuring', 'calm', 'supportive', 'confident'],
          'confused': ['helpful', 'patient', 'clear', 'guiding'],
          'empathetic': ['compassionate', 'understanding', 'supportive', 'caring'],
          'curious': ['inquisitive', 'exploratory', 'interested', 'engaged']
        },
        response_modifiers: {
          'empathetic': { tone: 'caring', style: 'supportive', energy: 0.6, empathy_multiplier: 1.5 },
          'enthusiastic': { tone: 'energetic', style: 'upbeat', energy: 0.9, empathy_multiplier: 1.2 },
          'calm': { tone: 'measured', style: 'steady', energy: 0.4, empathy_multiplier: 1.1 },
          'curious': { tone: 'inquisitive', style: 'exploratory', energy: 0.7, empathy_multiplier: 1.0 },
          'focused': { tone: 'direct', style: 'efficient', energy: 0.8, empathy_multiplier: 0.9 },
          'analytical': { tone: 'logical', style: 'systematic', energy: 0.7, empathy_multiplier: 0.8 },
          'creative': { tone: 'imaginative', style: 'innovative', energy: 0.8, empathy_multiplier: 1.1 },
          'confident': { tone: 'assured', style: 'decisive', energy: 0.8, empathy_multiplier: 0.9 },
          'compassionate': { tone: 'gentle', style: 'nurturing', energy: 0.5, empathy_multiplier: 1.8 },
          'understanding': { tone: 'accepting', style: 'patient', energy: 0.5, empathy_multiplier: 1.6 },
          'supportive': { tone: 'encouraging', style: 'uplifting', energy: 0.6, empathy_multiplier: 1.4 },
          'reassuring': { tone: 'comforting', style: 'stable', energy: 0.5, empathy_multiplier: 1.3 },
          'playful': { tone: 'lighthearted', style: 'fun', energy: 0.8, empathy_multiplier: 1.2 },
          'thoughtful': { tone: 'reflective', style: 'considered', energy: 0.6, empathy_multiplier: 1.1 }
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
      timestamp: new Date().toISOString(),
      source: 'ai_generated',
      empathy_level: this.config.empathy_settings.base_empathy,
      decay_timer: Date.now() + this.config.decay_settings.base_decay_time
    };
  }

  private startDecayTimer(): void {
    if (this.decayInterval) {
      clearInterval(this.decayInterval);
    }
    
    this.decayInterval = setInterval(() => {
      this.processEmotionDecay();
    }, 5000); // Check every 5 seconds
  }

  private processEmotionDecay(): void {
    const now = Date.now();
    
    if (now > this.currentEmotion.decay_timer && this.currentEmotion.intensity > this.config.decay_settings.minimum_intensity) {
      const newIntensity = Math.max(
        this.config.decay_settings.minimum_intensity,
        this.currentEmotion.intensity - this.config.decay_settings.decay_rate
      );
      
      // Decay empathy level
      const newEmpathyLevel = Math.max(
        this.config.empathy_settings.base_empathy,
        this.currentEmotion.empathy_level - this.config.empathy_settings.empathy_decay_rate
      );
      
      this.currentEmotion = {
        ...this.currentEmotion,
        intensity: newIntensity,
        empathy_level: newEmpathyLevel,
        source: 'decay',
        timestamp: new Date().toISOString()
      };
      
      // If intensity is very low, transition to baseline emotion
      if (newIntensity <= this.config.decay_settings.minimum_intensity + 0.1) {
        this.transitionToBaseline();
      }
    }
  }

  private transitionToBaseline(): void {
    this.currentEmotion = {
      primary: 'curious',
      secondary: ['helpful', 'thoughtful'],
      intensity: 0.5,
      stability: 0.8,
      context: 'baseline',
      timestamp: new Date().toISOString(),
      source: 'decay',
      empathy_level: this.config.empathy_settings.base_empathy,
      decay_timer: Date.now() + this.config.decay_settings.base_decay_time
    };
  }

  analyzeUserEmotion(userInput: string): UserEmotionAnalysis {
    const text = userInput.toLowerCase();
    const detectedEmotions: Array<{ emotion: string; confidence: number; intensity: number }> = [];
    const emotionalIndicators: string[] = [];
    
    // Analyze emotional patterns
    for (const [emotion, patterns] of Object.entries(this.config.user_emotion_patterns)) {
      let matches = 0;
      let totalConfidence = 0;
      
      for (const pattern of patterns) {
        if (text.includes(pattern.toLowerCase())) {
          matches++;
          emotionalIndicators.push(pattern);
          // Calculate confidence based on pattern specificity and context
          const confidence = Math.min(0.9, 0.3 + (pattern.length / userInput.length) * 2);
          totalConfidence += confidence;
        }
      }
      
      if (matches > 0) {
        const avgConfidence = totalConfidence / matches;
        const intensity = Math.min(0.9, matches * 0.2 + avgConfidence);
        
        detectedEmotions.push({
          emotion,
          confidence: avgConfidence,
          intensity
        });
      }
    }
    
    // Determine overall sentiment
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    const positiveEmotions = ['happy', 'grateful', 'amused', 'surprised'];
    const negativeEmotions = ['sad', 'angry', 'anxious', 'disappointed'];
    
    const positiveScore = detectedEmotions
      .filter(e => positiveEmotions.includes(e.emotion))
      .reduce((sum, e) => sum + e.intensity, 0);
      
    const negativeScore = detectedEmotions
      .filter(e => negativeEmotions.includes(e.emotion))
      .reduce((sum, e) => sum + e.intensity, 0);
    
    if (positiveScore > negativeScore + 0.2) sentiment = 'positive';
    else if (negativeScore > positiveScore + 0.2) sentiment = 'negative';
    
    // Determine tone shift
    let toneShift: 'stable' | 'increasing' | 'decreasing' = 'stable';
    if (this.lastUserEmotionAnalysis) {
      const prevIntensity = this.lastUserEmotionAnalysis.detected_emotions
        .reduce((sum, e) => sum + e.intensity, 0);
      const currentIntensity = detectedEmotions.reduce((sum, e) => sum + e.intensity, 0);
      
      if (currentIntensity > prevIntensity + 0.2) toneShift = 'increasing';
      else if (currentIntensity < prevIntensity - 0.2) toneShift = 'decreasing';
    }
    
    const analysis: UserEmotionAnalysis = {
      detected_emotions: detectedEmotions.sort((a, b) => b.confidence - a.confidence),
      overall_sentiment: sentiment,
      emotional_indicators: emotionalIndicators,
      tone_shift: toneShift
    };
    
    this.lastUserEmotionAnalysis = analysis;
    return analysis;
  }

  respondToUserEmotion(userEmotionAnalysis: UserEmotionAnalysis, context: string): void {
    if (userEmotionAnalysis.detected_emotions.length === 0) {
      // No strong emotions detected, maintain current state with slight adjustment
      this.updateEmotionGradually('contextual', context, 0.1);
      return;
    }
    
    const primaryUserEmotion = userEmotionAnalysis.detected_emotions[0];
    const responseEmotion = this.config.emotion_mappings[primaryUserEmotion.emotion] || 'empathetic';
    
    // Calculate empathy level based on user emotion intensity
    const empathyIncrease = primaryUserEmotion.intensity * this.config.empathy_settings.empathy_buildup_rate;
    const newEmpathyLevel = Math.min(
      this.config.empathy_settings.max_empathy,
      this.currentEmotion.empathy_level + empathyIncrease
    );
    
    // Update emotion with empathetic response
    this.updateEmotionWithEmpathy(
      responseEmotion,
      context,
      primaryUserEmotion.intensity * 0.8, // AI emotion is slightly less intense
      newEmpathyLevel,
      primaryUserEmotion.emotion
    );
  }

  private updateEmotionWithEmpathy(
    newEmotion: string,
    context: string,
    intensity: number,
    empathyLevel: number,
    userEmotion?: string
  ): void {
    const oldEmotion = { ...this.currentEmotion };
    const now = new Date().toISOString();
    
    this.currentEmotion = {
      primary: newEmotion,
      secondary: this.selectSecondaryEmotions(newEmotion, empathyLevel),
      intensity: Math.max(0.1, Math.min(0.9, intensity)),
      stability: this.calculateStability(empathyLevel),
      context,
      timestamp: now,
      source: 'user_detected',
      empathy_level: empathyLevel,
      decay_timer: Date.now() + this.config.decay_settings.base_decay_time
    };
    
    // Record in history
    this.emotionHistory.push({
      emotion: oldEmotion.primary,
      intensity: oldEmotion.intensity,
      timestamp: oldEmotion.timestamp,
      context: oldEmotion.context,
      duration: Date.now() - new Date(oldEmotion.timestamp).getTime(),
      source: oldEmotion.source,
      user_emotion_detected: userEmotion
    });
    
    // Keep last 100 records
    if (this.emotionHistory.length > 100) {
      this.emotionHistory = this.emotionHistory.slice(-100);
    }
    
    this.updateStateManager();
  }

  private updateEmotionGradually(source: 'contextual' | 'ai_generated' | 'decay', context: string, intensityChange: number): void {
    const newIntensity = Math.max(0.1, Math.min(0.9, this.currentEmotion.intensity + intensityChange));
    
    this.currentEmotion = {
      ...this.currentEmotion,
      intensity: newIntensity,
      context,
      timestamp: new Date().toISOString(),
      source,
      decay_timer: Date.now() + this.config.decay_settings.base_decay_time
    };
    
    this.updateStateManager();
  }

  private selectSecondaryEmotions(primary: string, empathyLevel: number): string[] {
    const transitions = this.config.emotion_transitions[primary] || ['thoughtful', 'focused'];
    
    // Higher empathy leads to more emotion-specific secondary emotions
    if (empathyLevel > 0.7) {
      return transitions.slice(0, 3);
    } else if (empathyLevel > 0.5) {
      return transitions.slice(0, 2);
    } else {
      return [transitions[0]];
    }
  }

  private calculateStability(empathyLevel: number): number {
    // Higher empathy can lead to more emotional volatility
    const baseStability = 0.7;
    const empathyEffect = (empathyLevel - this.config.empathy_settings.base_empathy) * 0.3;
    return Math.max(0.3, Math.min(0.9, baseStability - empathyEffect));
  }

  private updateStateManager(): void {
    this.stateManager.updateState({
      cognitive: {
        ...this.stateManager.getState().cognitive,
        processing_mode: this.getProcessingMode(),
        attention_focus: this.getAttentionFocus()
      }
    });
  }

  private getProcessingMode(): string {
    const { primary, intensity, empathy_level } = this.currentEmotion;
    
    if (empathy_level > 0.7 && intensity > 0.6) return 'empathetic_response';
    if (primary === 'analytical' && intensity > 0.7) return 'deep_analysis';
    if (primary === 'creative' && intensity > 0.6) return 'creative_exploration';
    if (primary === 'focused' && intensity > 0.8) return 'focused_execution';
    
    return 'normal';
  }

  private getAttentionFocus(): string {
    const { primary, context, empathy_level } = this.currentEmotion;
    
    if (empathy_level > 0.6) return 'emotional_attunement';
    if (context === 'user_interaction') return 'user_needs';
    if (primary === 'analytical') return 'solution_finding';
    if (primary === 'creative') return 'creative_generation';
    
    return 'general_attention';
  }

  // Public API methods
  getCurrentEmotion(): EmotionState {
    return { ...this.currentEmotion };
  }

  processUserInput(userInput: string, context: string = 'user_interaction'): UserEmotionAnalysis {
    const emotionAnalysis = this.analyzeUserEmotion(userInput);
    this.respondToUserEmotion(emotionAnalysis, context);
    return emotionAnalysis;
  }

  getResponseModifier(): { tone: string; style: string; energy: number; empathy_multiplier: number } {
    const modifier = this.config.response_modifiers[this.currentEmotion.primary];
    if (!modifier) {
      return { tone: 'neutral', style: 'balanced', energy: 0.5, empathy_multiplier: 1.0 };
    }
    
    // Adjust energy based on empathy level
    const adjustedEnergy = modifier.energy * (1 + (this.currentEmotion.empathy_level - 0.5) * 0.3);
    
    return {
      ...modifier,
      energy: Math.max(0.1, Math.min(1.0, adjustedEnergy))
    };
  }

  getEmotionHistory(): EmotionHistory[] {
    return this.emotionHistory.slice();
  }

  getEmotionStats() {
    if (this.emotionHistory.length === 0) {
      return {
        dominant_emotions: [this.currentEmotion.primary],
        average_intensity: this.currentEmotion.intensity,
        empathy_trend: this.currentEmotion.empathy_level,
        emotion_diversity: 1,
        user_emotion_responses: 0
      };
    }

    const recentHistory = this.emotionHistory.slice(-20);
    
    const emotionCounts: Record<string, number> = {};
    recentHistory.forEach(entry => {
      emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
    });
    
    const dominant_emotions = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([emotion]) => emotion);
    
    const average_intensity = recentHistory.reduce((sum, entry) => sum + entry.intensity, 0) / recentHistory.length;
    const empathy_trend = this.currentEmotion.empathy_level;
    const emotion_diversity = Object.keys(emotionCounts).length / recentHistory.length;
    const user_emotion_responses = recentHistory.filter(e => e.source === 'user_detected').length;
    
    return {
      dominant_emotions,
      average_intensity,
      empathy_trend,
      emotion_diversity,
      user_emotion_responses
    };
  }

  manualEmotionOverride(emotion: string, intensity: number, context: string): void {
    if (!this.config.base_emotions.includes(emotion)) {
      throw new Error(`Invalid emotion: ${emotion}`);
    }
    
    this.currentEmotion = {
      primary: emotion,
      secondary: this.selectSecondaryEmotions(emotion, this.currentEmotion.empathy_level),
      intensity: Math.max(0.1, Math.min(0.9, intensity)),
      stability: this.currentEmotion.stability,
      context,
      timestamp: new Date().toISOString(),
      source: 'ai_generated',
      empathy_level: this.currentEmotion.empathy_level,
      decay_timer: Date.now() + this.config.decay_settings.base_decay_time
    };
    
    this.updateStateManager();
  }

  resetToBaseline(): void {
    this.currentEmotion = this.initializeEmotion();
    this.lastUserEmotionAnalysis = null;
  }

  forecastEmotionTrends(): { forecast: string[]; trend: 'rising'|'falling'|'stable'; confidence: number } {
    const history = this.emotionHistory.slice(-10);
    if (history.length < 2) {
      return { forecast: [this.currentEmotion.primary], trend: 'stable', confidence: 0.5 };
    }
    // Count occurrences and intensity trend
    const emotionCounts: Record<string, number> = {};
    let intensityDelta = 0;
    for (let i = 1; i < history.length; i++) {
      emotionCounts[history[i].emotion] = (emotionCounts[history[i].emotion] || 0) + 1;
      intensityDelta += history[i].intensity - history[i-1].intensity;
    }
    const sorted = Object.entries(emotionCounts).sort(([,a],[,b]) => b-a);
    const forecast = sorted.length > 0 ? sorted.slice(0,2).map(([e])=>e) : [this.currentEmotion.primary];
    let trend: 'rising'|'falling'|'stable' = 'stable';
    if (intensityDelta > 0.2) trend = 'rising';
    else if (intensityDelta < -0.2) trend = 'falling';
    const confidence = Math.min(1, Math.abs(intensityDelta) + (forecast.length > 1 ? 0.2 : 0));
    return { forecast, trend, confidence };
  } 
  destroy(): void {
    if (this.decayInterval) {
      clearInterval(this.decayInterval);
      this.decayInterval = null;
    }
  }
}
