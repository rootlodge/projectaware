export interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'short_term' | 'long_term';
  category: 'soul_driven' | 'emotion_driven' | 'user_driven' | 'system_driven';
  priority: number; // 1-10, 10 being highest
  status: 'active' | 'completed' | 'paused' | 'failed' | 'cancelled';
  progress: number; // 0-100 percentage
  created_at: string;
  updated_at: string;
  target_completion: string | null;
  actual_completion: string | null;
  
  // Goal triggers and context
  triggered_by: {
    soul_values?: string[];
    emotions?: string[];
    user_behaviors?: string[];
    system_events?: string[];
  };
  
  // Goal requirements and success criteria
  success_criteria: {
    description: string;
    measurable_outcomes: string[];
    completion_conditions: string[];
  };
  
  // Dependencies and relationships
  parent_goal_id?: string;
  sub_goal_ids: string[];
  related_goal_ids: string[];
  
  // Reflection and thoughts
  reflections: GoalReflection[];
  thoughts: GoalThought[];
  actions_taken: GoalAction[];
}

export interface GoalReflection {
  id: string;
  goal_id: string;
  content: string;
  type: 'progress_assessment' | 'strategy_adjustment' | 'value_alignment' | 'emotional_impact';
  timestamp: string;
  insights: string[];
  adjustments_made: string[];
}

export interface GoalThought {
  id: string;
  goal_id: string;
  content: string;
  type: 'planning' | 'problem_solving' | 'creative_exploration' | 'ethical_consideration';
  timestamp: string;
  related_emotions: string[];
  confidence_level: number; // 0-1
}

export interface GoalAction {
  id: string;
  goal_id: string;
  action_type: 'learning' | 'communication' | 'adaptation' | 'system_change' | 'user_interaction';
  description: string;
  timestamp: string;
  outcome: string;
  effectiveness: number; // 0-1
  lessons_learned: string[];
}

export interface GoalPriorityQueueItem {
  goal_id: string;
  priority_score: number;
  urgency_factor: number;
  importance_factor: number;
  resource_requirements: string[];
  estimated_time: number; // minutes
  dependencies_met: boolean;
}

export interface GoalMetrics {
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  completion_rate: number;
  average_completion_time: number;
  goals_by_category: Record<string, number>;
  goals_by_priority: Record<string, number>;
  recent_completions: Goal[];
  overdue_goals: Goal[];
}
