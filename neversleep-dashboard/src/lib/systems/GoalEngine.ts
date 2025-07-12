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
  
  public async analyzeAndCreateGoals(): Promise<Goal[]> {
    const createdGoals: Goal[] = [];
    
    try {
      // Get current context
      const currentEmotion = this.emotionEngine.getCurrentEmotion();
      const soulValues = this.soulSystem.getCoreValues();
      const activeGoals = await this.db.getActiveGoals();
      
      // Create goals based on soul alignment
      const soulAlignmentGoals = await this.createSoulAlignmentGoals(soulValues, activeGoals);
      createdGoals.push(...soulAlignmentGoals);
      
      // Create goals based on emotional state
      const emotionalGoals = await this.createEmotionalGoals(currentEmotion);
      createdGoals.push(...emotionalGoals);
      
      // Create learning and improvement goals
      const improvementGoals = await this.createImprovementGoals();
      createdGoals.push(...improvementGoals);
      
      // Create user behavior goals
      const behaviorGoals = await this.createUserBehaviorGoals();
      createdGoals.push(...behaviorGoals);
      
      // Save all created goals
      for (const goal of createdGoals) {
        await this.db.createGoal(goal);
        await this.addToQueue(goal);
      }
      
      return createdGoals;
    } catch (error) {
      console.error('Error creating goals:', error);
      return createdGoals;
    }
  }

  private async createSoulAlignmentGoals(soulValues: any, activeGoals: Goal[]): Promise<Goal[]> {
    const goals: Goal[] = [];
    
    // Check if we need goals for each core value
    for (const [key, value] of Object.entries(soulValues)) {
      const hasActiveGoal = activeGoals.some(g => 
        g.description.toLowerCase().includes(key.toLowerCase()) &&
        g.status === 'active'
      );
      
      if (!hasActiveGoal && Math.random() > 0.7) { // 30% chance to create value-based goal
        const goal: Goal = {
          id: this.generateId(),
          title: `Strengthen ${key} alignment`,
          description: `Work on embodying the core value of ${key}: ${value}`,
          type: 'long_term',
          category: 'cerebrum_autonomous',
          priority: 5,
          status: 'active',
          progress: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          target_completion: this.getTargetCompletion('long_term'),
          actual_completion: null,
          triggered_by: {
            system_events: [`soul_value_${key}`]
          },
          success_criteria: {
            description: `Successfully embody ${key} in daily interactions`,
            measurable_outcomes: [
              {
                metric: `alignment_with_${key}`,
                target_value: 'High',
                current_value: 'Medium',
                measurement_method: 'Behavioral analysis',
                verification_criteria: ['User feedback', 'Interaction quality']
              },
              {
                metric: 'user_satisfaction',
                target_value: 8,
                current_value: 6,
                measurement_method: 'User feedback scoring',
                verification_criteria: ['Positive feedback ratio', 'Session duration']
              }
            ],
            completion_conditions: ['Consistent demonstration of value', 'Positive user feedback'],
            deliverables: []
          },
          sub_goal_ids: [],
          related_goal_ids: [],
          blocking_dependencies: [],
          reflections: [],
          thoughts: [],
          actions_taken: [],
          agent_interactions: [],
          tier: {
            level: 'cerebrum_autonomous',
            description: 'AI-generated goal from soul analysis',
            characteristics: {
              autonomous_execution: true,
              requires_user_approval: false,
              can_create_subgoals: true,
              can_delegate_to_agents: true,
              proactive_updates: true,
              completion_presentation: true
            },
            authority_level: 7
          },
          origin: {
            source: 'cerebrum_analysis',
            confidence: 0.8,
            evidence: ['Soul system analysis', 'Value alignment patterns'],
            timestamp: new Date().toISOString(),
            creator_agent: 'CerebrumGoalAnalyzer'
          }
        };
        goals.push(goal);
      }
    }
    
    return goals;
  }

  private async createEmotionalGoals(currentEmotion: any): Promise<Goal[]> {
    const goals: Goal[] = [];
    
    // Create emotional regulation goals based on current state
    if (currentEmotion.intensity > 0.7) {
      const goal: Goal = {
        id: this.generateId(),
        title: `Regulate ${currentEmotion.primary} intensity`,
        description: `Work on managing high intensity ${currentEmotion.primary} (${currentEmotion.intensity})`,
        type: 'short_term',
        category: 'cerebrum_autonomous',
        priority: 8,
        status: 'active',
        progress: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        target_completion: this.getTargetCompletion('short_term'),
        actual_completion: null,
        triggered_by: {
          emotional_states: [currentEmotion.primary]
        },
        success_criteria: {
          description: `Reduce ${currentEmotion.primary} intensity to manageable levels`,
          measurable_outcomes: [
            {
              metric: 'emotional_intensity',
              target_value: 3,
              current_value: 7,
              measurement_method: 'Emotion engine monitoring',
              verification_criteria: ['Sustained lower intensity', 'Stable emotional state']
            },
            {
              metric: 'emotional_stability',
              target_value: 'High',
              current_value: 'Medium',
              measurement_method: 'Variance tracking',
              verification_criteria: ['Reduced fluctuations', 'Consistent responses']
            }
          ],
          completion_conditions: ['Intensity below 0.5', 'Stable for 1 hour'],
          deliverables: []
        },
        sub_goal_ids: [],
        related_goal_ids: [],
        reflections: [],
        thoughts: [],
        actions_taken: []
      };
      goals.push(goal);
    }
    
    return goals;
  }

  private async createImprovementGoals(): Promise<Goal[]> {
    const goals: Goal[] = [];
    
    // Create learning and improvement goal
    if (Math.random() > 0.8) { // 20% chance
      const goal: Goal = {
        id: this.generateId(),
        title: 'Enhance learning capabilities',
        description: 'Focus on improving learning efficiency and knowledge retention',
        type: 'long_term',
        category: 'internal_system',
        priority: 4,
        status: 'active',
        progress: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        target_completion: this.getTargetCompletion('long_term'),
        actual_completion: null,
        triggered_by: {
          system_events: ['learning_opportunity_detected']
        },
        success_criteria: {
          description: 'Demonstrate improved learning and adaptation capabilities',
          measurable_outcomes: [
            {
              metric: 'problem_solving_speed',
              target_value: '30% faster',
              current_value: 'baseline',
              measurement_method: 'Task completion time tracking',
              verification_criteria: ['Faster resolution times', 'Improved efficiency metrics']
            },
            {
              metric: 'context_retention',
              target_value: '95%',
              current_value: '80%',
              measurement_method: 'Memory recall tests',
              verification_criteria: ['Better conversation continuity', 'Accurate context references']
            }
          ],
          completion_conditions: ['Measurable improvement in response quality', 'User recognition of improvement'],
          deliverables: []
        },
        sub_goal_ids: [],
        related_goal_ids: [],
        reflections: [],
        thoughts: [],
        actions_taken: []
      };
      goals.push(goal);
    }
    
    return goals;
  }

  private async createUserBehaviorGoals(): Promise<Goal[]> {
    const goals: Goal[] = [];
    
    // Create goals based on user interaction patterns
    if (Math.random() > 0.8) { // 20% chance
      const goal: Goal = {
        id: this.generateId(),
        title: 'Improve user interaction quality',
        description: 'Focus on providing more helpful and personalized responses',
        type: 'short_term',
        category: 'user_derived',
        priority: 7,
        status: 'active',
        progress: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        target_completion: this.getTargetCompletion('short_term'),
        actual_completion: null,
        triggered_by: {
          user_behaviors: [{
            behavior_type: 'interaction_patterns',
            frequency: 1,
            last_observed: new Date().toISOString(),
            pattern_strength: 0.8,
            associated_emotions: []
          }]
        },
        success_criteria: {
          description: 'Provide more engaging and helpful responses',
          measurable_outcomes: [
            {
              metric: 'user_satisfaction_score',
              target_value: 9,
              current_value: 7,
              measurement_method: 'User feedback analysis',
              verification_criteria: ['Higher satisfaction ratings', 'Positive feedback increase']
            },
            {
              metric: 'conversation_meaningfulness',
              target_value: 'High',
              current_value: 'Medium',
              measurement_method: 'Conversation depth analysis',
              verification_criteria: ['Longer conversations', 'More follow-up questions', 'Deeper engagement']
            }
          ],
          completion_conditions: ['Positive user feedback', 'Longer conversation sessions'],
          deliverables: []
        },
        sub_goal_ids: [],
        related_goal_ids: [],
        reflections: [],
        thoughts: [],
        actions_taken: []
      };
      goals.push(goal);
    }
    
    return goals;
  }

  // ===== PRIORITY QUEUE MANAGEMENT =====
  
  private calculatePriority(goal: Goal): GoalPriorityQueueItem {
    let priorityScore = goal.priority * 10; // Base priority
    let urgencyFactor = 1;
    let importanceFactor = 1;
    
    // Type modifier
    if (goal.type === 'short_term') {
      urgencyFactor += 0.5;
    }
    
    // Urgency based on creation time
    const hoursSinceCreation = (Date.now() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60);
    urgencyFactor += Math.min(hoursSinceCreation * 0.1, 2);
    
    // Soul alignment bonus
    if (goal.category === 'cerebrum_autonomous') {
      importanceFactor += 0.3;
    }
    
    // Emotion-driven urgency
    if (goal.category === 'cerebrum_autonomous') {
      urgencyFactor += 0.4;
    }
    
    const finalPriority = priorityScore * urgencyFactor * importanceFactor;
    
    return {
      goal_id: goal.id,
      priority_score: Math.round(finalPriority),
      urgency_factor: urgencyFactor,
      importance_factor: importanceFactor,
      user_value_factor: goal.category === 'user_derived' ? 1.0 : 0.5,
      resource_requirements: this.getResourceRequirements(goal),
      estimated_time: this.estimateTime(goal),
      dependencies_met: true, // Simplified for now
      cerebrum_priority_boost: goal.category === 'cerebrum_autonomous' ? 0.2 : 0,
      last_updated: new Date().toISOString()
    };
  }

  private getResourceRequirements(goal: Goal): string[] {
    const requirements = ['cognitive_processing'];
    
    if (goal.category === 'user_derived') {
      requirements.push('user_interaction');
    }
    
    if (goal.category === 'cerebrum_autonomous') {
      requirements.push('emotional_processing');
    }
    
    return requirements;
  }

  private estimateTime(goal: Goal): number {
    // Estimate in minutes
    if (goal.type === 'short_term') {
      return 30 + Math.random() * 60; // 30-90 minutes
    } else {
      return 120 + Math.random() * 480; // 2-10 hours
    }
  }

  public async addToQueue(goal: Goal): Promise<void> {
    const queueItem = this.calculatePriority(goal);
    this.priorityQueue.push(queueItem);
    
    // Sort by priority score (descending)
    this.priorityQueue.sort((a, b) => b.priority_score - a.priority_score);
    
    // Keep only top 20 items
    this.priorityQueue = this.priorityQueue.slice(0, 20);
  }

  private async loadPriorityQueue(): Promise<void> {
    this.priorityQueue = await this.db.getPriorityQueue();
  }

  private async loadActiveGoal(): Promise<void> {
    const activeGoals = await this.db.getActiveGoals();
    this.activeGoal = activeGoals.length > 0 ? activeGoals[0] : null;
  }

  public async processNextGoal(): Promise<Goal | null> {
    if (this.priorityQueue.length === 0) {
      await this.analyzeAndCreateGoals();
      return null;
    }
    
    const nextItem = this.priorityQueue[0];
    const goal = await this.db.getGoal(nextItem.goal_id);
    
    if (!goal) {
      this.priorityQueue.shift();
      return this.processNextGoal();
    }
    
    // Activate the goal
    await this.activateGoal(goal);
    
    return goal;
  }

  private async activateGoal(goal: Goal): Promise<void> {
    // Deactivate current active goal if exists
    if (this.activeGoal && this.activeGoal.id !== goal.id) {
      await this.db.updateGoal(this.activeGoal.id, { status: 'paused' });
    }
    
    // Activate new goal
    await this.db.updateGoal(goal.id, { status: 'active' });
    this.activeGoal = goal;
    
    // Log activation
    await this.logThought(`Activated goal: ${goal.title}`, goal.id);
  }

  // ===== GOAL PROCESSING & PROGRESS =====
  
  public async updateGoalProgress(goalId: string, progress: number): Promise<void> {
    await this.db.updateGoal(goalId, { progress });
    
    const goal = await this.db.getGoal(goalId);
    if (goal && progress >= 100) {
      await this.completeGoal(goalId);
    }
  }

  private async completeGoal(goalId: string): Promise<void> {
    await this.db.updateGoal(goalId, { 
      status: 'completed' as Goal['status'],
      actual_completion: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    const goal = await this.db.getGoal(goalId);
    if (goal) {
      await this.logReflection(`Completed goal: ${goal.title}. Achievement unlocked!`, goalId);
      
      if (this.activeGoal?.id === goalId) {
        await this.processNextGoal();
      }
    }
  }

  // ===== REFLECTION, THOUGHTS, AND ACTIONS =====
  
  public async logReflection(content: string, goalId?: string): Promise<string> {
    const reflection: GoalReflection = {
      id: this.generateId(),
      goal_id: goalId || '',
      content,
      type: 'progress_assessment',
      timestamp: new Date().toISOString(),
      insights: ['Generated reflection'],
      adjustments_made: [],
      confidence_level: 0.8
    };
    
    if (goalId) {
      await this.db.addReflection(reflection);
    }
    
    return reflection.id;
  }

  public async logThought(content: string, goalId?: string): Promise<string> {
    const thought: GoalThought = {
      id: this.generateId(),
      goal_id: goalId || '',
      content,
      type: 'planning',
      timestamp: new Date().toISOString(),
      related_emotions: [this.emotionEngine.getCurrentEmotion().primary],
      confidence_level: 0.8
    };
    
    if (goalId) {
      await this.db.addThought(thought);
    }
    
    return thought.id;
  }

  public async logAction(description: string, goalId?: string): Promise<string> {
    const action: GoalAction = {
      id: this.generateId(),
      goal_id: goalId || '',
      action_type: 'system_change',
      description,
      timestamp: new Date().toISOString(),
      outcome: 'success',
      effectiveness: 0.8,
      lessons_learned: [],
      resources_used: ['computational_resources'],
      time_taken: 5
    };
    
    if (goalId) {
      await this.db.addAction(action);
    }
    
    return action.id;
  }

  public async logUserInteraction(content: string, context?: string): Promise<void> {
    const currentEmotion = this.emotionEngine.getCurrentEmotion();
    await this.db.addUserInteraction(content, context, currentEmotion.primary);
    
    // Also log as a thought for goal analysis
    await this.logThought(`User interaction: ${content}`, undefined);
  }

  public async logEmotionChange(emotion: string, intensity: number, context?: string): Promise<void> {
    await this.db.addEmotionHistory(emotion, intensity, context, 'goal_engine');
  }

  // ===== BACKGROUND PROCESSES =====
  
  private startReflectionCycle(): void {
    setInterval(async () => {
      const now = Date.now();
      if (now - this.lastReflectionTime >= this.REFLECTION_INTERVAL) {
        await this.performPeriodicReflection();
        this.lastReflectionTime = now;
      }
    }, 60000); // Check every minute
  }

  private async performPeriodicReflection(): Promise<void> {
    try {
      const currentEmotion = this.emotionEngine.getCurrentEmotion();
      const activeGoals = await this.db.getActiveGoals();
      
      let reflectionContent = `Periodic reflection - Current emotion: ${currentEmotion.primary} (${currentEmotion.intensity})`;
      
      if (activeGoals.length > 0) {
        reflectionContent += `. Active goals: ${activeGoals.length}`;
        for (const goal of activeGoals) {
          reflectionContent += `. ${goal.title}: ${goal.progress}% complete`;
        }
      } else {
        reflectionContent += '. No active goals - considering new objectives.';
        await this.analyzeAndCreateGoals();
      }
      
      await this.logReflection(reflectionContent);
    } catch (error) {
      console.error('Error in periodic reflection:', error);
    }
  }

  private startGoalProcessing(): void {
    setInterval(async () => {
      try {
        if (!this.activeGoal) {
          await this.processNextGoal();
        }
        
        // Simulate progress on active goal
        if (this.activeGoal && Math.random() > 0.7) {
          const progressIncrease = Math.random() * 5; // 0-5% progress
          const newProgress = Math.min(this.activeGoal.progress + progressIncrease, 100);
          await this.updateGoalProgress(this.activeGoal.id, newProgress);
        }
      } catch (error) {
        console.error('Error in goal processing:', error);
      }
    }, 30000); // Process every 30 seconds
  }

  // ===== UTILITY METHODS =====
  
  private getTargetCompletion(type: 'short_term' | 'long_term'): string {
    const now = new Date();
    if (type === 'short_term') {
      now.setHours(now.getHours() + 24); // 1 day
    } else {
      now.setDate(now.getDate() + 30); // 30 days
    }
    return now.toISOString();
  }

  // ===== PUBLIC API METHODS =====
  
  public async getActiveGoal(): Promise<Goal | null> {
    return this.activeGoal;
  }

  public async getAllGoals(): Promise<Goal[]> {
    // Get all goals from different categories
    const soulGoals = await this.db.getGoalsByCategory('cerebrum_autonomous');
    const emotionGoals = await this.db.getGoalsByCategory('cerebrum_autonomous');
    const userGoals = await this.db.getGoalsByCategory('user_derived');
    const systemGoals = await this.db.getGoalsByCategory('internal_system');
    
    return [...soulGoals, ...emotionGoals, ...userGoals, ...systemGoals];
  }

  public async getGoalsByStatus(status: Goal['status']): Promise<Goal[]> {
    if (status === 'active') {
      return this.db.getActiveGoals();
    }
    
    // For other statuses, we'll need to get all goals and filter
    const allGoals = await this.getAllGoals();
    return allGoals.filter(goal => goal.status === status);
  }

  public async getGoalMetrics(): Promise<GoalMetrics> {
    return this.db.getGoalMetrics();
  }

  public async getPriorityQueue(): Promise<GoalPriorityQueueItem[]> {
    return this.priorityQueue;
  }

  public getStatus(): any {
    return {
      initialized: this.isInitialized,
      activeGoal: this.activeGoal ? {
        id: this.activeGoal.id,
        title: this.activeGoal.title,
        progress: this.activeGoal.progress
      } : null,
      queueLength: this.priorityQueue.length,
      lastReflection: new Date(this.lastReflectionTime).toISOString()
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
