import { MemorySystem } from '../core/memory';
import { EmotionEngine } from './EmotionEngine';
import { MultiAgentManager } from '../agents/MultiAgentManager';
import { 
  Goal, 
  ConversationPattern, 
  CerebrumAnalysis, 
  GoalOrigin,
  CerebrumGoalMetadata,
  AgentAssignment,
  GoalDeliverable
} from '../types/goal-types';

export class CerebrumGoalAnalyzer {
  private memorySystem: MemorySystem;
  private emotionEngine: EmotionEngine;
  private agentManager: MultiAgentManager;
  private analysisQueue: Promise<any> = Promise.resolve();
  private lastAnalysisTime: number = 0;
  private readonly ANALYSIS_INTERVAL = 30000; // 30 seconds
  private readonly PATTERN_CONFIDENCE_THRESHOLD = 0.7;

  constructor(
    memorySystem: MemorySystem,
    emotionEngine: EmotionEngine,
    agentManager: MultiAgentManager
  ) {
    this.memorySystem = memorySystem;
    this.emotionEngine = emotionEngine;
    this.agentManager = agentManager;
    
    this.startContinuousAnalysis();
  }

  /**
   * Start continuous analysis of conversations for goal opportunities
   */
  private startContinuousAnalysis(): void {
    setInterval(() => {
      this.performAnalysisCycle().catch(error => {
        console.error('[CerebrumGoalAnalyzer] Analysis cycle failed:', error);
      });
    }, this.ANALYSIS_INTERVAL);
  }

  /**
   * Perform a single analysis cycle
   */
  private async performAnalysisCycle(): Promise<void> {
    const timeSinceLastAnalysis = Date.now() - this.lastAnalysisTime;
    if (timeSinceLastAnalysis < this.ANALYSIS_INTERVAL) {
      return;
    }

    this.lastAnalysisTime = Date.now();

    try {
      await this.analysisQueue;
      this.analysisQueue = this.queueAnalysis(async () => {
        const patterns = await this.analyzeConversationPatterns();
        const potentialGoals = await this.identifyPotentialGoals(patterns);
        
        for (const goal of potentialGoals) {
          await this.createCerebrumGoal(goal);
        }
      });
    } catch (error) {
      console.error('[CerebrumGoalAnalyzer] Analysis cycle error:', error);
    }
  }

  /**
   * Analyze recent conversations for patterns that suggest goals
   */
  private async analyzeConversationPatterns(): Promise<ConversationPattern[]> {
    try {
      // Get recent conversations (last 7 days)
      const recentConversations = await this.memorySystem.getConversationHistory(500);
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const relevantConversations = recentConversations.filter(conv => conv.timestamp > cutoffDate);

      // Extract topics and keywords
      const topicAnalysis = this.extractTopics(relevantConversations);
      const patterns: ConversationPattern[] = [];

      for (const [topic, data] of Object.entries(topicAnalysis)) {
        if (data.frequency >= 3 && data.confidence > this.PATTERN_CONFIDENCE_THRESHOLD) {
          patterns.push({
            topic,
            frequency: data.frequency,
            recent_mentions: data.recent_mentions,
            keywords: data.keywords,
            context_similarity: data.context_similarity,
            conversation_ids: data.conversation_ids,
            pattern_confidence: data.confidence
          });
        }
      }

      return patterns.sort((a, b) => b.pattern_confidence - a.pattern_confidence);
    } catch (error) {
      console.error('[CerebrumGoalAnalyzer] Failed to analyze conversation patterns:', error);
      return [];
    }
  }

  /**
   * Extract topics and analyze their frequency and context
   */
  private extractTopics(conversations: any[]): Record<string, any> {
    const topicData: Record<string, any> = {};
    
    // Define key topic indicators for different types of goals
    const topicIndicators = {
      'JavaScript Neural Network': {
        keywords: ['neural network', 'javascript', 'ml', 'machine learning', 'ai model', 'deep learning'],
        context_markers: ['build', 'create', 'implement', 'develop', 'package', 'library']
      },
      'Business Plan Development': {
        keywords: ['business plan', 'startup', 'company', 'revenue', 'market', 'business model'],
        context_markers: ['create', 'develop', 'write', 'plan', 'strategy', 'launch']
      },
      'Code Review Process': {
        keywords: ['code review', 'code quality', 'testing', 'best practices', 'refactor'],
        context_markers: ['improve', 'review', 'analyze', 'optimize', 'clean up']
      },
      'Learning Project': {
        keywords: ['learn', 'tutorial', 'course', 'study', 'understand', 'explore'],
        context_markers: ['want to learn', 'how to', 'teach me', 'explain', 'understand']
      },
      'Documentation Creation': {
        keywords: ['documentation', 'docs', 'readme', 'guide', 'manual', 'instructions'],
        context_markers: ['write', 'create', 'document', 'explain', 'guide']
      }
    };

    for (const [topic, indicators] of Object.entries(topicIndicators)) {
      let frequency = 0;
      let recent_mentions = 0;
      const conversation_ids: string[] = [];
      const context_scores: number[] = [];

      for (const conv of conversations) {
        const text = `${conv.user_message} ${conv.ai_response}`.toLowerCase();
        
        // Check for keyword matches
        const keywordMatches = indicators.keywords.filter(keyword => 
          text.includes(keyword.toLowerCase())
        ).length;

        // Check for context markers
        const contextMatches = indicators.context_markers.filter(marker =>
          text.includes(marker.toLowerCase())
        ).length;

        if (keywordMatches > 0 && contextMatches > 0) {
          frequency++;
          conversation_ids.push(conv.session_id);
          
          // Count as recent if within last 3 days
          const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
          if (new Date(conv.timestamp) > threeDaysAgo) {
            recent_mentions++;
          }

          // Calculate context similarity score
          const similarity = (keywordMatches + contextMatches) / (indicators.keywords.length + indicators.context_markers.length);
          context_scores.push(similarity);
        }
      }

      if (frequency > 0) {
        const avgContextSimilarity = context_scores.reduce((a, b) => a + b, 0) / context_scores.length;
        const confidence = Math.min(1, (frequency / 10) * (recent_mentions / Math.max(1, frequency)) * avgContextSimilarity);

        topicData[topic] = {
          frequency,
          recent_mentions,
          keywords: indicators.keywords,
          context_similarity: avgContextSimilarity,
          conversation_ids: [...new Set(conversation_ids)],
          confidence
        };
      }
    }

    return topicData;
  }

  /**
   * Identify potential goals based on conversation patterns
   */
  private async identifyPotentialGoals(patterns: ConversationPattern[]): Promise<Partial<Goal>[]> {
    const potentialGoals: Partial<Goal>[] = [];

    for (const pattern of patterns) {
      if (pattern.pattern_confidence < this.PATTERN_CONFIDENCE_THRESHOLD) {
        continue;
      }

      const cerebrumAnalysis: CerebrumAnalysis = {
        analysis_type: 'pattern_recognition',
        confidence: pattern.pattern_confidence,
        reasoning: [
          `Detected recurring interest in ${pattern.topic}`,
          `Pattern appeared ${pattern.frequency} times in recent conversations`,
          `${pattern.recent_mentions} recent mentions indicate active interest`,
          `Context similarity score of ${(pattern.context_similarity * 100).toFixed(1)}%`
        ],
        supporting_evidence: pattern.conversation_ids,
        risk_assessment: this.assessRiskLevel(pattern),
        potential_value: this.assessPotentialValue(pattern)
      };

      const goal = await this.createGoalFromPattern(pattern, cerebrumAnalysis);
      if (goal) {
        potentialGoals.push(goal);
      }
    }

    return potentialGoals;
  }

  /**
   * Create a goal based on a detected pattern
   */
  private async createGoalFromPattern(pattern: ConversationPattern, analysis: CerebrumAnalysis): Promise<Partial<Goal> | null> {
    const goalTemplates = this.getGoalTemplates();
    const template = goalTemplates[pattern.topic];
    
    if (!template) {
      console.log(`[CerebrumGoalAnalyzer] No template found for topic: ${pattern.topic}`);
      return null;
    }

    const goalId = `cerebrum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const goal: Partial<Goal> = {
      id: goalId,
      title: template.title,
      description: template.description,
      type: template.type,
      category: 'cerebrum_autonomous',
      priority: this.calculatePriority(pattern, analysis),
      status: 'analysis',
      progress: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      target_completion: this.calculateTargetCompletion(template.estimated_duration),
      
      origin: {
        source: 'cerebrum_analysis',
        confidence: pattern.pattern_confidence,
        evidence: [
          `Conversation pattern detected: ${pattern.topic}`,
          `Frequency: ${pattern.frequency} occurrences`,
          `Recent activity: ${pattern.recent_mentions} mentions`,
          `Keywords: ${pattern.keywords.join(', ')}`
        ],
        conversation_ids: pattern.conversation_ids,
        timestamp: new Date().toISOString(),
        creator_agent: 'CerebrumGoalAnalyzer'
      },

      triggered_by: {
        conversation_patterns: [pattern],
        cerebrum_analysis: analysis
      },

      success_criteria: {
        description: template.success_description,
        measurable_outcomes: template.measurable_outcomes,
        completion_conditions: template.completion_conditions,
        deliverables: template.deliverables
      },

      sub_goal_ids: [],
      related_goal_ids: [],
      blocking_dependencies: [],

      cerebrum_metadata: {
        auto_created: true,
        analysis_depth: 4,
        agent_assignments: await this.generateAgentAssignments(template),
        progress_checkpoints: template.checkpoints,
        user_notification_sent: false,
        user_approval_required: template.requires_user_approval,
        internal_notes: [
          `Auto-generated based on ${pattern.topic} pattern`,
          `Analysis confidence: ${(analysis.confidence * 100).toFixed(1)}%`,
          `Risk level: ${(analysis.risk_assessment * 100).toFixed(1)}%`,
          `Potential value: ${(analysis.potential_value * 100).toFixed(1)}%`
        ],
        resource_allocation: {
          computational_priority: this.calculateComputationalPriority(analysis),
          agent_time_allocated: template.estimated_duration * 60, // hours to minutes
          estimated_cost: template.estimated_cost || 0,
          resource_constraints: template.resource_constraints || []
        }
      },

      reflections: [],
      thoughts: [],
      actions_taken: [],
      agent_interactions: []
    };

    return goal;
  }

  /**
   * Get goal templates for different types of detected patterns
   */
  private getGoalTemplates(): Record<string, any> {
    return {
      'JavaScript Neural Network': {
        title: 'Create JavaScript Neural Network Package',
        description: 'Develop a comprehensive neural network library in JavaScript based on user interest patterns',
        type: 'project_based',
        success_description: 'Complete neural network package with documentation and examples',
        estimated_duration: 20, // hours
        estimated_cost: 0,
        requires_user_approval: true,
        measurable_outcomes: [
          { metric: 'Code Coverage', target_value: '90%', current_value: '0%', measurement_method: 'Jest tests', verification_criteria: ['All functions tested', 'Integration tests pass'] },
          { metric: 'Documentation Completeness', target_value: '100%', current_value: '0%', measurement_method: 'Doc coverage tool', verification_criteria: ['All APIs documented', 'Examples provided'] },
          { metric: 'Performance Benchmarks', target_value: 'Baseline established', current_value: 'None', measurement_method: 'Benchmark suite', verification_criteria: ['Speed tests', 'Memory usage tests'] }
        ],
        completion_conditions: [
          'Core neural network functionality implemented',
          'Training algorithms functional',
          'Comprehensive test suite passes',
          'Documentation complete',
          'Example applications created'
        ],
        deliverables: [
          { name: 'Core Library Files', type: 'code', description: 'Main neural network implementation', status: 'not_started' },
          { name: 'API Documentation', type: 'document', description: 'Complete API reference', status: 'not_started' },
          { name: 'Example Applications', type: 'code', description: 'Demo projects using the library', status: 'not_started' },
          { name: 'Test Suite', type: 'code', description: 'Comprehensive testing framework', status: 'not_started' },
          { name: 'Performance Benchmarks', type: 'data', description: 'Speed and accuracy metrics', status: 'not_started' }
        ],
        checkpoints: [
          { id: 'cp1', description: 'Basic neural network structure', target_date: this.addDays(3), status: 'pending', completion_evidence: [], agent_reports: [] },
          { id: 'cp2', description: 'Training algorithms implemented', target_date: this.addDays(7), status: 'pending', completion_evidence: [], agent_reports: [] },
          { id: 'cp3', description: 'Testing framework complete', target_date: this.addDays(12), status: 'pending', completion_evidence: [], agent_reports: [] },
          { id: 'cp4', description: 'Documentation finalized', target_date: this.addDays(18), status: 'pending', completion_evidence: [], agent_reports: [] }
        ],
        agent_roles: ['CodeReviewer', 'DocumentationWriter', 'TestingSpecialist', 'PerformanceAnalyzer']
      },
      'Business Plan Development': {
        title: 'Comprehensive Business Plan Creation',
        description: 'Develop a detailed business plan based on user discussions and interests',
        type: 'project_based',
        success_description: 'Complete business plan with market analysis, financial projections, and strategy',
        estimated_duration: 15,
        estimated_cost: 0,
        requires_user_approval: true,
        measurable_outcomes: [
          { metric: 'Plan Completeness', target_value: '100%', current_value: '0%', measurement_method: 'Section checklist', verification_criteria: ['All sections complete', 'Financial models validated'] },
          { metric: 'Market Research Depth', target_value: '5 competitors analyzed', current_value: '0', measurement_method: 'Research count', verification_criteria: ['Competitive analysis', 'Market size estimation'] }
        ],
        completion_conditions: [
          'Executive summary written',
          'Market analysis completed',
          'Financial projections created',
          'Marketing strategy defined',
          'Operational plan outlined'
        ],
        deliverables: [
          { name: 'Executive Summary', type: 'document', description: 'High-level business overview', status: 'not_started' },
          { name: 'Market Analysis', type: 'document', description: 'Industry and competitor research', status: 'not_started' },
          { name: 'Financial Projections', type: 'document', description: 'Revenue and cost models', status: 'not_started' },
          { name: 'Marketing Strategy', type: 'document', description: 'Customer acquisition plan', status: 'not_started' }
        ],
        checkpoints: [
          { id: 'bp1', description: 'Market research completed', target_date: this.addDays(5), status: 'pending', completion_evidence: [], agent_reports: [] },
          { id: 'bp2', description: 'Financial models created', target_date: this.addDays(10), status: 'pending', completion_evidence: [], agent_reports: [] },
          { id: 'bp3', description: 'Strategy sections finalized', target_date: this.addDays(14), status: 'pending', completion_evidence: [], agent_reports: [] }
        ],
        agent_roles: ['MarketAnalyst', 'FinancialAnalyzer', 'BusinessStrategist', 'DocumentationWriter']
      },
      'Code Review Process': {
        title: 'Implement Comprehensive Code Review System',
        description: 'Establish code review processes and tools based on quality discussions',
        type: 'learning_objective',
        success_description: 'Functional code review system with automated checks and guidelines',
        estimated_duration: 8,
        estimated_cost: 0,
        requires_user_approval: false,
        measurable_outcomes: [
          { metric: 'Review Coverage', target_value: '100%', current_value: '0%', measurement_method: 'Review tracking', verification_criteria: ['All code reviewed', 'Issues documented'] }
        ],
        completion_conditions: [
          'Review guidelines established',
          'Automated tools configured',
          'Review process documented'
        ],
        deliverables: [
          { name: 'Review Guidelines', type: 'document', description: 'Code review standards and process', status: 'not_started' },
          { name: 'Automation Scripts', type: 'code', description: 'Automated review tools', status: 'not_started' }
        ],
        checkpoints: [
          { id: 'cr1', description: 'Guidelines drafted', target_date: this.addDays(3), status: 'pending', completion_evidence: [], agent_reports: [] },
          { id: 'cr2', description: 'Tools implemented', target_date: this.addDays(6), status: 'pending', completion_evidence: [], agent_reports: [] }
        ],
        agent_roles: ['CodeReviewer', 'QualityAnalyzer', 'DocumentationWriter']
      }
    };
  }

  /**
   * Generate agent assignments for a goal template
   */
  private async generateAgentAssignments(template: any): Promise<AgentAssignment[]> {
    const assignments: AgentAssignment[] = [];
    
    for (const agentRole of template.agent_roles || []) {
      assignments.push({
        agent_name: agentRole,
        task_description: `Handle ${agentRole} responsibilities for: ${template.title}`,
        assigned_at: new Date().toISOString(),
        status: 'pending',
        progress: 0,
        deliverables_assigned: template.deliverables
          .filter((d: any) => this.isAgentResponsibleFor(agentRole, d.type))
          .map((d: any) => d.name),
        estimated_completion: this.addDays(Math.ceil(template.estimated_duration / template.agent_roles.length))
      });
    }

    return assignments;
  }

  /**
   * Determine if an agent is responsible for a deliverable type
   */
  private isAgentResponsibleFor(agentRole: string, deliverableType: string): boolean {
    const responsibilities: Record<string, string[]> = {
      'CodeReviewer': ['code'],
      'DocumentationWriter': ['document'],
      'TestingSpecialist': ['code'],
      'PerformanceAnalyzer': ['data'],
      'MarketAnalyst': ['document', 'data'],
      'FinancialAnalyzer': ['document', 'data'],
      'BusinessStrategist': ['document'],
      'QualityAnalyzer': ['code', 'data']
    };

    return responsibilities[agentRole]?.includes(deliverableType) || false;
  }

  /**
   * Create and persist a CEREBRUM goal
   */
  private async createCerebrumGoal(goal: Partial<Goal>): Promise<void> {
    try {
      // Check if we already have a similar goal
      const existingSimilarGoal = await this.findSimilarExistingGoal(goal.title!, goal.description!);
      if (existingSimilarGoal) {
        console.log(`[CerebrumGoalAnalyzer] Similar goal already exists: ${existingSimilarGoal.title}`);
        return;
      }

      console.log(`[CerebrumGoalAnalyzer] Creating new CEREBRUM goal: ${goal.title}`);
      
      // Here you would save to the database
      // For now, we'll log the goal creation
      console.log(`[CerebrumGoalAnalyzer] CEREBRUM Goal Details:`, {
        title: goal.title,
        type: goal.type,
        priority: goal.priority,
        confidence: goal.origin?.confidence,
        agent_assignments: goal.cerebrum_metadata?.agent_assignments?.length,
        estimated_duration: goal.cerebrum_metadata?.resource_allocation.agent_time_allocated
      });

      // Trigger user notification if required
      if (goal.cerebrum_metadata?.user_approval_required) {
        await this.notifyUserOfNewGoal(goal as Goal);
      }

    } catch (error) {
      console.error('[CerebrumGoalAnalyzer] Failed to create CEREBRUM goal:', error);
    }
  }

  /**
   * Check if a similar goal already exists
   */
  private async findSimilarExistingGoal(title: string, description: string): Promise<Goal | null> {
    // This would query the database for similar goals
    // For now, we'll return null to allow goal creation
    return null;
  }

  /**
   * Notify user of new autonomous goal creation
   */
  private async notifyUserOfNewGoal(goal: Goal): Promise<void> {
    console.log(`[CerebrumGoalAnalyzer] Would notify user of new goal: ${goal.title}`);
    // This would integrate with the AutonomousThinkingSystem to create an interaction
    // asking the user about the detected goal
  }

  /**
   * Helper methods for calculations
   */
  private calculatePriority(pattern: ConversationPattern, analysis: CerebrumAnalysis): number {
    const base = Math.ceil(pattern.pattern_confidence * 10);
    const recentBoost = pattern.recent_mentions > 0 ? 2 : 0;
    const valueBoost = Math.ceil(analysis.potential_value * 3);
    return Math.min(10, base + recentBoost + valueBoost);
  }

  private assessRiskLevel(pattern: ConversationPattern): number {
    // Lower risk for well-established patterns
    return Math.max(0.1, 1 - pattern.pattern_confidence);
  }

  private assessPotentialValue(pattern: ConversationPattern): number {
    // Higher value for frequently mentioned, recent topics
    const frequencyFactor = Math.min(1, pattern.frequency / 10);
    const recencyFactor = Math.min(1, pattern.recent_mentions / pattern.frequency);
    return (frequencyFactor + recencyFactor) / 2;
  }

  private calculateTargetCompletion(estimatedHours: number): string {
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + Math.ceil(estimatedHours / 8)); // 8 hours per day
    return completionDate.toISOString();
  }

  private calculateComputationalPriority(analysis: CerebrumAnalysis): number {
    return Math.ceil(analysis.confidence * analysis.potential_value * 5);
  }

  private addDays(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  /**
   * Queue analysis operations to prevent race conditions
   */
  private queueAnalysis<T>(operation: () => Promise<T>): Promise<T> {
    this.analysisQueue = this.analysisQueue.then(() => operation()).catch(() => operation());
    return this.analysisQueue as Promise<T>;
  }
}
