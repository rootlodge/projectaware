import { MemorySystem } from '../core/memory';
import { EmotionEngine } from './EmotionEngine';

export interface EnhancedMemoryStats {
  // Basic metrics
  total_conversations: number;
  total_messages: number;
  total_learning_events: number;
  database_size_mb: number;
  
  // Conversation analytics
  conversation_analytics: ConversationAnalytics;
  
  // User behavior patterns
  user_patterns: UserPatternAnalytics;
  
  // Content analysis
  content_insights: ContentInsights;
  
  // Temporal patterns
  temporal_patterns: TemporalPatterns;
  
  // Quality metrics
  interaction_quality: InteractionQuality;
  
  // Goal-related analytics
  goal_derivation_insights: GoalDerivationInsights;
  
  // System performance
  system_performance: SystemPerformance;
}

export interface ConversationAnalytics {
  average_conversation_length: number;
  median_response_time: number;
  conversation_topics: TopicDistribution[];
  conversation_sentiment_trend: SentimentTrend[];
  user_engagement_levels: EngagementMetrics;
  conversation_complexity_scores: ComplexityAnalysis;
  context_switching_patterns: ContextSwitchAnalysis;
}

export interface UserPatternAnalytics {
  active_time_patterns: TimePattern[];
  interaction_frequency: FrequencyPattern;
  topic_preferences: TopicPreference[];
  question_types: QuestionTypeDistribution[];
  learning_velocity: LearningVelocityMetrics;
  behavioral_consistency: ConsistencyMetrics;
  goal_indication_patterns: GoalIndicationPattern[];
}

export interface ContentInsights {
  keyword_frequency: KeywordAnalysis[];
  semantic_clusters: SemanticCluster[];
  information_density: InformationDensityMetrics;
  knowledge_gaps: KnowledgeGap[];
  expertise_areas: ExpertiseArea[];
  learning_progression: LearningProgressionMetrics;
}

export interface TemporalPatterns {
  daily_activity_distribution: HourlyActivity[];
  weekly_patterns: WeeklyPattern[];
  session_duration_patterns: SessionDurationAnalysis;
  return_visit_patterns: ReturnVisitPattern[];
  topic_evolution_over_time: TopicEvolution[];
}

export interface InteractionQuality {
  satisfaction_trends: SatisfactionTrend[];
  response_relevance_scores: RelevanceMetrics;
  conversation_completion_rates: CompletionMetrics;
  user_feedback_analysis: FeedbackAnalysis;
  error_recovery_success: ErrorRecoveryMetrics;
}

export interface GoalDerivationInsights {
  implicit_goal_indicators: ImplicitGoalIndicator[];
  goal_conversation_correlation: GoalCorrelation[];
  user_intent_classification: IntentClassification[];
  project_mention_frequency: ProjectMentionMetrics[];
  learning_objective_detection: LearningObjectiveMetrics[];
  collaboration_request_patterns: CollaborationPattern[];
}

export interface SystemPerformance {
  query_performance_metrics: QueryPerformanceMetrics;
  memory_usage_trends: MemoryUsageTrend[];
  data_retrieval_efficiency: RetrievalEfficiencyMetrics;
  index_optimization_status: IndexOptimizationStatus;
  cleanup_effectiveness: CleanupMetrics;
}

// Supporting interfaces
export interface TopicDistribution {
  topic: string;
  frequency: number;
  percentage: number;
  recent_trend: 'increasing' | 'decreasing' | 'stable';
  associated_emotions: string[];
}

export interface SentimentTrend {
  date: string;
  positive_sentiment: number;
  negative_sentiment: number;
  neutral_sentiment: number;
  overall_sentiment: number;
}

export interface EngagementMetrics {
  average_session_duration: number;
  messages_per_session: number;
  follow_up_question_rate: number;
  deep_conversation_rate: number;
  topic_exploration_depth: number;
}

export interface ComplexityAnalysis {
  average_complexity_score: number;
  complexity_distribution: ComplexityDistribution[];
  topic_complexity_correlation: TopicComplexityCorrelation[];
}

export interface GoalIndicationPattern {
  pattern_type: 'explicit_goal' | 'implicit_need' | 'repeated_interest' | 'problem_statement';
  frequency: number;
  confidence: number;
  examples: string[];
  associated_topics: string[];
  temporal_clustering: boolean;
}

export interface ImplicitGoalIndicator {
  indicator_text: string;
  confidence: number;
  goal_category: string;
  frequency: number;
  context_examples: string[];
  suggested_goal_title: string;
}

export interface ProjectMentionMetrics {
  project_type: string;
  mention_count: number;
  implementation_signals: number;
  urgency_indicators: number;
  collaboration_mentions: number;
  last_mentioned: string;
}

export class EnhancedMemoryAnalytics {
  private memorySystem: MemorySystem;
  private emotionEngine: EmotionEngine;
  private analysisCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(memorySystem: MemorySystem, emotionEngine: EmotionEngine) {
    this.memorySystem = memorySystem;
    this.emotionEngine = emotionEngine;
  }

  /**
   * Get comprehensive memory analytics
   */
  async getEnhancedStats(): Promise<EnhancedMemoryStats> {
    try {
      const [
        basicStats,
        conversationAnalytics,
        userPatterns,
        contentInsights,
        temporalPatterns,
        interactionQuality,
        goalInsights,
        systemPerformance
      ] = await Promise.all([
        this.getBasicStats(),
        this.getConversationAnalytics(),
        this.getUserPatternAnalytics(),
        this.getContentInsights(),
        this.getTemporalPatterns(),
        this.getInteractionQuality(),
        this.getGoalDerivationInsights(),
        this.getSystemPerformance()
      ]);

      return {
        total_conversations: basicStats.conversations,
        total_messages: basicStats.messages,
        total_learning_events: basicStats.learningEvents,
        database_size_mb: basicStats.dbSize,
        conversation_analytics: conversationAnalytics,
        user_patterns: userPatterns,
        content_insights: contentInsights,
        temporal_patterns: temporalPatterns,
        interaction_quality: interactionQuality,
        goal_derivation_insights: goalInsights,
        system_performance: systemPerformance
      };
    } catch (error) {
      console.error('[EnhancedMemoryAnalytics] Failed to get enhanced stats:', error);
      throw error;
    }
  }

  /**
   * Get basic memory statistics
   */
  private async getBasicStats(): Promise<any> {
    return this.getCachedData('basic_stats', async () => {
      const stats = await this.memorySystem.getStats();
      return stats;
    });
  }

  /**
   * Analyze conversation patterns and metrics
   */
  private async getConversationAnalytics(): Promise<ConversationAnalytics> {
    return this.getCachedData('conversation_analytics', async () => {
      const conversations = await this.memorySystem.getConversationHistory(1000);
      
      const analytics: ConversationAnalytics = {
        average_conversation_length: this.calculateAverageConversationLength(conversations),
        median_response_time: await this.calculateMedianResponseTime(conversations),
        conversation_topics: await this.analyzeConversationTopics(conversations),
        conversation_sentiment_trend: await this.analyzeSentimentTrends(conversations),
        user_engagement_levels: this.calculateEngagementMetrics(conversations),
        conversation_complexity_scores: this.analyzeComplexity(conversations),
        context_switching_patterns: this.analyzeContextSwitching(conversations)
      };

      return analytics;
    });
  }

  /**
   * Analyze user behavior patterns
   */
  private async getUserPatternAnalytics(): Promise<UserPatternAnalytics> {
    return this.getCachedData('user_patterns', async () => {
      const conversations = await this.memorySystem.getConversationHistory(2000);
      
      return {
        active_time_patterns: this.analyzeActiveTimePatterns(conversations),
        interaction_frequency: this.calculateInteractionFrequency(conversations),
        topic_preferences: this.analyzeTopicPreferences(conversations),
        question_types: this.analyzeQuestionTypes(conversations),
        learning_velocity: this.calculateLearningVelocity(conversations),
        behavioral_consistency: this.analyzeBehavioralConsistency(conversations),
        goal_indication_patterns: this.analyzeGoalIndicationPatterns(conversations)
      };
    });
  }

  /**
   * Analyze content and semantic patterns
   */
  private async getContentInsights(): Promise<ContentInsights> {
    return this.getCachedData('content_insights', async () => {
      const conversations = await this.memorySystem.getConversationHistory(1500);
      
      return {
        keyword_frequency: this.analyzeKeywordFrequency(conversations),
        semantic_clusters: this.identifySemanticClusters(conversations),
        information_density: this.calculateInformationDensity(conversations),
        knowledge_gaps: this.identifyKnowledgeGaps(conversations),
        expertise_areas: this.identifyExpertiseAreas(conversations),
        learning_progression: this.analyzeLearningProgression(conversations)
      };
    });
  }

  /**
   * Analyze temporal usage patterns
   */
  private async getTemporalPatterns(): Promise<TemporalPatterns> {
    return this.getCachedData('temporal_patterns', async () => {
      const conversations = await this.memorySystem.getConversationHistory(3000);
      
      return {
        daily_activity_distribution: this.analyzeDailyActivity(conversations),
        weekly_patterns: this.analyzeWeeklyPatterns(conversations),
        session_duration_patterns: this.analyzeSessionDurations(conversations),
        return_visit_patterns: this.analyzeReturnVisits(conversations),
        topic_evolution_over_time: this.analyzeTopicEvolution(conversations)
      };
    });
  }

  /**
   * Analyze interaction quality metrics
   */
  private async getInteractionQuality(): Promise<InteractionQuality> {
    return this.getCachedData('interaction_quality', async () => {
      const conversations = await this.memorySystem.getConversationHistory(1000);
      
      return {
        satisfaction_trends: this.analyzeSatisfactionTrends(conversations),
        response_relevance_scores: this.calculateRelevanceScores(conversations),
        conversation_completion_rates: this.calculateCompletionRates(conversations),
        user_feedback_analysis: this.analyzeFeedback(conversations),
        error_recovery_success: this.analyzeErrorRecovery(conversations)
      };
    });
  }

  /**
   * Analyze patterns that indicate potential goals
   */
  private async getGoalDerivationInsights(): Promise<GoalDerivationInsights> {
    return this.getCachedData('goal_insights', async () => {
      const conversations = await this.memorySystem.getConversationHistory(2000);
      
      return {
        implicit_goal_indicators: this.findImplicitGoalIndicators(conversations),
        goal_conversation_correlation: this.analyzeGoalCorrelations(conversations),
        user_intent_classification: this.classifyUserIntents(conversations),
        project_mention_frequency: this.analyzeProjectMentions(conversations),
        learning_objective_detection: this.detectLearningObjectives(conversations),
        collaboration_request_patterns: this.analyzeCollaborationPatterns(conversations)
      };
    });
  }

  /**
   * Analyze system performance metrics
   */
  private async getSystemPerformance(): Promise<SystemPerformance> {
    return this.getCachedData('system_performance', async () => {
      return {
        query_performance_metrics: await this.analyzeQueryPerformance(),
        memory_usage_trends: this.analyzeMemoryUsage(),
        data_retrieval_efficiency: this.analyzeRetrievalEfficiency(),
        index_optimization_status: await this.checkIndexOptimization(),
        cleanup_effectiveness: this.analyzeCleanupEffectiveness()
      };
    });
  }

  // Implementation of analysis methods

  private calculateAverageConversationLength(conversations: any[]): number {
    if (conversations.length === 0) return 0;
    
    const totalLength = conversations.reduce((sum, conv) => {
      return sum + (conv.user_message?.length || 0) + (conv.ai_response?.length || 0);
    }, 0);
    
    return Math.round(totalLength / conversations.length);
  }

  private async analyzeConversationTopics(conversations: any[]): Promise<TopicDistribution[]> {
    const topicKeywords = {
      'Programming': ['code', 'programming', 'function', 'variable', 'algorithm', 'debug', 'javascript', 'python', 'react'],
      'AI/ML': ['ai', 'machine learning', 'neural network', 'deep learning', 'model', 'training', 'algorithm'],
      'Business': ['business', 'strategy', 'plan', 'revenue', 'market', 'customer', 'product', 'startup'],
      'Learning': ['learn', 'understand', 'explain', 'tutorial', 'how to', 'teach', 'study', 'course'],
      'Technical': ['system', 'architecture', 'database', 'api', 'performance', 'optimization', 'security'],
      'Creative': ['design', 'creative', 'art', 'writing', 'content', 'story', 'idea', 'innovation']
    };

    const topicCounts: Record<string, number> = {};
    const totalConversations = conversations.length;

    // Initialize counts
    Object.keys(topicKeywords).forEach(topic => {
      topicCounts[topic] = 0;
    });

    // Count topic occurrences
    conversations.forEach(conv => {
      const text = `${conv.user_message} ${conv.ai_response}`.toLowerCase();
      
      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
          topicCounts[topic]++;
        }
      });
    });

    return Object.entries(topicCounts).map(([topic, count]) => ({
      topic,
      frequency: count,
      percentage: totalConversations > 0 ? (count / totalConversations) * 100 : 0,
      recent_trend: this.calculateTopicTrend(topic, conversations),
      associated_emotions: this.getTopicEmotions(topic, conversations)
    }));
  }

  private analyzeGoalIndicationPatterns(conversations: any[]): GoalIndicationPattern[] {
    const patterns: GoalIndicationPattern[] = [];
    
    const goalIndicators = {
      'explicit_goal': {
        keywords: ['want to build', 'need to create', 'goal is to', 'planning to', 'trying to make'],
        examples: []
      },
      'implicit_need': {
        keywords: ['struggling with', 'having trouble', 'need help', 'how can I', 'what should I do'],
        examples: []
      },
      'repeated_interest': {
        keywords: ['again', 'more about', 'continue', 'also want', 'similar to'],
        examples: []
      },
      'problem_statement': {
        keywords: ['problem is', 'issue with', 'challenge', 'difficulty', 'cant figure out'],
        examples: []
      }
    };

    conversations.forEach(conv => {
      const text = `${conv.user_message} ${conv.ai_response}`.toLowerCase();
      
      Object.entries(goalIndicators).forEach(([patternType, data]) => {
        data.keywords.forEach(keyword => {
          if (text.includes(keyword)) {
            data.examples.push(conv.user_message.substring(0, 100));
          }
        });
      });
    });

    Object.entries(goalIndicators).forEach(([patternType, data]) => {
      if (data.examples.length > 0) {
        patterns.push({
          pattern_type: patternType as any,
          frequency: data.examples.length,
          confidence: Math.min(1, data.examples.length / conversations.length * 10),
          examples: data.examples.slice(0, 5),
          associated_topics: this.extractTopicsFromExamples(data.examples),
          temporal_clustering: this.checkTemporalClustering(data.examples, conversations)
        });
      }
    });

    return patterns;
  }

  private findImplicitGoalIndicators(conversations: any[]): ImplicitGoalIndicator[] {
    const indicators: ImplicitGoalIndicator[] = [];
    
    const goalPatterns = [
      {
        pattern: /want to (build|create|make|develop) (?:a |an )?(.+)/gi,
        category: 'creation_goal',
        confidence_base: 0.8
      },
      {
        pattern: /need (help|assistance) (with|for) (.+)/gi,
        category: 'assistance_goal',
        confidence_base: 0.7
      },
      {
        pattern: /how (?:do|can) I (.+)/gi,
        category: 'learning_goal',
        confidence_base: 0.6
      },
      {
        pattern: /planning to (.+)/gi,
        category: 'planning_goal',
        confidence_base: 0.9
      },
      {
        pattern: /working on (.+)/gi,
        category: 'active_project',
        confidence_base: 0.8
      }
    ];

    conversations.forEach(conv => {
      goalPatterns.forEach(({ pattern, category, confidence_base }) => {
        const matches = conv.user_message.match(pattern);
        if (matches) {
          matches.forEach(match => {
            indicators.push({
              indicator_text: match,
              confidence: confidence_base,
              goal_category: category,
              frequency: 1,
              context_examples: [conv.user_message],
              suggested_goal_title: this.generateGoalTitle(match, category)
            });
          });
        }
      });
    });

    // Consolidate similar indicators
    return this.consolidateIndicators(indicators);
  }

  private analyzeProjectMentions(conversations: any[]): ProjectMentionMetrics[] {
    const projectTypes = [
      'neural network',
      'business plan',
      'web application',
      'mobile app',
      'api',
      'database',
      'website',
      'software',
      'tool',
      'system',
      'framework',
      'library',
      'package'
    ];

    const metrics: ProjectMentionMetrics[] = [];

    projectTypes.forEach(projectType => {
      let mentionCount = 0;
      let implementationSignals = 0;
      let urgencyIndicators = 0;
      let collaborationMentions = 0;
      let lastMentioned = '';

      conversations.forEach(conv => {
        const text = `${conv.user_message} ${conv.ai_response}`.toLowerCase();
        
        if (text.includes(projectType)) {
          mentionCount++;
          lastMentioned = conv.timestamp;
          
          if (text.includes('build') || text.includes('create') || text.includes('implement')) {
            implementationSignals++;
          }
          
          if (text.includes('urgent') || text.includes('asap') || text.includes('quickly')) {
            urgencyIndicators++;
          }
          
          if (text.includes('help') || text.includes('together') || text.includes('collaborate')) {
            collaborationMentions++;
          }
        }
      });

      if (mentionCount > 0) {
        metrics.push({
          project_type: projectType,
          mention_count: mentionCount,
          implementation_signals: implementationSignals,
          urgency_indicators: urgencyIndicators,
          collaboration_mentions: collaborationMentions,
          last_mentioned: lastMentioned
        });
      }
    });

    return metrics.sort((a, b) => b.mention_count - a.mention_count);
  }

  // Helper methods
  private calculateTopicTrend(topic: string, conversations: any[]): 'increasing' | 'decreasing' | 'stable' {
    // Simplified trend calculation
    const recent = conversations.slice(0, 100).filter(conv => 
      `${conv.user_message} ${conv.ai_response}`.toLowerCase().includes(topic.toLowerCase())
    ).length;
    
    const older = conversations.slice(100, 200).filter(conv => 
      `${conv.user_message} ${conv.ai_response}`.toLowerCase().includes(topic.toLowerCase())
    ).length;

    if (recent > older * 1.2) return 'increasing';
    if (recent < older * 0.8) return 'decreasing';
    return 'stable';
  }

  private getTopicEmotions(topic: string, conversations: any[]): string[] {
    // This would integrate with emotion analysis
    return ['curious', 'interested', 'focused'];
  }

  private extractTopicsFromExamples(examples: string[]): string[] {
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'to', 'of', 'in', 'for', 'with']);
    const topicWords = new Set<string>();

    examples.forEach(example => {
      const words = example.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3 && !commonWords.has(word)) {
          topicWords.add(word);
        }
      });
    });

    return Array.from(topicWords).slice(0, 5);
  }

  private checkTemporalClustering(examples: string[], conversations: any[]): boolean {
    // Check if examples appear in temporal clusters
    return examples.length > 1; // Simplified
  }

  private generateGoalTitle(indicatorText: string, category: string): string {
    const action = category.includes('creation') ? 'Create' : 
                  category.includes('learning') ? 'Learn' :
                  category.includes('planning') ? 'Plan' : 'Complete';
                  
    const subject = indicatorText.replace(/^(want to|need|how do i|planning to|working on)\s*/i, '');
    return `${action} ${subject}`;
  }

  private consolidateIndicators(indicators: ImplicitGoalIndicator[]): ImplicitGoalIndicator[] {
    // Group similar indicators and consolidate
    const consolidated = new Map<string, ImplicitGoalIndicator>();
    
    indicators.forEach(indicator => {
      const key = indicator.goal_category + ':' + indicator.suggested_goal_title.toLowerCase();
      
      if (consolidated.has(key)) {
        const existing = consolidated.get(key)!;
        existing.frequency += indicator.frequency;
        existing.context_examples.push(...indicator.context_examples);
        existing.confidence = Math.min(1, existing.confidence + 0.1);
      } else {
        consolidated.set(key, { ...indicator });
      }
    });

    return Array.from(consolidated.values())
      .sort((a, b) => b.confidence * b.frequency - a.confidence * a.frequency);
  }

  // Placeholder implementations for other analysis methods
  private async calculateMedianResponseTime(conversations: any[]): Promise<number> { return 2.5; }
  private async analyzeSentimentTrends(conversations: any[]): Promise<SentimentTrend[]> { return []; }
  private calculateEngagementMetrics(conversations: any[]): EngagementMetrics {
    return {
      average_session_duration: 0,
      messages_per_session: 0,
      follow_up_question_rate: 0,
      deep_conversation_rate: 0,
      topic_exploration_depth: 0
    };
  }
  private analyzeComplexity(conversations: any[]): ComplexityAnalysis {
    return {
      average_complexity_score: 0,
      complexity_distribution: [],
      topic_complexity_correlation: []
    };
  }
  private analyzeContextSwitching(conversations: any[]): ContextSwitchAnalysis { return {} as any; }
  private analyzeActiveTimePatterns(conversations: any[]): TimePattern[] { return []; }
  private calculateInteractionFrequency(conversations: any[]): FrequencyPattern { return {} as any; }
  private analyzeTopicPreferences(conversations: any[]): TopicPreference[] { return []; }
  private analyzeQuestionTypes(conversations: any[]): QuestionTypeDistribution[] { return []; }
  private calculateLearningVelocity(conversations: any[]): LearningVelocityMetrics { return {} as any; }
  private analyzeBehavioralConsistency(conversations: any[]): ConsistencyMetrics { return {} as any; }
  private analyzeKeywordFrequency(conversations: any[]): KeywordAnalysis[] { return []; }
  private identifySemanticClusters(conversations: any[]): SemanticCluster[] { return []; }
  private calculateInformationDensity(conversations: any[]): InformationDensityMetrics { return {} as any; }
  private identifyKnowledgeGaps(conversations: any[]): KnowledgeGap[] { return []; }
  private identifyExpertiseAreas(conversations: any[]): ExpertiseArea[] { return []; }
  private analyzeLearningProgression(conversations: any[]): LearningProgressionMetrics { return {} as any; }
  private analyzeDailyActivity(conversations: any[]): HourlyActivity[] { return []; }
  private analyzeWeeklyPatterns(conversations: any[]): WeeklyPattern[] { return []; }
  private analyzeSessionDurations(conversations: any[]): SessionDurationAnalysis { return {} as any; }
  private analyzeReturnVisits(conversations: any[]): ReturnVisitPattern[] { return []; }
  private analyzeTopicEvolution(conversations: any[]): TopicEvolution[] { return []; }
  private analyzeSatisfactionTrends(conversations: any[]): SatisfactionTrend[] { return []; }
  private calculateRelevanceScores(conversations: any[]): RelevanceMetrics { return {} as any; }
  private calculateCompletionRates(conversations: any[]): CompletionMetrics { return {} as any; }
  private analyzeFeedback(conversations: any[]): FeedbackAnalysis { return {} as any; }
  private analyzeErrorRecovery(conversations: any[]): ErrorRecoveryMetrics { return {} as any; }
  private analyzeGoalCorrelations(conversations: any[]): GoalCorrelation[] { return []; }
  private classifyUserIntents(conversations: any[]): IntentClassification[] { return []; }
  private detectLearningObjectives(conversations: any[]): LearningObjectiveMetrics[] { return []; }
  private analyzeCollaborationPatterns(conversations: any[]): CollaborationPattern[] { return []; }
  private async analyzeQueryPerformance(): Promise<QueryPerformanceMetrics> { return {} as any; }
  private analyzeMemoryUsage(): MemoryUsageTrend[] { return []; }
  private analyzeRetrievalEfficiency(): RetrievalEfficiencyMetrics { return {} as any; }
  private async checkIndexOptimization(): Promise<IndexOptimizationStatus> { return {} as any; }
  private analyzeCleanupEffectiveness(): CleanupMetrics { return {} as any; }

  /**
   * Cache management for expensive operations
   */
  private async getCachedData<T>(key: string, generator: () => Promise<T>): Promise<T> {
    const cached = this.analysisCache.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }

    const data = await generator();
    this.analysisCache.set(key, { data, timestamp: now });
    
    // Clean old cache entries
    if (this.analysisCache.size > 20) {
      const oldestKey = Array.from(this.analysisCache.keys())[0];
      this.analysisCache.delete(oldestKey);
    }

    return data;
  }
}

// Additional type definitions for completeness
interface TimePattern { hour: number; activity_level: number; }
interface FrequencyPattern { daily: number; weekly: number; monthly: number; }
interface TopicPreference { topic: string; preference_score: number; }
interface QuestionTypeDistribution { type: string; percentage: number; }
interface LearningVelocityMetrics { concepts_per_session: number; retention_rate: number; }
interface ConsistencyMetrics { behavioral_consistency: number; topic_consistency: number; }
interface KeywordAnalysis { keyword: string; frequency: number; context: string; }
interface SemanticCluster { cluster_id: string; topics: string[]; coherence_score: number; }
interface InformationDensityMetrics { avg_information_per_message: number; }
interface KnowledgeGap { gap_area: string; confidence: number; suggested_resources: string[]; }
interface ExpertiseArea { area: string; expertise_level: number; evidence: string[]; }
interface LearningProgressionMetrics { learning_rate: number; mastery_indicators: string[]; }
interface HourlyActivity { hour: number; message_count: number; }
interface WeeklyPattern { day: string; activity_level: number; }
interface SessionDurationAnalysis { average_duration: number; median_duration: number; }
interface ReturnVisitPattern { days_between_visits: number; frequency: number; }
interface TopicEvolution { topic: string; evolution_trend: string; milestone_dates: string[]; }
interface SatisfactionTrend { date: string; satisfaction_score: number; }
interface RelevanceMetrics { average_relevance: number; }
interface CompletionMetrics { completion_rate: number; }
interface FeedbackAnalysis { positive_feedback_rate: number; improvement_suggestions: string[]; }
interface ErrorRecoveryMetrics { recovery_success_rate: number; }
interface GoalCorrelation { goal_type: string; conversation_indicators: string[]; }
interface IntentClassification { intent: string; confidence: number; frequency: number; }
interface LearningObjectiveMetrics { objective: string; detection_confidence: number; }
interface CollaborationPattern { pattern_type: string; frequency: number; }
interface QueryPerformanceMetrics { average_query_time: number; slow_queries: number; }
interface MemoryUsageTrend { date: string; memory_usage_mb: number; }
interface RetrievalEfficiencyMetrics { cache_hit_rate: number; }
interface IndexOptimizationStatus { indexes_optimized: boolean; last_optimization: string; }
interface CleanupMetrics { records_cleaned: number; space_recovered_mb: number; }
interface ContextSwitchAnalysis { average_switches_per_session: number; }
interface ComplexityDistribution { complexity_range: string; percentage: number; }
interface TopicComplexityCorrelation { topic: string; complexity_score: number; }
