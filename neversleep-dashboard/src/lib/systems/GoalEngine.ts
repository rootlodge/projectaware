import { GoalDatabase } from '@/lib/core/GoalDatabase';
import { SoulSystem } from './SoulSystem';
import { getEmotionEngine } from '@/lib/shared/instances';
import { EmotionEngine } from './EmotionEngine';
import { 
  Goal, 
  GoalReflection,
  GoalThought, 
  GoalAction,
  GoalPriorityQueueItem,
  GoalMetrics
} from '@/lib/types/goal-types';

export class GoalEngine {
  private static instance: GoalEngine | null = null;
  private db: GoalDatabase;
  private soulSystem: SoulSystem;
  private emotionEngine: EmotionEngine;
  private isInitialized: boolean = false;
  private priorityQueue: GoalPriorityQueueItem[] = [];
  private activeGoal: Goal | null = null;
  private lastReflectionTime: number = 0;
  private readonly REFLECTION_INTERVAL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.db = new GoalDatabase();
    this.soulSystem = new SoulSystem();
    this.emotionEngine = getEmotionEngine();
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
      await this.loadPriorityQueue();
      await this.loadActiveGoal();
      
      // Start background processes
      this.startReflectionCycle();
      this.startGoalProcessing();
      
      this.isInitialized = true;
      console.log('Goal Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Goal Engine:', error);
      throw error;
    }
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
          category: 'soul_driven',
          priority: 5,
          status: 'active',
          progress: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          target_completion: this.getTargetCompletion('long_term'),
          actual_completion: null,
          triggered_by: {
            soul_values: [key]
          },
          success_criteria: {
            description: `Successfully embody ${key} in daily interactions`,
            measurable_outcomes: [`Increased alignment with ${key}`, 'User satisfaction improvement'],
            completion_conditions: ['Consistent demonstration of value', 'Positive user feedback']
          },
          sub_goal_ids: [],
          related_goal_ids: [],
          reflections: [],
          thoughts: [],
          actions_taken: []
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
        category: 'emotion_driven',
        priority: 8,
        status: 'active',
        progress: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        target_completion: this.getTargetCompletion('short_term'),
        actual_completion: null,
        triggered_by: {
          emotions: [currentEmotion.primary]
        },
        success_criteria: {
          description: `Reduce ${currentEmotion.primary} intensity to manageable levels`,
          measurable_outcomes: ['Reduced emotional intensity', 'Improved stability'],
          completion_conditions: ['Intensity below 0.5', 'Stable for 1 hour']
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
        category: 'system_driven',
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
          measurable_outcomes: ['Faster problem solving', 'Better context retention'],
          completion_conditions: ['Measurable improvement in response quality', 'User recognition of improvement']
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
        category: 'user_driven',
        priority: 7,
        status: 'active',
        progress: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        target_completion: this.getTargetCompletion('short_term'),
        actual_completion: null,
        triggered_by: {
          user_behaviors: ['interaction_patterns']
        },
        success_criteria: {
          description: 'Provide more engaging and helpful responses',
          measurable_outcomes: ['Increased user satisfaction', 'More meaningful conversations'],
          completion_conditions: ['Positive user feedback', 'Longer conversation sessions']
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
    if (goal.category === 'soul_driven') {
      importanceFactor += 0.3;
    }
    
    // Emotion-driven urgency
    if (goal.category === 'emotion_driven') {
      urgencyFactor += 0.4;
    }
    
    const finalPriority = priorityScore * urgencyFactor * importanceFactor;
    
    return {
      goal_id: goal.id,
      priority_score: Math.round(finalPriority),
      urgency_factor: urgencyFactor,
      importance_factor: importanceFactor,
      resource_requirements: this.getResourceRequirements(goal),
      estimated_time: this.estimateTime(goal),
      dependencies_met: true // Simplified for now
    };
  }

  private getResourceRequirements(goal: Goal): string[] {
    const requirements = ['cognitive_processing'];
    
    if (goal.category === 'user_driven') {
      requirements.push('user_interaction');
    }
    
    if (goal.category === 'emotion_driven') {
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
      adjustments_made: []
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
      lessons_learned: []
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
    const soulGoals = await this.db.getGoalsByCategory('soul_driven');
    const emotionGoals = await this.db.getGoalsByCategory('emotion_driven');
    const userGoals = await this.db.getGoalsByCategory('user_driven');
    const systemGoals = await this.db.getGoalsByCategory('system_driven');
    
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
