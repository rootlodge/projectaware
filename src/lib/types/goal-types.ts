export interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'short_term' | 'long_term' | 'micro_task' | 'project_based' | 'learning_objective' | 'system_optimization' | 'user_support';
  /**
   * Category of the goal. Must match database constraint and allowed values.
   * Allowed: 'soul_driven', 'emotion_driven', 'user_driven', 'system_driven'
   */
  category: 'soul_driven' | 'emotion_driven' | 'user_driven' | 'system_driven';
  tier: GoalTier;
  origin: GoalOrigin;
  priority: number; // 1-10, 10 being highest
  status: 'active' | 'completed' | 'paused' | 'failed' | 'cancelled' | 'in_progress' | 'analysis' | 'waiting_approval' | 'delegated';
  progress: number; // 0-100 percentage
  created_at: string;
  updated_at: string;
  target_completion: string | null;
  actual_completion: string | null;
  
  // Enhanced goal triggers and context
  triggered_by: {
    conversation_patterns?: ConversationPattern[];
    user_behaviors?: UserBehaviorPattern[];
    emotional_states?: string[];
    system_events?: string[];
    cerebrum_analysis?: CerebrumAnalysis;
    pattern_detection?: PatternDetectionResult;
  };
  
  // Detailed success criteria with measurable outcomes
  success_criteria: {
    description: string;
    measurable_outcomes: MeasurableOutcome[];
    completion_conditions: string[];
    deliverables: GoalDeliverable[];
    validation_agents?: string[]; // Which agents will validate completion
  };
  
  // Enhanced dependencies and relationships
  parent_goal_id?: string;
  sub_goal_ids: string[];
  related_goal_ids: string[];
  blocking_dependencies: string[];
  prerequisite_skills?: string[];
  
  // Autonomous AI tracking
  cerebrum_metadata?: CerebrumGoalMetadata;
  execution_strategy?: GoalExecutionStrategy;
  
  // Reflection and evolution
  reflections: GoalReflection[];
  thoughts: GoalThought[];
  actions_taken: GoalAction[];
  agent_interactions: AgentInteraction[];
  
  // Self-awareness and learning
  learning_objectives?: LearningObjective[];
  knowledge_gaps?: string[];
  skill_requirements?: SkillRequirement[];
}

export interface GoalTier {
  level: 'user_derived' | 'internal_system' | 'cerebrum_autonomous';
  description: string;
  characteristics: {
    autonomous_execution: boolean;
    requires_user_approval: boolean;
    can_create_subgoals: boolean;
    can_delegate_to_agents: boolean;
    proactive_updates: boolean;
    completion_presentation: boolean;
  };
  authority_level: number; // 1-10, how much autonomy this goal has
}

export interface PatternDetectionResult {
  pattern_type: 'conversation_topic' | 'user_interest' | 'skill_gap' | 'workflow_optimization' | 'problem_recurring';
  confidence: number;
  evidence_strength: number;
  detection_method: string;
  supporting_data: Record<string, any>;
  recommendation_urgency: number; // 1-10
}

export interface GoalExecutionStrategy {
  approach: 'sequential' | 'parallel' | 'hybrid' | 'adaptive';
  agent_assignments: AgentAssignment[];
  milestone_checkpoints: Milestone[];
  risk_mitigation: RiskMitigation[];
  user_interaction_points: UserInteractionPoint[];
  autonomous_decision_boundaries: string[];
}

export interface LearningObjective {
  skill: string;
  current_level: number; // 0-10
  target_level: number; // 0-10
  learning_method: string;
  resources_needed: string[];
  validation_criteria: string[];
}

export interface SkillRequirement {
  skill_name: string;
  required_level: number; // 0-10
  current_level: number; // 0-10
  gap_analysis: string;
  acquisition_plan?: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  target_date: string;
  completion_criteria: string[];
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  progress: number; // 0-100
}

export interface RiskMitigation {
  risk_id: string;
  risk_description: string;
  probability: number; // 0-1
  impact: number; // 0-10
  mitigation_strategy: string;
  contingency_plan: string;
  monitoring_indicators: string[];
}

export interface UserInteractionPoint {
  interaction_type: 'approval_required' | 'feedback_requested' | 'progress_update' | 'completion_presentation' | 'clarification_needed';
  trigger_condition: string;
  message_template: string;
  urgency: number; // 1-10
  auto_escalate_after: number; // minutes
  context_data?: Record<string, any>;
}

export interface GoalOrigin {
  source: 'user_explicit' | 'user_implicit' | 'cerebrum_analysis' | 'system_generated' | 'agent_derived';
  confidence: number; // 0-1, how confident we are about this goal
  evidence: string[]; // What led to this goal being created
  conversation_ids?: string[]; // If derived from conversations
  timestamp: string;
  creator_agent?: string; // Which agent/system created this goal
}

export interface ConversationPattern {
  topic: string;
  frequency: number;
  recent_mentions: number;
  keywords: string[];
  context_similarity: number;
  conversation_ids: string[];
  pattern_confidence: number;
}

export interface UserBehaviorPattern {
  behavior_type: string;
  frequency: number;
  last_observed: string;
  pattern_strength: number;
  associated_emotions: string[];
}

export interface CerebrumAnalysis {
  analysis_type: 'pattern_recognition' | 'need_identification' | 'opportunity_detection' | 'problem_solving';
  confidence: number;
  reasoning: string[];
  supporting_evidence: string[];
  risk_assessment: number; // 0-1
  potential_value: number; // 0-1
}

export interface MeasurableOutcome {
  metric: string;
  target_value: string | number;
  current_value: string | number;
  measurement_method: string;
  verification_criteria: string[];
}

export interface GoalDeliverable {
  name: string;
  type: 'file' | 'document' | 'code' | 'analysis' | 'presentation' | 'data' | 'other';
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'reviewed';
  file_path?: string;
  content?: string;
  metadata?: Record<string, any>;
  created_by_agent?: string;
  reviewed_by_agents?: string[];
}

export interface CerebrumGoalMetadata {
  auto_created: boolean;
  analysis_depth: number; // 1-5, how deep the analysis was
  agent_assignments: AgentAssignment[];
  progress_checkpoints: ProgressCheckpoint[];
  user_notification_sent: boolean;
  user_approval_required: boolean;
  user_response?: UserResponse;
  internal_notes: string[];
  resource_allocation: ResourceAllocation;
}

export interface AgentAssignment {
  agent_name: string;
  task_description: string;
  assigned_at: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  progress: number;
  deliverables_assigned: string[];
  estimated_completion: string;
}

export interface ProgressCheckpoint {
  id: string;
  description: string;
  target_date: string;
  status: 'pending' | 'met' | 'missed' | 'adjusted';
  completion_evidence: string[];
  agent_reports: AgentReport[];
}

export interface AgentReport {
  agent_name: string;
  report_type: 'progress' | 'completion' | 'issue' | 'recommendation';
  content: string;
  timestamp: string;
  confidence: number;
  recommendations: string[];
}

export interface UserResponse {
  response_type: 'approved' | 'rejected' | 'modified' | 'defer';
  message: string;
  timestamp: string;
  modifications_requested?: string[];
}

export interface ResourceAllocation {
  computational_priority: number; // 1-5
  agent_time_allocated: number; // minutes
  estimated_cost: number;
  resource_constraints: string[];
}

export interface AgentInteraction {
  id: string;
  goal_id: string;
  agent_name: string;
  interaction_type: 'task_assignment' | 'progress_report' | 'completion_notification' | 'issue_escalation';
  content: string;
  timestamp: string;
  metadata: Record<string, any>;
  follow_up_required: boolean;
}

export interface GoalReflection {
  id: string;
  goal_id: string;
  content: string;
  type: 'progress_assessment' | 'strategy_adjustment' | 'value_alignment' | 'emotional_impact' | 'cerebrum_analysis';
  timestamp: string;
  insights: string[];
  adjustments_made: string[];
  confidence_level: number;
  agent_contributor?: string;
}

export interface GoalThought {
  id: string;
  goal_id: string;
  content: string;
  type: 'planning' | 'problem_solving' | 'creative_exploration' | 'ethical_consideration' | 'opportunity_identification';
  timestamp: string;
  related_emotions: string[];
  confidence_level: number; // 0-1
  thought_chain_id?: string; // Link related thoughts
  inspiration_source?: string;
}

export interface GoalAction {
  id: string;
  goal_id: string;
  action_type: 'learning' | 'communication' | 'adaptation' | 'system_change' | 'user_interaction' | 'agent_coordination' | 'research' | 'creation';
  description: string;
  timestamp: string;
  outcome: string;
  effectiveness: number; // 0-1
  lessons_learned: string[];
  resources_used: string[];
  time_taken: number; // minutes
  performed_by_agent?: string;
}

export interface GoalPriorityQueueItem {
  goal_id: string;
  priority_score: number;
  urgency_factor: number;
  importance_factor: number;
  user_value_factor: number;
  resource_requirements: string[];
  estimated_time: number; // minutes
  dependencies_met: boolean;
  cerebrum_priority_boost: number;
  last_updated: string;
}

export interface GoalMetrics {
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  completion_rate: number;
  average_completion_time: number;
  goals_by_category: Record<string, number>;
  goals_by_type: Record<string, number>;
  goals_by_priority: Record<string, number>;
  recent_completions: Goal[];
  overdue_goals: Goal[];
  cerebrum_goals_stats: CerebrumGoalsStats;
  user_satisfaction_scores: UserSatisfactionMetrics;
}

export interface CerebrumGoalsStats {
  total_autonomous_goals: number;
  successful_autonomous_goals: number;
  user_approved_rate: number;
  average_detection_accuracy: number;
  pattern_recognition_success: number;
  agent_utilization_efficiency: number;
  resource_optimization_score: number;
}

export interface UserSatisfactionMetrics {
  average_goal_satisfaction: number;
  goal_relevance_score: number;
  autonomous_goal_acceptance_rate: number;
  user_engagement_level: number;
  feedback_sentiment_score: number;
}
