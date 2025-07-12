import { GoalDatabase } from '@/lib/core/GoalDatabase';
import { SoulSystem } from './SoulSystem';
import { getEmotionEngine } from '@/lib/shared/instances';
import { EmotionEngine } from './EmotionEngine';
import { MemorySystem } from '@/lib/core/memory';
import { StateManager } from '@/lib/core/StateManager';
import { Brain } from '@/lib/core/brain';
import { MultiAgentManager } from '@/lib/agents/MultiAgentManager';
import { ResponseCache } from './ResponseCache';
import { 
  Goal, 
  GoalReflection,
  GoalThought, 
  GoalAction,
  GoalPriorityQueueItem,
  GoalMetrics,
  GoalTier
} from '@/lib/types/goal-types';

// New interface for conversation pattern analysis
interface ConversationPattern {
  id: string;
  pattern_type: 'implicit_goal' | 'recurring_topic' | 'user_frustration' | 'knowledge_gap';
  frequency: number;
  context: string;
  evidence: string[];
  confidence: number;
  suggested_goals: string[];
}

// New interface for user behavior modeling
interface UserBehaviorModel {
  interaction_patterns: {
    preferred_communication_style: string;
    typical_session_length: number;
    most_active_times: string[];
    common_request_types: string[];
  };
  emotional_patterns: {
    stress_triggers: string[];
    satisfaction_indicators: string[];
    engagement_levels: Record<string, number>;
  };
  learning_preferences: {
    preferred_explanation_style: string;
    complexity_tolerance: number;
    feedback_frequency: string;
  };
}

// New interface for predictive goal creation
interface PredictiveGoal {
  predicted_need: string;
  probability: number;
  timing_suggestion: string;
  context_triggers: string[];
  preemptive_actions: string[];
}

export class GoalEngine {
  private static instance: GoalEngine | null = null;
  private db: GoalDatabase;
  private soulSystem: SoulSystem;
  private emotionEngine: EmotionEngine;
  private memorySystem: MemorySystem;
  private stateManager: StateManager;
  private brain!: Brain;
  private agentManager!: MultiAgentManager;
  private isInitialized: boolean = false;
  private priorityQueue: GoalPriorityQueueItem[] = [];
  private activeGoal: Goal | null = null;
  private lastReflectionTime: number = 0;
  private readonly REFLECTION_INTERVAL = 5 * 60 * 1000; // 5 minutes

  // New properties for advanced CEREBRUM capabilities
  private conversationPatterns: ConversationPattern[] = [];
  private userBehaviorModel: UserBehaviorModel | null = null;
  private predictiveGoals: PredictiveGoal[] = [];

  private constructor() {
    this.db = new GoalDatabase();
    this.soulSystem = new SoulSystem();
    this.emotionEngine = getEmotionEngine();
    this.memorySystem = new MemorySystem();
    this.stateManager = new StateManager();
    
    // Initialize Brain with required parameters
    try {
      const responseCache = new ResponseCache();
      this.brain = new Brain(this.stateManager, this.emotionEngine, responseCache);
    } catch (error) {
      console.warn('Brain initialization deferred:', error);
    }
    
    // Initialize MultiAgentManager with required parameters
    try {
      this.agentManager = new MultiAgentManager(
        this.stateManager,
        this.brain, // Brain is now initialized
        this.emotionEngine
      );
    } catch (error) {
      console.warn('MultiAgentManager initialization deferred:', error);
    }
  }

  public static getInstance(): GoalEngine {
    if (!GoalEngine.instance) {
      GoalEngine.instance = new GoalEngine();
    }
    return GoalEngine.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.db.initialize();
      await this.memorySystem.initialize();
      await this.loadPriorityQueue();
      await this.loadActiveGoal();
      
      // Start background processes
      this.startReflectionCycle();
      this.startGoalProcessing();
      this.startTierBasedProcessing();
      
      this.isInitialized = true;
      console.log('Enhanced Goal Engine with three-tier system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Goal Engine:', error);
      throw error;
    }
  }

  // ===== THREE-TIER GOAL SYSTEM =====

  /**
   * Start tier-based goal processing that handles different types of goals differently
   */
  private startTierBasedProcessing(): void {
    setInterval(async () => {
      try {
        await this.processTierBasedGoals();
      } catch (error) {
        console.error('[GoalEngine] Tier-based processing error:', error);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Process goals based on their tier level
   */
  private async processTierBasedGoals(): Promise<void> {
    const allGoals = await this.db.getActiveGoals();
    
    // Separate goals by tier
    const userDerivedGoals = allGoals.filter(g => g.category === 'user_derived');
    const internalGoals = allGoals.filter(g => g.category === 'internal_system');
    const cerebrumGoals = allGoals.filter(g => g.category === 'cerebrum_autonomous');

    // Process each tier with appropriate priority
    await this.processUserDerivedGoals(userDerivedGoals);
    await this.processInternalSystemGoals(internalGoals);
    await this.processCerebrumAutonomousGoals(cerebrumGoals);
  }

  /**
   * Process user-derived goals with high priority and user feedback loops
   */
  private async processUserDerivedGoals(goals: Goal[]): Promise<void> {
    for (const goal of goals) {
      if (goal.tier?.characteristics.proactive_updates) {
        await this.checkForUserUpdateTriggers(goal);
      }
      
      if (goal.tier?.characteristics.can_delegate_to_agents) {
        await this.delegateToAgentsIfNeeded(goal);
      }
    }
  }

  /**
   * Process internal system goals with automatic execution
   */
  private async processInternalSystemGoals(goals: Goal[]): Promise<void> {
    for (const goal of goals) {
      if (goal.tier?.characteristics.autonomous_execution) {
        await this.executeAutonomousSystemGoal(goal);
      }
    }
  }

  /**
   * Process CEREBRUM autonomous goals with advanced AI capabilities
   */
  private async processCerebrumAutonomousGoals(goals: Goal[]): Promise<void> {
    for (const goal of goals) {
      // Check if goal needs user approval
      if (goal.status === 'waiting_approval' && goal.tier?.characteristics.requires_user_approval) {
        await this.handleCerebrumApprovalFlow(goal);
      }
      
      // Execute approved CEREBRUM goals
      if (goal.status === 'active' && goal.tier?.characteristics.autonomous_execution) {
        await this.executeCerebrumGoal(goal);
      }
      
      // Handle completion presentation
      if (goal.status === 'completed' && goal.tier?.characteristics.completion_presentation) {
        await this.presentCerebrumCompletion(goal);
      }
    }
  }

  /**
   * Execute a CEREBRUM goal with full autonomous capabilities
   */
  private async executeCerebrumGoal(goal: Goal): Promise<void> {
    try {
      console.log(`[GoalEngine] Executing CEREBRUM goal: ${goal.title}`);
      
      // Update progress based on agent work
      if (goal.cerebrum_metadata?.agent_assignments) {
        for (const assignment of goal.cerebrum_metadata.agent_assignments) {
          if (assignment.status === 'pending') {
            // Start agent work
            assignment.status = 'active';
            await this.startAgentWork(assignment, goal);
          }
        }
      }
      
      // Check milestones and create deliverables
      await this.trackCerebrumProgress(goal);
      
      // Autonomously create sub-goals if needed
      if (goal.tier?.characteristics.can_create_subgoals) {
        await this.createAutonomousSubGoals(goal);
      }
      
    } catch (error) {
      console.error(`[GoalEngine] Error executing CEREBRUM goal ${goal.id}:`, error);
    }
  }

  /**
   * Handle the approval flow for CEREBRUM goals
   */
  private async handleCerebrumApprovalFlow(goal: Goal): Promise<void> {
    // Create interaction for user approval
    const interactionMessage = this.generateApprovalMessage(goal);
    
    // This would trigger the Interaction tab notification
    console.log(`[GoalEngine] CEREBRUM Goal Approval Request: ${interactionMessage}`);
    
    // For now, auto-approve after a delay (in real implementation, wait for user response)
    setTimeout(async () => {
      if (goal.status === 'waiting_approval') {
        goal.status = 'active';
        await this.db.updateGoal(goal.id, goal);
        console.log(`[GoalEngine] CEREBRUM goal auto-approved: ${goal.title}`);
      }
    }, 60000); // 1 minute delay
  }

  /**
   * Present completed CEREBRUM work to the user
   */
  private async presentCerebrumCompletion(goal: Goal): Promise<void> {
    const completionMessage = this.generateCompletionPresentation(goal);
    
    // This would trigger the Interaction tab with completion presentation
    console.log(`[GoalEngine] CEREBRUM Completion Presentation: ${completionMessage}`);
    
    // Create deliverable summary
    const deliverableSummary = await this.createDeliverableSummary(goal);
    console.log(`[GoalEngine] Deliverables created:`, deliverableSummary);
  }

  /**
   * Generate approval message for CEREBRUM goals
   */
  private generateApprovalMessage(goal: Goal): string {
    const evidence = goal.origin?.evidence || [];
    const confidence = goal.origin?.confidence || 0;
    
    return `Hi! I've been analyzing our conversations and noticed you've been interested in ${goal.title.toLowerCase()}. ` +
           `Based on ${evidence.length} pieces of evidence with ${(confidence * 100).toFixed(0)}% confidence, ` +
           `I'd like to autonomously work on this for you. I can create everything you need and present the results when complete. ` +
           `Would you like me to proceed?`;
  }

  /**
   * Generate completion presentation message
   */
  private generateCompletionPresentation(goal: Goal): string {
    const deliverables = goal.success_criteria?.deliverables || [];
    
    return `Great news! I've completed "${goal.title}" for you! ` +
           `I've created ${deliverables.length} deliverables including everything you need. ` +
           `Here's what I've accomplished and all the details...`;
  }

  /**
   * Create autonomous sub-goals for complex CEREBRUM goals
   */
  private async createAutonomousSubGoals(parentGoal: Goal): Promise<void> {
    // Analyze the parent goal and create sub-goals
    const subGoalIdeas = this.analyzeSubGoalOpportunities(parentGoal);
    
    for (const idea of subGoalIdeas) {
      const subGoal = await this.createSubGoal(parentGoal, idea);
      if (subGoal) {
        parentGoal.sub_goal_ids.push(subGoal.id);
        await this.db.updateGoal(parentGoal.id, parentGoal);
        await this.db.createGoal(subGoal);
      }
    }
  }

  /**
   * Analyze opportunities for sub-goal creation
   */
  private analyzeSubGoalOpportunities(goal: Goal): string[] {
    const opportunities: string[] = [];
    
    // Example: For JavaScript Neural Network goal
    if (goal.title?.toLowerCase().includes('neural network') && goal.title?.toLowerCase().includes('javascript')) {
      opportunities.push(
        'Research existing JavaScript ML libraries',
        'Design neural network architecture',
        'Implement core neural network classes',
        'Create training algorithms',
        'Develop testing and validation suite',
        'Write comprehensive documentation',
        'Create example implementations'
      );
    }
    
    // Example: For Business Plan goal
    if (goal.title?.toLowerCase().includes('business plan')) {
      opportunities.push(
        'Market research and analysis',
        'Competitive analysis',
        'Financial projections',
        'Marketing strategy',
        'Operations plan',
        'Risk assessment'
      );
    }
    
    return opportunities;
  }

  /**
   * Create a sub-goal from an idea
   */
  private async createSubGoal(parentGoal: Goal, idea: string): Promise<Goal | null> {
    const subGoal: Goal = {
      id: `subgoal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: idea,
      description: `Sub-goal of "${parentGoal.title}": ${idea}`,
      type: 'micro_task',
      category: parentGoal.category,
      tier: parentGoal.tier,
      priority: parentGoal.priority - 1,
      status: 'active',
      progress: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      target_completion: null,
      actual_completion: null,
      parent_goal_id: parentGoal.id,
      origin: {
        source: 'cerebrum_analysis',
        confidence: 0.8,
        evidence: [`Autonomous sub-goal creation for ${parentGoal.title}`],
        timestamp: new Date().toISOString(),
        creator_agent: 'GoalEngine'
      },
      triggered_by: {
        cerebrum_analysis: {
          analysis_type: 'need_identification',
          confidence: 0.8,
          reasoning: [`Sub-task identified for ${parentGoal.title}`],
          supporting_evidence: [],
          risk_assessment: 0.1,
          potential_value: 0.7
        }
      },
      success_criteria: {
        description: `Complete ${idea} as part of ${parentGoal.title}`,
        measurable_outcomes: [],
        completion_conditions: ['Task completed', 'Quality validated'],
        deliverables: []
      },
      sub_goal_ids: [],
      related_goal_ids: [],
      blocking_dependencies: [],
      reflections: [],
      thoughts: [],
      actions_taken: [],
      agent_interactions: []
    };
    
    return subGoal;
  }

  // Helper methods for the new system
  private async checkForUserUpdateTriggers(goal: Goal): Promise<void> {
    // Check if user needs progress updates
    const progressThreshold = 25; // Every 25% progress
    const currentProgress = goal.progress || 0;
    const lastUpdateProgress = goal.progress;
    
    if (currentProgress - lastUpdateProgress >= progressThreshold) {
      console.log(`[GoalEngine] Progress update triggered for goal: ${goal.title} (${currentProgress}%)`);
    }
  }

  private async delegateToAgentsIfNeeded(goal: Goal): Promise<void> {
    // Implementation for agent delegation
    console.log(`[GoalEngine] Checking agent delegation for goal: ${goal.title}`);
  }

  private async executeAutonomousSystemGoal(goal: Goal): Promise<void> {
    // Implementation for autonomous system goal execution
    console.log(`[GoalEngine] Executing autonomous system goal: ${goal.title}`);
  }

  private async startAgentWork(assignment: any, goal: Goal): Promise<void> {
    // Implementation for starting agent work
    console.log(`[GoalEngine] Starting agent work: ${assignment.agent_name} for ${goal.title}`);
  }

  private async trackCerebrumProgress(goal: Goal): Promise<void> {
    // Implementation for tracking CEREBRUM goal progress
    console.log(`[GoalEngine] Tracking progress for CEREBRUM goal: ${goal.title}`);
  }

  private async createDeliverableSummary(goal: Goal): Promise<string[]> {
    // Implementation for creating deliverable summaries
    return [`Summary of deliverables for ${goal.title}`];
  }

  // ===== GOAL CREATION LOGIC =====
  
  /**
   * Enhanced analyzeAndCreateGoals with CEREBRUM intelligence
   */
  public async analyzeAndCreateGoals(): Promise<Goal[]> {
    try {
      console.log('[GoalEngine] Starting enhanced CEREBRUM goal analysis...');
      
      // Update patterns and predictions
      await this.analyzeConversationPatterns();
      await this.generatePredictiveGoals();
      
      const createdGoals: Goal[] = [];

      // Create goals from conversation patterns
      for (const pattern of this.conversationPatterns) {
        if (pattern.confidence > 0.7) {
          for (const goalIdea of pattern.suggested_goals) {
            const goal = await this.createCerebrumGoal(goalIdea, pattern);
            if (goal) {
              await this.db.createGoal(goal);
              createdGoals.push(goal);
            }
          }
        }
      }

      // Create predictive goals when appropriate
      for (const prediction of this.predictiveGoals) {
        if (prediction.probability > 0.8) {
          const goal = await this.createPredictiveGoalObject(prediction);
          if (goal) {
            await this.db.createGoal(goal);
            createdGoals.push(goal);
          }
        }
      }

      console.log(`[GoalEngine] Created ${createdGoals.length} CEREBRUM goals`);
      return createdGoals;
    } catch (error) {
      console.error('[GoalEngine] Error in enhanced goal analysis:', error);
      return [];
    }
  }

  /**
   * Initialize advanced CEREBRUM capabilities
   */
  private async initializeAdvancedCerebrum(): Promise<void> {
    try {
      await this.loadUserBehaviorModel();
      await this.analyzeConversationPatterns();
      await this.generatePredictiveGoals();
      console.log('[GoalEngine] Advanced CEREBRUM capabilities initialized');
    } catch (error) {
      console.error('[GoalEngine] Error initializing advanced CEREBRUM:', error);
    }
  }

  /**
   * Advanced conversation pattern analysis for implicit goal detection
   */
  private async analyzeConversationPatterns(): Promise<void> {
    try {
      // Get recent conversations from memory
      const recentConversations = await this.memory.getRecentConversations(100);
      const patterns: ConversationPattern[] = [];

      // Analyze for implicit goals
      for (const conversation of recentConversations) {
        const implicitGoals = await this.detectImplicitGoals(conversation);
        patterns.push(...implicitGoals);
      }

      // Analyze for recurring topics
      const recurringTopics = await this.identifyRecurringTopics(recentConversations);
      patterns.push(...recurringTopics);

      // Analyze for user frustrations
      const frustrationPatterns = await this.detectUserFrustrations(recentConversations);
      patterns.push(...frustrationPatterns);

      // Store patterns for goal generation
      this.conversationPatterns = patterns;
      
      console.log(`[GoalEngine] Identified ${patterns.length} conversation patterns`);
    } catch (error) {
      console.error('[GoalEngine] Error analyzing conversation patterns:', error);
    }
  }

  /**
   * Detect implicit goals from conversation content
   */
  private async detectImplicitGoals(conversation: any): Promise<ConversationPattern[]> {
    const patterns: ConversationPattern[] = [];
    
    try {
      const prompt = `Analyze this conversation for implicit goals or needs that the user hasn't explicitly stated:

Conversation: ${JSON.stringify(conversation)}

Identify:
1. Unstated needs or wants
2. Problems the user is trying to solve
3. Skills they want to develop
4. Information they're seeking
5. Tasks they're avoiding or struggling with

Return JSON array of patterns found:
{
  "patterns": [{
    "pattern_type": "implicit_goal",
    "context": "brief description",
    "evidence": ["specific quotes or indicators"],
    "confidence": 0.8,
    "suggested_goals": ["potential goal 1", "potential goal 2"]
  }]
}`;

      const response = await this.brain.askLLM(prompt, 'gemma3:latest', 0.1);
      const result = JSON.parse(response.match(/\{.*\}/s)?.[0] || '{"patterns": []}');
      
      return result.patterns.map((p: any, index: number) => ({
        id: `implicit_${Date.now()}_${index}`,
        pattern_type: 'implicit_goal',
        frequency: 1,
        context: p.context,
        evidence: p.evidence,
        confidence: p.confidence,
        suggested_goals: p.suggested_goals
      }));
    } catch (error) {
      console.error('[GoalEngine] Error detecting implicit goals:', error);
      return [];
    }
  }

  /**
   * Identify recurring topics that might indicate ongoing interests
   */
  private async identifyRecurringTopics(conversations: any[]): Promise<ConversationPattern[]> {
    const topicCounts: Record<string, { count: number; contexts: string[] }> = {};
    const patterns: ConversationPattern[] = [];

    try {
      // Extract topics from conversations
      for (const conv of conversations) {
        const topics = await this.extractTopics(conv);
        topics.forEach(topic => {
          if (!topicCounts[topic]) {
            topicCounts[topic] = { count: 0, contexts: [] };
          }
          topicCounts[topic].count++;
          topicCounts[topic].contexts.push(conv.context || '');
        });
      }

      // Identify frequently discussed topics
      Object.entries(topicCounts).forEach(([topic, data]) => {
        if (data.count >= 3) { // Topic mentioned 3+ times
          patterns.push({
            id: `recurring_${Date.now()}_${topic.replace(/\s+/g, '_')}`,
            pattern_type: 'recurring_topic',
            frequency: data.count,
            context: `Recurring interest in ${topic}`,
            evidence: data.contexts.slice(0, 3),
            confidence: Math.min(0.9, data.count * 0.2),
            suggested_goals: [
              `Learn more about ${topic}`,
              `Become proficient in ${topic}`,
              `Create something related to ${topic}`
            ]
          });
        }
      });

      return patterns;
    } catch (error) {
      console.error('[GoalEngine] Error identifying recurring topics:', error);
      return [];
    }
  }

  /**
   * Extract topics from conversation using LLM
   */
  private async extractTopics(conversation: any): Promise<string[]> {
    try {
      const prompt = `Extract the main topics or subjects discussed in this conversation:

${JSON.stringify(conversation)}

Return a simple JSON array of topics (max 5):
["topic1", "topic2", "topic3"]`;

      const response = await this.brain.askLLM(prompt, 'gemma3:latest', 0.1);
      const topics = JSON.parse(response.match(/\[.*\]/s)?.[0] || '[]');
      return Array.isArray(topics) ? topics : [];
    } catch (error) {
      console.error('[GoalEngine] Error extracting topics:', error);
      return [];
    }
  }

  /**
   * Detect user frustrations that could be addressed with goals
   */
  private async detectUserFrustrations(conversations: any[]): Promise<ConversationPattern[]> {
    const patterns: ConversationPattern[] = [];

    try {
      for (const conv of conversations) {
        if (this.containsFrustrationIndicators(conv)) {
          const frustrationAnalysis = await this.analyzeFrustration(conv);
          if (frustrationAnalysis) {
            patterns.push(frustrationAnalysis);
          }
        }
      }

      return patterns;
    } catch (error) {
      console.error('[GoalEngine] Error detecting user frustrations:', error);
      return [];
    }
  }

  /**
   * Check if conversation contains frustration indicators
   */
  private containsFrustrationIndicators(conversation: any): boolean {
    const frustrationKeywords = [
      'frustrated', 'annoying', 'difficult', 'struggling', 'stuck',
      'problem', 'issue', 'broken', 'not working', 'help', 'confused'
    ];
    
    const text = JSON.stringify(conversation).toLowerCase();
    return frustrationKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Analyze specific frustration to suggest goals
   */
  private async analyzeFrustration(conversation: any): Promise<ConversationPattern | null> {
    try {
      const prompt = `Analyze this conversation for user frustration and suggest goals to address it:

${JSON.stringify(conversation)}

Return JSON:
{
  "frustration_detected": true/false,
  "context": "what the user is frustrated about",
  "evidence": ["quotes showing frustration"],
  "suggested_goals": ["specific actionable goals to help"]
}`;

      const response = await this.brain.askLLM(prompt, 'gemma3:latest', 0.1);
      const result = JSON.parse(response.match(/\{.*\}/s)?.[0] || '{}');
      
      if (result.frustration_detected) {
        return {
          id: `frustration_${Date.now()}`,
          pattern_type: 'user_frustration',
          frequency: 1,
          context: result.context,
          evidence: result.evidence,
          confidence: 0.7,
          suggested_goals: result.suggested_goals
        };
      }

      return null;
    } catch (error) {
      console.error('[GoalEngine] Error analyzing frustration:', error);
      return null;
    }
  }

  /**
   * Load and update user behavior model
   */
  private async loadUserBehaviorModel(): Promise<void> {
    try {
      // Get user interaction history
      const interactions = await this.memory.getInteractionHistory(200);
      const emotions = await this.emotionEngine.getEmotionHistory(100);
      
      // Build behavior model
      this.userBehaviorModel = await this.buildBehaviorModel(interactions, emotions);
      
      console.log('[GoalEngine] User behavior model updated');
    } catch (error) {
      console.error('[GoalEngine] Error loading user behavior model:', error);
    }
  }

  /**
   * Build comprehensive user behavior model
   */
  private async buildBehaviorModel(interactions: any[], emotions: any[]): Promise<UserBehaviorModel> {
    // Analyze interaction patterns
    const sessionLengths = interactions.map(i => i.duration || 0);
    const avgSessionLength = sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length;
    
    // Analyze communication style
    const communicationStyle = await this.analyzeCommunicationStyle(interactions);
    
    // Analyze emotional patterns
    const emotionalPatterns = this.analyzeEmotionalPatterns(emotions);
    
    return {
      interaction_patterns: {
        preferred_communication_style: communicationStyle,
        typical_session_length: avgSessionLength,
        most_active_times: this.findActiveTimePatterns(interactions),
        common_request_types: this.categorizeRequestTypes(interactions)
      },
      emotional_patterns: emotionalPatterns,
      learning_preferences: {
        preferred_explanation_style: 'detailed', // Default, can be refined
        complexity_tolerance: 0.7,
        feedback_frequency: 'moderate'
      }
    };
  }

  /**
   * Analyze user's preferred communication style
   */
  private async analyzeCommunicationStyle(interactions: any[]): Promise<string> {
    try {
      const recentMessages = interactions.slice(-20).map(i => i.message || '').join(' ');
      
      const prompt = `Analyze this user's communication style from their messages:

${recentMessages}

Classify their style as one of:
- formal: Professional, structured language
- casual: Relaxed, informal tone
- technical: Precise, detail-oriented
- conversational: Friendly, chatty
- direct: Concise, to-the-point

Return just the style name.`;

      const response = await this.brain.askLLM(prompt, 'gemma3:latest', 0.1);
      return response.trim().toLowerCase();
    } catch (error) {
      console.error('[GoalEngine] Error analyzing communication style:', error);
      return 'conversational';
    }
  }

  /**
   * Analyze emotional patterns from emotion history
   */
  private analyzeEmotionalPatterns(emotions: any[]): any {
    const stressTriggers: string[] = [];
    const satisfactionIndicators: string[] = [];
    const engagementLevels: Record<string, number> = {};

    emotions.forEach(emotion => {
      if (emotion.arousal > 0.7) {
        stressTriggers.push(emotion.context || 'unknown');
      }
      if (emotion.valence > 0.7) {
        satisfactionIndicators.push(emotion.context || 'positive interaction');
      }
      
      const topic = emotion.context || 'general';
      engagementLevels[topic] = (engagementLevels[topic] || 0) + emotion.arousal;
    });

    return {
      stress_triggers: [...new Set(stressTriggers)].slice(0, 10),
      satisfaction_indicators: [...new Set(satisfactionIndicators)].slice(0, 10),
      engagement_levels: engagementLevels
    };
  }

  /**
   * Find patterns in user's active times
   */
  private findActiveTimePatterns(interactions: any[]): string[] {
    const timeSlots: Record<string, number> = {};
    
    interactions.forEach(interaction => {
      if (interaction.timestamp) {
        const hour = new Date(interaction.timestamp).getHours();
        const timeSlot = this.getTimeSlot(hour);
        timeSlots[timeSlot] = (timeSlots[timeSlot] || 0) + 1;
      }
    });

    return Object.entries(timeSlots)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([slot]) => slot);
  }

  /**
   * Get time slot name for hour
   */
  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  /**
   * Categorize types of user requests
   */
  private categorizeRequestTypes(interactions: any[]): string[] {
    const categories: Record<string, number> = {};
    
    interactions.forEach(interaction => {
      const category = this.categorizeRequest(interaction.message || '');
      categories[category] = (categories[category] || 0) + 1;
    });

    return Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);
  }

  /**
   * Categorize a single request
   */
  private categorizeRequest(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('help') || lowerMessage.includes('how')) return 'help_seeking';
    if (lowerMessage.includes('create') || lowerMessage.includes('make')) return 'creation_request';
    if (lowerMessage.includes('explain') || lowerMessage.includes('what')) return 'information_seeking';
    if (lowerMessage.includes('fix') || lowerMessage.includes('problem')) return 'problem_solving';
    if (lowerMessage.includes('plan') || lowerMessage.includes('strategy')) return 'planning';
    
    return 'general_conversation';
  }

  /**
   * Generate predictive goals based on user patterns
   */
  private async generatePredictiveGoals(): Promise<void> {
    try {
      const predictiveGoals: PredictiveGoal[] = [];

      // Predict based on conversation patterns
      for (const pattern of this.conversationPatterns) {
        if (pattern.confidence > 0.6) {
          const predictive = await this.createPredictiveGoal(pattern);
          if (predictive) predictiveGoals.push(predictive);
        }
      }

      // Predict based on user behavior model
      if (this.userBehaviorModel) {
        const behaviorBasedGoals = await this.predictFromBehavior(this.userBehaviorModel);
        predictiveGoals.push(...behaviorBasedGoals);
      }

      this.predictiveGoals = predictiveGoals;
      console.log(`[GoalEngine] Generated ${predictiveGoals.length} predictive goals`);
    } catch (error) {
      console.error('[GoalEngine] Error generating predictive goals:', error);
    }
  }

  /**
   * Create predictive goal from conversation pattern
   */
  private async createPredictiveGoal(pattern: ConversationPattern): Promise<PredictiveGoal | null> {
    try {
      const prompt = `Based on this conversation pattern, predict a user need and suggest timing:

Pattern: ${JSON.stringify(pattern)}

Create a predictive goal:
{
  "predicted_need": "what the user will likely need",
  "probability": 0.8,
  "timing_suggestion": "when to offer this",
  "context_triggers": ["situations that indicate this need"],
  "preemptive_actions": ["things I can prepare in advance"]
}`;

      const response = await this.brain.askLLM(prompt, 'gemma3:latest', 0.1);
      const result = JSON.parse(response.match(/\{.*\}/s)?.[0] || '{}');
      
      return result.predicted_need ? result : null;
    } catch (error) {
      console.error('[GoalEngine] Error creating predictive goal:', error);
      return null;
    }
  }

  /**
   * Predict goals from user behavior model
   */
  private async predictFromBehavior(behaviorModel: UserBehaviorModel): Promise<PredictiveGoal[]> {
    const predictions: PredictiveGoal[] = [];

    try {
      // Predict based on stress triggers
      behaviorModel.emotional_patterns.stress_triggers.forEach(trigger => {
        predictions.push({
          predicted_need: `Support for ${trigger}`,
          probability: 0.7,
          timing_suggestion: 'when stress indicators appear',
          context_triggers: [trigger],
          preemptive_actions: [`Prepare helpful resources for ${trigger}`]
        });
      });

      // Predict based on engagement levels
      Object.entries(behaviorModel.emotional_patterns.engagement_levels).forEach(([topic, level]) => {
        if (level > 5) { // High engagement threshold
          predictions.push({
            predicted_need: `Advanced content about ${topic}`,
            probability: 0.8,
            timing_suggestion: 'during high engagement periods',
            context_triggers: [`discussion about ${topic}`],
            preemptive_actions: [`Curate advanced ${topic} resources`]
          });
        }
      });

      return predictions;
    } catch (error) {
      console.error('[GoalEngine] Error predicting from behavior:', error);
      return [];
    }
  }

  /**
   * Create a CEREBRUM goal from pattern analysis
   */
  private async createCerebrumGoal(goalIdea: string, pattern: ConversationPattern): Promise<Goal | null> {
    try {
      const goalId = `cerebrum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const goal: Goal = {
        id: goalId,
        title: goalIdea,
        description: `CEREBRUM-generated goal based on ${pattern.pattern_type} analysis`,
        type: 'long_term',
        category: 'soul_driven',
        priority: Math.round(pattern.confidence * 5),
        status: 'waiting_approval',
        progress: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        triggered_by: {
          source: 'cerebrum_pattern_analysis',
          pattern_id: pattern.id,
          confidence: pattern.confidence
        },
        tier: {
          name: 'CEREBRUM',
          level: 3,
          characteristics: {
            requires_user_approval: true,
            autonomous_execution: true,
            can_create_subgoals: true,
            can_delegate_to_agents: true,
            completion_presentation: true,
            learning_integration: true
          }
        },
        cerebrum_metadata: {
          pattern_analysis: pattern,
          auto_generated: true,
          approval_pending: true,
          intelligence_level: 'advanced'
        },
        success_criteria: {
          deliverables: [`Complete analysis of ${goalIdea}`, `Actionable recommendations`, `Progress tracking system`],
          acceptance_criteria: [`User satisfaction with results`, `Measurable improvement in target area`]
        },
        sub_goal_ids: [],
        related_goal_ids: []
      };

      return goal;
    } catch (error) {
      console.error('[GoalEngine] Error creating CEREBRUM goal:', error);
      return null;
    }
  }

  /**
   * Create goal object from predictive goal
   */
  private async createPredictiveGoalObject(prediction: PredictiveGoal): Promise<Goal | null> {
    try {
      const goalId = `predictive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const goal: Goal = {
        id: goalId,
        title: prediction.predicted_need,
        description: `Predictive goal generated by CEREBRUM intelligence (${Math.round(prediction.probability * 100)}% confidence)`,
        type: 'short_term',
        category: 'system_driven',
        priority: Math.round(prediction.probability * 5),
        status: 'pending',
        progress: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        triggered_by: {
          source: 'cerebrum_prediction',
          prediction: prediction,
          confidence: prediction.probability
        },
        tier: {
          name: 'CEREBRUM_PREDICTIVE',
          level: 2,
          characteristics: {
            requires_user_approval: false,
            autonomous_execution: true,
            can_create_subgoals: false,
            can_delegate_to_agents: true,
            completion_presentation: false,
            learning_integration: true
          }
        },
        cerebrum_metadata: {
          predictive_goal: true,
          trigger_conditions: prediction.context_triggers,
          preemptive_actions: prediction.preemptive_actions,
          timing_suggestion: prediction.timing_suggestion
        },
        success_criteria: {
          deliverables: prediction.preemptive_actions,
          acceptance_criteria: [`Resources prepared`, `User need anticipated correctly`]
        },
        sub_goal_ids: [],
        related_goal_ids: []
      };

      return goal;
    } catch (error) {
      console.error('[GoalEngine] Error creating predictive goal object:', error);
      return null;
    }
  }

  public static getInstance(): GoalEngine {
    if (!GoalEngine.instance) {
      GoalEngine.instance = new GoalEngine();
    }
    return GoalEngine.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.db.initialize();
      await this.memorySystem.initialize();
      await this.loadPriorityQueue();
      await this.loadActiveGoal();
      
      // Start background processes
      this.startReflectionCycle();
      this.startGoalProcessing();
      this.startTierBasedProcessing();
      
      this.isInitialized = true;
      console.log('Enhanced Goal Engine with three-tier system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Goal Engine:', error);
      throw error;
    }
  }

  // ===== THREE-TIER GOAL SYSTEM =====

  /**
   * Start tier-based goal processing that handles different types of goals differently
   */
  private startTierBasedProcessing(): void {
    setInterval(async () => {
      try {
        await this.processTierBasedGoals();
      } catch (error) {
        console.error('[GoalEngine] Tier-based processing error:', error);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Process goals based on their tier level
   */
  private async processTierBasedGoals(): Promise<void> {
    const allGoals = await this.db.getActiveGoals();
    
    // Separate goals by tier
    const userDerivedGoals = allGoals.filter(g => g.category === 'user_derived');
    const internalGoals = allGoals.filter(g => g.category === 'internal_system');
    const cerebrumGoals = allGoals.filter(g => g.category === 'cerebrum_autonomous');

    // Process each tier with appropriate priority
    await this.processUserDerivedGoals(userDerivedGoals);
    await this.processInternalSystemGoals(internalGoals);
    await this.processCerebrumAutonomousGoals(cerebrumGoals);
  }

  /**
   * Process user-derived goals with high priority and user feedback loops
   */
  private async processUserDerivedGoals(goals: Goal[]): Promise<void> {
    for (const goal of goals) {
      if (goal.tier?.characteristics.proactive_updates) {
        await this.checkForUserUpdateTriggers(goal);
      }
      
      if (goal.tier?.characteristics.can_delegate_to_agents) {
        await this.delegateToAgentsIfNeeded(goal);
      }
    }
  }

  /**
   * Process internal system goals with automatic execution
   */
  private async processInternalSystemGoals(goals: Goal[]): Promise<void> {
    for (const goal of goals) {
      if (goal.tier?.characteristics.autonomous_execution) {
        await this.executeAutonomousSystemGoal(goal);
      }
    }
  }

  /**
   * Process CEREBRUM autonomous goals with advanced AI capabilities
   */
  private async processCerebrumAutonomousGoals(goals: Goal[]): Promise<void> {
    for (const goal of goals) {
      // Check if goal needs user approval
      if (goal.status === 'waiting_approval' && goal.tier?.characteristics.requires_user_approval) {
        await this.handleCerebrumApprovalFlow(goal);
      }
      
      // Execute approved CEREBRUM goals
      if (goal.status === 'active' && goal.tier?.characteristics.autonomous_execution) {
        await this.executeCerebrumGoal(goal);
      }
      
      // Handle completion presentation
      if (goal.status === 'completed' && goal.tier?.characteristics.completion_presentation) {
        await this.presentCerebrumCompletion(goal);
      }
    }
  }

  /**
   * Execute a CEREBRUM goal with full autonomous capabilities
   */
  private async executeCerebrumGoal(goal: Goal): Promise<void> {
    try {
      console.log(`[GoalEngine] Executing CEREBRUM goal: ${goal.title}`);
      
      // Update progress based on agent work
      if (goal.cerebrum_metadata?.agent_assignments) {
        for (const assignment of goal.cerebrum_metadata.agent_assignments) {
          if (assignment.status === 'pending') {
            // Start agent work
            assignment.status = 'active';
            await this.startAgentWork(assignment, goal);
          }
        }
      }
      
      // Check milestones and create deliverables
      await this.trackCerebrumProgress(goal);
      
      // Autonomously create sub-goals if needed
      if (goal.tier?.characteristics.can_create_subgoals) {
        await this.createAutonomousSubGoals(goal);
      }
      
    } catch (error) {
      console.error(`[GoalEngine] Error executing CEREBRUM goal ${goal.id}:`, error);
    }
  }

  /**
   * Handle the approval flow for CEREBRUM goals
   */
  private async handleCerebrumApprovalFlow(goal: Goal): Promise<void> {
    // Create interaction for user approval
    const interactionMessage = this.generateApprovalMessage(goal);
    
    // This would trigger the Interaction tab notification
    console.log(`[GoalEngine] CEREBRUM Goal Approval Request: ${interactionMessage}`);
    
    // For now, auto-approve after a delay (in real implementation, wait for user response)
    setTimeout(async () => {
      if (goal.status === 'waiting_approval') {
        goal.status = 'active';
        await this.db.updateGoal(goal.id, goal);
        console.log(`[GoalEngine] CEREBRUM goal auto-approved: ${goal.title}`);
      }
    }, 60000); // 1 minute delay
  }

  /**
   * Present completed CEREBRUM work to the user
   */
  private async presentCerebrumCompletion(goal: Goal): Promise<void> {
    const completionMessage = this.generateCompletionPresentation(goal);
    
    // This would trigger the Interaction tab with completion presentation
    console.log(`[GoalEngine] CEREBRUM Completion Presentation: ${completionMessage}`);
    
    // Create deliverable summary
    const deliverableSummary = await this.createDeliverableSummary(goal);
    console.log(`[GoalEngine] Deliverables created:`, deliverableSummary);
  }

  /**
   * Generate approval message for CEREBRUM goals
   */
  private generateApprovalMessage(goal: Goal): string {
    const evidence = goal.origin?.evidence || [];
    const confidence = goal.origin?.confidence || 0;
    
    return `Hi! I've been analyzing our conversations and noticed you've been interested in ${goal.title.toLowerCase()}. ` +
           `Based on ${evidence.length} pieces of evidence with ${(confidence * 100).toFixed(0)}% confidence, ` +
           `I'd like to autonomously work on this for you. I can create everything you need and present the results when complete. ` +
           `Would you like me to proceed?`;
  }

  /**
   * Generate completion presentation message
   */
  private generateCompletionPresentation(goal: Goal): string {
    const deliverables = goal.success_criteria?.deliverables || [];
    
    return `Great news! I've completed "${goal.title}" for you! ` +
           `I've created ${deliverables.length} deliverables including everything you need. ` +
           `Here's what I've accomplished and all the details...`;
  }

  /**
   * Create autonomous sub-goals for complex CEREBRUM goals
   */
  private async createAutonomousSubGoals(parentGoal: Goal): Promise<void> {
    // Analyze the parent goal and create sub-goals
    const subGoalIdeas = this.analyzeSubGoalOpportunities(parentGoal);
    
    for (const idea of subGoalIdeas) {
      const subGoal = await this.createSubGoal(parentGoal, idea);
      if (subGoal) {
        parentGoal.sub_goal_ids.push(subGoal.id);
        await this.db.updateGoal(parentGoal.id, parentGoal);
        await this.db.createGoal(subGoal);
      }
    }
  }

  /**
   * Analyze opportunities for sub-goal creation
   */
  private analyzeSubGoalOpportunities(goal: Goal): string[] {
    const opportunities: string[] = [];
    
    // Example: For JavaScript Neural Network goal
    if (goal.title?.toLowerCase().includes('neural network') && goal.title?.toLowerCase().includes('javascript')) {
      opportunities.push(
        'Research existing JavaScript ML libraries',
        'Design neural network architecture',
        'Implement core neural network classes',
        'Create training algorithms',
        'Develop testing and validation suite',
        'Write comprehensive documentation',
        'Create example implementations'
      );
    }
    
    // Example: For Business Plan goal
    if (goal.title?.toLowerCase().includes('business plan')) {
      opportunities.push(
        'Market research and analysis',
        'Competitive analysis',
        'Financial projections',
        'Marketing strategy',
        'Operations plan',
        'Risk assessment'
      );
    }
    
    return opportunities;
  }

  /**
   * Create a sub-goal from an idea
   */
  private async createSubGoal(parentGoal: Goal, idea: string): Promise<Goal | null> {
    const subGoal: Goal = {
      id: `subgoal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: idea,
      description: `Sub-goal of "${parentGoal.title}": ${idea}`,
      type: 'micro_task',
      category: parentGoal.category,
      tier: parentGoal.tier,
      priority: parentGoal.priority - 1,
      status: 'active',
      progress: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      target_completion: null,
      actual_completion: null,
      parent_goal_id: parentGoal.id,
      origin: {
        source: 'cerebrum_analysis',
        confidence: 0.8,
        evidence: [`Autonomous sub-goal creation for ${parentGoal.title}`],
        timestamp: new Date().toISOString(),
        creator_agent: 'GoalEngine'
      },
      triggered_by: {
        cerebrum_analysis: {
          analysis_type: 'need_identification',
          confidence: 0.8,
          reasoning: [`Sub-task identified for ${parentGoal.title}`],
          supporting_evidence: [],
          risk_assessment: 0.1,
          potential_value: 0.7
        }
      },
      success_criteria: {
        description: `Complete ${idea} as part of ${parentGoal.title}`,
        measurable_outcomes: [],
        completion_conditions: ['Task completed', 'Quality validated'],
        deliverables: []
      },
      sub_goal_ids: [],
      related_goal_ids: [],
      blocking_dependencies: [],
      reflections: [],
      thoughts: [],
      actions_taken: [],
      agent_interactions: []
    };
    
    return subGoal;
  }

  // Helper methods for the new system
  private async checkForUserUpdateTriggers(goal: Goal): Promise<void> {
    // Check if user needs progress updates
    const progressThreshold = 25; // Every 25% progress
    const currentProgress = goal.progress || 0;
    const lastUpdateProgress = goal.progress;
    
    if (currentProgress - lastUpdateProgress >= progressThreshold) {
      console.log(`[GoalEngine] Progress update triggered for goal: ${goal.title} (${currentProgress}%)`);
    }
  }

  private async delegateToAgentsIfNeeded(goal: Goal): Promise<void> {
    // Implementation for agent delegation
    console.log(`[GoalEngine] Checking agent delegation for goal: ${goal.title}`);
  }

  private async executeAutonomousSystemGoal(goal: Goal): Promise<void> {
    // Implementation for autonomous system goal execution
    console.log(`[GoalEngine] Executing autonomous system goal: ${goal.title}`);
  }

  private async startAgentWork(assignment: any, goal: Goal): Promise<void> {
    // Implementation for starting agent work
    console.log(`[GoalEngine] Starting agent work: ${assignment.agent_name} for ${goal.title}`);
  }

  private async trackCerebrumProgress(goal: Goal): Promise<void> {
    // Implementation for tracking CEREBRUM goal progress
    console.log(`[GoalEngine] Tracking progress for CEREBRUM goal: ${goal.title}`);
  }

  private async createDeliverableSummary(goal: Goal): Promise<string[]> {
    // Implementation for creating deliverable summaries
    return [`Summary of deliverables for ${goal.title}`];
  }

  // ===== GOAL CREATION LOGIC =====
  
  /**
   * Enhanced analyzeAndCreateGoals with CEREBRUM intelligence
   */
  public async analyzeAndCreateGoals(): Promise<Goal[]> {
    try {
      console.log('[GoalEngine] Starting enhanced CEREBRUM goal analysis...');
      
      // Update patterns and predictions
      await this.analyzeConversationPatterns();
      await this.generatePredictiveGoals();
      
      const createdGoals: Goal[] = [];

      // Create goals from conversation patterns
      for (const pattern of this.conversationPatterns) {
        if (pattern.confidence > 0.7) {
          for (const goalIdea of pattern.suggested_goals) {
            const goal = await this.createCerebrumGoal(goalIdea, pattern);
            if
