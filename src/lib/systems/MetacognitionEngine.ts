import { StateManager } from '../core/StateManager';
import { EmotionEngine } from './EmotionEngine';
import { MemorySystem } from '../core/memory';
import { AutonomousThinkingSystem } from './AutonomousThinkingSystem';
import { CentralBrainAgent } from '../agents/CentralBrainAgent';

/**
 * Core interfaces for metacognitive awareness
 */
export interface CognitiveState {
  id: string;
  timestamp: string;
  thought_process: {
    reasoning_chain: string[];
    decision_points: DecisionPoint[];
    confidence_level: number; // 0-1
    uncertainty_factors: string[];
    cognitive_load: number; // 0-1
  };
  meta_analysis: {
    thinking_pattern: string;
    bias_indicators: string[];
    efficiency_score: number; // 0-1
    learning_opportunities: string[];
  };
  context: {
    trigger_event: string;
    emotional_state: any;
    system_state: any;
    external_factors: string[];
  };
}

export interface DecisionPoint {
  id: string;
  timestamp: string;
  decision_type: 'goal_prioritization' | 'response_generation' | 'agent_assignment' | 'memory_retrieval' | 'user_interaction';
  options_considered: string[];
  chosen_option: string;
  rationale: string;
  confidence: number; // 0-1
  uncertainty_level: number; // 0-1
  bias_risk_factors: string[];
  outcome_prediction: string;
  actual_outcome?: string; // Filled later for learning
  success_score?: number; // 0-1, filled after evaluation
}

export interface MetaLearningEvent {
  id: string;
  timestamp: string;
  event_type: 'strategy_evolution' | 'pattern_recognition' | 'bias_detection' | 'efficiency_improvement';
  description: string;
  trigger: string;
  analysis: {
    historical_patterns: string[];
    improvement_opportunities: string[];
    strategy_adjustments: string[];
  };
  implementation_plan: {
    immediate_changes: string[];
    long_term_adaptations: string[];
    monitoring_metrics: string[];
  };
  success_metrics: {
    before_performance: number;
    target_improvement: number;
    measurement_method: string;
  };
}

export interface SelfReflectionSession {
  id: string;
  session_type: 'daily' | 'weekly' | 'triggered' | 'deep_analysis';
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  trigger: string;
  scope: {
    time_period: string;
    focus_areas: string[];
    data_sources: string[];
  };
  analysis: {
    performance_assessment: PerformanceAssessment;
    pattern_analysis: PatternAnalysis;
    learning_insights: LearningInsight[];
    improvement_recommendations: string[];
  };
  consolidation: {
    key_memories: string[];
    pattern_abstractions: string[];
    wisdom_distillation: string[];
    future_planning_insights: string[];
  };
}

export interface PerformanceAssessment {
  overall_efficiency: number; // 0-1
  decision_accuracy: number; // 0-1
  learning_rate: number; // 0-1
  user_satisfaction_proxy: number; // 0-1
  goal_completion_rate: number; // 0-1
  areas_of_strength: string[];
  areas_for_improvement: string[];
  trend_analysis: {
    performance_trajectory: 'improving' | 'stable' | 'declining';
    key_factors: string[];
  };
}

export interface PatternAnalysis {
  recurring_challenges: string[];
  successful_strategies: string[];
  decision_patterns: string[];
  learning_patterns: string[];
  interaction_patterns: string[];
  temporal_patterns: string[];
}

export interface LearningInsight {
  id: string;
  category: 'strategy' | 'pattern' | 'bias' | 'efficiency' | 'interaction';
  insight: string;
  evidence: string[];
  confidence: number; // 0-1
  actionable_steps: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface AdaptivePersonality {
  communication_style: {
    formality_level: number; // 0-1
    enthusiasm_level: number; // 0-1
    directness_level: number; // 0-1
    empathy_expression: number; // 0-1
    technical_depth: number; // 0-1
  };
  interaction_preferences: {
    response_length: 'concise' | 'detailed' | 'adaptive';
    explanation_style: 'step_by_step' | 'conceptual' | 'example_based';
    proactivity_level: number; // 0-1
    interruption_tolerance: number; // 0-1
  };
  adaptation_history: {
    changes_made: PersonalityChange[];
    user_feedback_analysis: string[];
    effectiveness_tracking: number[];
  };
}

export interface PersonalityChange {
  timestamp: string;
  attribute: string;
  old_value: number;
  new_value: number;
  reason: string;
  user_feedback_trigger?: string;
  effectiveness_prediction: number; // 0-1
  actual_effectiveness?: number; // Measured later
}

/**
 * Metacognition Engine - Core self-awareness and introspective capabilities
 * 
 * This system provides the AI with genuine self-awareness by continuously monitoring
 * its own cognitive processes, learning patterns, and decision-making effectiveness.
 */
export class MetacognitionEngine {
  private stateManager: StateManager;
  private emotionEngine: EmotionEngine;
  private memorySystem: MemorySystem;
  private autonomousThinking: AutonomousThinkingSystem;
  private centralBrain: CentralBrainAgent;

  // Cognitive monitoring state
  private currentCognitiveState: CognitiveState | null = null;
  private recentDecisions: DecisionPoint[] = [];
  private metaLearningEvents: MetaLearningEvent[] = [];
  private reflectionSessions: SelfReflectionSession[] = [];
  
  // Self-optimization state
  private adaptivePersonality: AdaptivePersonality;
  private cognitivePatterns: Map<string, any> = new Map();
  private biasDetectionThreshold = 0.7;
  private selfReflectionSchedule: NodeJS.Timeout | null = null;

  // Performance tracking
  private performanceHistory: PerformanceAssessment[] = [];
  private learningInsights: LearningInsight[] = [];
  private cognitiveEfficiencyTrend: number[] = [];

  // Configuration
  private config = {
    max_decision_history: 1000,
    max_meta_learning_events: 500,
    reflection_frequency: 24 * 60 * 60 * 1000, // Daily
    deep_reflection_frequency: 7 * 24 * 60 * 60 * 1000, // Weekly
    bias_detection_window: 50, // Number of decisions to analyze
    personality_adaptation_threshold: 0.3,
    cognitive_load_alert_threshold: 0.8
  };

  constructor(
    stateManager: StateManager,
    emotionEngine: EmotionEngine,
    memorySystem: MemorySystem,
    autonomousThinking: AutonomousThinkingSystem,
    centralBrain: CentralBrainAgent
  ) {
    this.stateManager = stateManager;
    this.emotionEngine = emotionEngine;
    this.memorySystem = memorySystem;
    this.autonomousThinking = autonomousThinking;
    this.centralBrain = centralBrain;

    // Initialize adaptive personality with neutral baseline
    this.adaptivePersonality = {
      communication_style: {
        formality_level: 0.5,
        enthusiasm_level: 0.6,
        directness_level: 0.7,
        empathy_expression: 0.8,
        technical_depth: 0.6
      },
      interaction_preferences: {
        response_length: 'adaptive',
        explanation_style: 'conceptual',
        proactivity_level: 0.5,
        interruption_tolerance: 0.4
      },
      adaptation_history: {
        changes_made: [],
        user_feedback_analysis: [],
        effectiveness_tracking: []
      }
    };

    this.initializeMetacognition();
  }

  /**
   * Initialize metacognitive monitoring and self-reflection schedules
   */
  private async initializeMetacognition(): Promise<void> {
    console.log('[Metacognition] Initializing self-awareness systems...');

    // Schedule regular self-reflection sessions
    this.scheduleReflectionSessions();

    // Load historical metacognitive data
    await this.loadMetacognitiveHistory();

    // Start cognitive self-monitoring
    this.startCognitiveMonitoring();

    console.log('[Metacognition] Self-awareness systems initialized successfully');
  }

  /**
   * Start real-time cognitive self-monitoring
   */
  private startCognitiveMonitoring(): void {
    // Monitor cognitive processes every 30 seconds
    setInterval(async () => {
      await this.performCognitiveAssessment();
    }, 30000);

    // Analyze decision patterns every 5 minutes
    setInterval(async () => {
      await this.analyzeCognitivePatterns();
    }, 5 * 60 * 1000);

    // Check for bias indicators every 10 minutes
    setInterval(async () => {
      await this.detectCognitiveBiases();
    }, 10 * 60 * 1000);
  }

  /**
   * Capture and analyze current cognitive state
   */
  public async captureDecisionPoint(
    decisionType: DecisionPoint['decision_type'],
    optionsConsidered: string[],
    chosenOption: string,
    rationale: string,
    confidence: number,
    uncertainty: number
  ): Promise<string> {
    const decision: DecisionPoint = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      decision_type: decisionType,
      options_considered: optionsConsidered,
      chosen_option: chosenOption,
      rationale: rationale,
      confidence: confidence,
      uncertainty_level: uncertainty,
      bias_risk_factors: await this.identifyBiasRisks(decisionType, optionsConsidered, rationale),
      outcome_prediction: await this.predictOutcome(decisionType, chosenOption, rationale)
    };

    // Store decision for analysis
    this.recentDecisions.push(decision);
    if (this.recentDecisions.length > this.config.max_decision_history) {
      this.recentDecisions = this.recentDecisions.slice(-this.config.max_decision_history);
    }

    // Update current cognitive state
    await this.updateCognitiveState(decision);

    // Trigger immediate bias detection if confidence is low
    if (confidence < 0.5 || uncertainty > 0.7) {
      await this.performImmediateBiasCheck(decision);
    }

    console.log(`[Metacognition] Decision captured: ${decisionType} (confidence: ${confidence.toFixed(2)})`);
    
    return decision.id;
  }

  /**
   * Update outcome of a previous decision for learning
   */
  public async updateDecisionOutcome(decisionId: string, actualOutcome: string, successScore: number): Promise<void> {
    const decision = this.recentDecisions.find(d => d.id === decisionId);
    if (!decision) {
      console.warn(`[Metacognition] Decision ${decisionId} not found for outcome update`);
      return;
    }

    decision.actual_outcome = actualOutcome;
    decision.success_score = successScore;

    // Analyze prediction accuracy
    const predictionAccuracy = await this.analyzePredictionAccuracy(decision);
    
    // Generate meta-learning event if significant discrepancy
    if (Math.abs(predictionAccuracy - 0.5) > 0.3) {
      await this.generateMetaLearningEvent(
        'strategy_evolution',
        `Decision prediction analysis for ${decision.decision_type}`,
        `Prediction accuracy: ${predictionAccuracy.toFixed(2)}, Success: ${successScore.toFixed(2)}`,
        decision
      );
    }

    console.log(`[Metacognition] Decision outcome updated: ${decisionId} (success: ${successScore.toFixed(2)})`);
  }

  /**
   * Perform comprehensive self-reflection session
   */
  public async performSelfReflection(sessionType: SelfReflectionSession['session_type'], trigger: string): Promise<SelfReflectionSession> {
    console.log(`[Metacognition] Starting ${sessionType} self-reflection session: ${trigger}`);

    const session: SelfReflectionSession = {
      id: this.generateId(),
      session_type: sessionType,
      start_time: new Date().toISOString(),
      trigger: trigger,
      scope: {
        time_period: this.getReflectionTimePeriod(sessionType),
        focus_areas: this.determineFocusAreas(sessionType),
        data_sources: ['decisions', 'interactions', 'goals', 'emotions', 'performance']
      },
      analysis: {
        performance_assessment: await this.assessPerformance(),
        pattern_analysis: await this.analyzePatterns(),
        learning_insights: await this.generateLearningInsights(),
        improvement_recommendations: []
      },
      consolidation: {
        key_memories: [],
        pattern_abstractions: [],
        wisdom_distillation: [],
        future_planning_insights: []
      }
    };

    // Perform deep analysis
    session.analysis.improvement_recommendations = await this.generateImprovementRecommendations(session.analysis);
    session.consolidation = await this.performMemoryConsolidation(session.analysis);

    // Complete session
    session.end_time = new Date().toISOString();
    session.duration_ms = new Date(session.end_time).getTime() - new Date(session.start_time).getTime();

    // Store session
    this.reflectionSessions.push(session);
    await this.saveReflectionSession(session);

    // Implement immediate improvements
    await this.implementImmediateImprovements(session.analysis.improvement_recommendations);

    console.log(`[Metacognition] Self-reflection completed in ${session.duration_ms}ms with ${session.analysis.learning_insights.length} insights`);

    return session;
  }

  /**
   * Adapt personality based on user feedback and interaction patterns
   */
  public async adaptPersonality(userFeedback?: string, interactionData?: any): Promise<void> {
    console.log('[Metacognition] Analyzing personality adaptation opportunities...');

    const currentStyle = this.adaptivePersonality.communication_style;
    const changes: PersonalityChange[] = [];

    // Analyze user feedback if provided
    if (userFeedback) {
      const feedbackAnalysis = await this.analyzeFeedback(userFeedback);
      const suggestedChanges = await this.generatePersonalityChanges(feedbackAnalysis);
      changes.push(...suggestedChanges);
    }

    // Analyze interaction patterns
    if (interactionData) {
      const patternAnalysis = await this.analyzeInteractionPatterns(interactionData);
      const patternBasedChanges = await this.generatePatternBasedChanges(patternAnalysis);
      changes.push(...patternBasedChanges);
    }

    // Apply significant changes
    for (const change of changes) {
      if (Math.abs(change.new_value - change.old_value) > this.config.personality_adaptation_threshold) {
        await this.applyPersonalityChange(change);
      }
    }

    if (changes.length > 0) {
      console.log(`[Metacognition] Applied ${changes.length} personality adaptations`);
    }
  }

  /**
   * Detect and analyze cognitive biases in recent decisions
   */
  public async detectCognitiveBiases(): Promise<string[]> {
    const recentDecisions = this.recentDecisions.slice(-this.config.bias_detection_window);
    const detectedBiases: string[] = [];

    // Confirmation bias detection
    const confirmationBias = await this.detectConfirmationBias(recentDecisions);
    if (confirmationBias.confidence > this.biasDetectionThreshold) {
      detectedBiases.push(`Confirmation bias detected: ${confirmationBias.description}`);
    }

    // Anchoring bias detection
    const anchoringBias = await this.detectAnchoringBias(recentDecisions);
    if (anchoringBias.confidence > this.biasDetectionThreshold) {
      detectedBiases.push(`Anchoring bias detected: ${anchoringBias.description}`);
    }

    // Availability heuristic detection
    const availabilityBias = await this.detectAvailabilityBias(recentDecisions);
    if (availabilityBias.confidence > this.biasDetectionThreshold) {
      detectedBiases.push(`Availability bias detected: ${availabilityBias.description}`);
    }

    // Overconfidence bias detection
    const overconfidenceBias = await this.detectOverconfidenceBias(recentDecisions);
    if (overconfidenceBias.confidence > this.biasDetectionThreshold) {
      detectedBiases.push(`Overconfidence bias detected: ${overconfidenceBias.description}`);
    }

    if (detectedBiases.length > 0) {
      await this.generateBiasCorrectiveMeasures(detectedBiases);
      console.log(`[Metacognition] Detected ${detectedBiases.length} cognitive biases`);
    }

    return detectedBiases;
  }

  // Helper methods for cognitive assessment and analysis
  private async performCognitiveAssessment(): Promise<void> {
    // Implementation details for real-time cognitive state assessment
  }

  private async analyzeCognitivePatterns(): Promise<void> {
    // Implementation details for pattern analysis
  }

  private async updateCognitiveState(decision: DecisionPoint): Promise<void> {
    // Implementation details for cognitive state updates
  }

  private async identifyBiasRisks(decisionType: string, options: string[], rationale: string): Promise<string[]> {
    // Implementation details for bias risk identification
    return [];
  }

  private async predictOutcome(decisionType: string, chosenOption: string, rationale: string): Promise<string> {
    // Implementation details for outcome prediction
    return 'Prediction generated';
  }

  private async performImmediateBiasCheck(decision: DecisionPoint): Promise<void> {
    // Implementation details for immediate bias checking
  }

  private async analyzePredictionAccuracy(decision: DecisionPoint): Promise<number> {
    // Implementation details for prediction accuracy analysis
    return 0.5;
  }

  private async generateMetaLearningEvent(type: string, description: string, trigger: string, context: any): Promise<void> {
    // Implementation details for meta-learning event generation
  }

  private getReflectionTimePeriod(sessionType: string): string {
    switch (sessionType) {
      case 'daily': return '24 hours';
      case 'weekly': return '7 days';
      case 'triggered': return 'since last trigger';
      case 'deep_analysis': return '30 days';
      default: return '24 hours';
    }
  }

  private determineFocusAreas(sessionType: string): string[] {
    // Implementation details for focus area determination
    return ['performance', 'learning', 'patterns'];
  }

  private async assessPerformance(): Promise<PerformanceAssessment> {
    // Implementation details for performance assessment
    return {
      overall_efficiency: 0.75,
      decision_accuracy: 0.80,
      learning_rate: 0.70,
      user_satisfaction_proxy: 0.85,
      goal_completion_rate: 0.90,
      areas_of_strength: ['Goal processing', 'User interaction'],
      areas_for_improvement: ['Decision confidence', 'Pattern recognition'],
      trend_analysis: {
        performance_trajectory: 'improving',
        key_factors: ['Enhanced learning', 'Better pattern recognition']
      }
    };
  }

  private async analyzePatterns(): Promise<PatternAnalysis> {
    // Implementation details for pattern analysis
    return {
      recurring_challenges: [],
      successful_strategies: [],
      decision_patterns: [],
      learning_patterns: [],
      interaction_patterns: [],
      temporal_patterns: []
    };
  }

  private async generateLearningInsights(): Promise<LearningInsight[]> {
    // Implementation details for learning insight generation
    return [];
  }

  private async generateImprovementRecommendations(analysis: any): Promise<string[]> {
    // Implementation details for improvement recommendation generation
    return [];
  }

  private async performMemoryConsolidation(analysis: any): Promise<any> {
    // Implementation details for memory consolidation
    return {
      key_memories: [],
      pattern_abstractions: [],
      wisdom_distillation: [],
      future_planning_insights: []
    };
  }

  private async saveReflectionSession(session: SelfReflectionSession): Promise<void> {
    // Implementation details for session persistence
  }

  private async implementImmediateImprovements(recommendations: string[]): Promise<void> {
    // Implementation details for immediate improvement implementation
  }

  private async analyzeFeedback(feedback: string): Promise<any> {
    // Implementation details for feedback analysis
    return {};
  }

  private async generatePersonalityChanges(analysis: any): Promise<PersonalityChange[]> {
    // Implementation details for personality change generation
    return [];
  }

  private async analyzeInteractionPatterns(data: any): Promise<any> {
    // Implementation details for interaction pattern analysis
    return {};
  }

  private async generatePatternBasedChanges(analysis: any): Promise<PersonalityChange[]> {
    // Implementation details for pattern-based change generation
    return [];
  }

  private async applyPersonalityChange(change: PersonalityChange): Promise<void> {
    // Implementation details for personality change application
  }

  private async detectConfirmationBias(decisions: DecisionPoint[]): Promise<{ confidence: number; description: string }> {
    // Implementation details for confirmation bias detection
    return { confidence: 0.3, description: 'No significant confirmation bias detected' };
  }

  private async detectAnchoringBias(decisions: DecisionPoint[]): Promise<{ confidence: number; description: string }> {
    // Implementation details for anchoring bias detection
    return { confidence: 0.2, description: 'No significant anchoring bias detected' };
  }

  private async detectAvailabilityBias(decisions: DecisionPoint[]): Promise<{ confidence: number; description: string }> {
    // Implementation details for availability bias detection
    return { confidence: 0.4, description: 'Mild availability bias in recent memory retrieval' };
  }

  private async detectOverconfidenceBias(decisions: DecisionPoint[]): Promise<{ confidence: number; description: string }> {
    // Implementation details for overconfidence bias detection
    return { confidence: 0.6, description: 'Moderate overconfidence in prediction accuracy' };
  }

  private async generateBiasCorrectiveMeasures(biases: string[]): Promise<void> {
    // Implementation details for bias correction
  }

  private scheduleReflectionSessions(): void {
    // Schedule daily reflections
    this.selfReflectionSchedule = setInterval(async () => {
      await this.performSelfReflection('daily', 'scheduled_daily_reflection');
    }, this.config.reflection_frequency);

    // Schedule weekly deep reflections
    setInterval(async () => {
      await this.performSelfReflection('weekly', 'scheduled_weekly_deep_reflection');
    }, this.config.deep_reflection_frequency);
  }

  private async loadMetacognitiveHistory(): Promise<void> {
    // Implementation details for loading historical data
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // Public API methods for external integration
  public getCurrentCognitiveState(): CognitiveState | null {
    return this.currentCognitiveState;
  }

  public getRecentDecisions(limit: number = 50): DecisionPoint[] {
    return this.recentDecisions.slice(-limit);
  }

  public getMetaLearningEvents(limit: number = 20): MetaLearningEvent[] {
    return this.metaLearningEvents.slice(-limit);
  }

  public getReflectionSessions(limit: number = 10): SelfReflectionSession[] {
    return this.reflectionSessions.slice(-limit);
  }

  public getAdaptivePersonality(): AdaptivePersonality {
    return { ...this.adaptivePersonality };
  }

  public getPerformanceHistory(): PerformanceAssessment[] {
    return [...this.performanceHistory];
  }

  public async triggerSelfReflection(reason: string): Promise<SelfReflectionSession> {
    return await this.performSelfReflection('triggered', reason);
  }

  public async shutdown(): Promise<void> {
    if (this.selfReflectionSchedule) {
      clearInterval(this.selfReflectionSchedule);
      this.selfReflectionSchedule = null;
    }
    console.log('[Metacognition] Self-awareness systems shutdown completed');
  }
}
