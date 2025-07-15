import Database from 'better-sqlite3';
import path from 'path';
import { Goal, GoalReflection, GoalThought, GoalAction, GoalPriorityQueueItem, GoalMetrics } from '../types/goal-types';

export class GoalDatabase {
  private db: Database.Database;
  private isInitialized = false;

  constructor(dbPath?: string) {
    const defaultPath = path.join(process.cwd(), 'data', 'memory.db');
    this.db = new Database(dbPath || defaultPath);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('short_term', 'long_term')),
        category TEXT NOT NULL CHECK (category IN ('agent_driven', 'emotion_driven', 'user_driven', 'system_driven')),
        priority INTEGER NOT NULL CHECK (priority >= 1 AND priority <= 10),
        status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'paused', 'failed', 'cancelled')),
        progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        target_completion TEXT,
        actual_completion TEXT,
        triggered_by TEXT NOT NULL, -- JSON string
        success_criteria TEXT NOT NULL, -- JSON string
        parent_goal_id TEXT,
        sub_goal_ids TEXT NOT NULL DEFAULT '[]', -- JSON array
        related_goal_ids TEXT NOT NULL DEFAULT '[]', -- JSON array
        FOREIGN KEY (parent_goal_id) REFERENCES goals(id)
      );

      CREATE TABLE IF NOT EXISTS goal_reflections (
        id TEXT PRIMARY KEY,
        goal_id TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('progress_assessment', 'strategy_adjustment', 'value_alignment', 'emotional_impact')),
        timestamp TEXT NOT NULL,
        insights TEXT NOT NULL DEFAULT '[]', -- JSON array
        adjustments_made TEXT NOT NULL DEFAULT '[]', -- JSON array
        FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS goal_thoughts (
        id TEXT PRIMARY KEY,
        goal_id TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('planning', 'problem_solving', 'creative_exploration', 'ethical_consideration')),
        timestamp TEXT NOT NULL,
        related_emotions TEXT NOT NULL DEFAULT '[]', -- JSON array
        confidence_level REAL NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 1),
        FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS goal_actions (
        id TEXT PRIMARY KEY,
        goal_id TEXT NOT NULL,
        action_type TEXT NOT NULL CHECK (action_type IN ('learning', 'communication', 'adaptation', 'system_change', 'user_interaction')),
        description TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        outcome TEXT NOT NULL,
        effectiveness REAL NOT NULL CHECK (effectiveness >= 0 AND effectiveness <= 1),
        lessons_learned TEXT NOT NULL DEFAULT '[]', -- JSON array
        FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS goal_priority_queue (
        goal_id TEXT PRIMARY KEY,
        priority_score REAL NOT NULL,
        urgency_factor REAL NOT NULL,
        importance_factor REAL NOT NULL,
        resource_requirements TEXT NOT NULL DEFAULT '[]', -- JSON array
        estimated_time INTEGER NOT NULL DEFAULT 0,
        dependencies_met INTEGER NOT NULL DEFAULT 1, -- boolean as integer
        last_updated TEXT NOT NULL,
        FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS emotion_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        emotion TEXT NOT NULL,
        intensity REAL NOT NULL,
        timestamp TEXT NOT NULL,
        context TEXT,
        source TEXT,
        duration INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS goal_user_interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        context TEXT,
        timestamp TEXT NOT NULL,
        emotion_at_time TEXT,
        processed_for_goals BOOLEAN DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
      CREATE INDEX IF NOT EXISTS idx_goals_priority ON goals(priority);
      CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
      CREATE INDEX IF NOT EXISTS idx_goals_type ON goals(type);
      CREATE INDEX IF NOT EXISTS idx_goal_reflections_goal_id ON goal_reflections(goal_id);
      CREATE INDEX IF NOT EXISTS idx_goal_thoughts_goal_id ON goal_thoughts(goal_id);
      CREATE INDEX IF NOT EXISTS idx_goal_actions_goal_id ON goal_actions(goal_id);
      CREATE INDEX IF NOT EXISTS idx_priority_queue_score ON goal_priority_queue(priority_score);
    `);

    this.isInitialized = true;
  }

  // Goal CRUD operations
  async createGoal(goal: Omit<Goal, 'reflections' | 'thoughts' | 'actions_taken'>): Promise<string> {
    await this.initialize();
    
    const stmt = this.db.prepare(`
      INSERT INTO goals (
        id, title, description, type, category, priority, status, progress,
        created_at, updated_at, target_completion, actual_completion,
        triggered_by, success_criteria, parent_goal_id, sub_goal_ids, related_goal_ids
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      goal.id,
      goal.title,
      goal.description,
      goal.type,
      goal.category,
      goal.priority,
      goal.status,
      goal.progress,
      goal.created_at,
      goal.updated_at,
      goal.target_completion,
      goal.actual_completion,
      JSON.stringify(goal.triggered_by),
      JSON.stringify(goal.success_criteria),
      goal.parent_goal_id,
      JSON.stringify(goal.sub_goal_ids),
      JSON.stringify(goal.related_goal_ids)
    );

    return goal.id;
  }

  async getGoal(id: string): Promise<Goal | null> {
    await this.initialize();
    
    const stmt = this.db.prepare('SELECT * FROM goals WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;

    const reflections = await this.getGoalReflections(id);
    const thoughts = await this.getGoalThoughts(id);
    const actions = await this.getGoalActions(id);

    return this.rowToGoal(row, reflections, thoughts, actions);
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<void> {
    await this.initialize();
    
    const fields = [];
    const values = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'reflections' || key === 'thoughts' || key === 'actions_taken') return;
      
      if (key === 'triggered_by' || key === 'success_criteria' || key === 'sub_goal_ids' || key === 'related_goal_ids') {
        fields.push(`${key} = ?`);
        values.push(JSON.stringify(value));
      } else {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return;

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = this.db.prepare(`UPDATE goals SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  async getActiveGoals(): Promise<Goal[]> {
    await this.initialize();
    
    const stmt = this.db.prepare('SELECT * FROM goals WHERE status = ? ORDER BY priority DESC, created_at ASC');
    const rows = stmt.all('active') as any[];
    
    const goals = [];
    for (const row of rows) {
      const reflections = await this.getGoalReflections(row.id);
      const thoughts = await this.getGoalThoughts(row.id);
      const actions = await this.getGoalActions(row.id);
      goals.push(this.rowToGoal(row, reflections, thoughts, actions));
    }
    
    return goals;
  }

  async getGoalsByCategory(category: string): Promise<Goal[]> {
    await this.initialize();
    
    const stmt = this.db.prepare('SELECT * FROM goals WHERE category = ? ORDER BY priority DESC');
    const rows = stmt.all(category) as any[];
    
    const goals = [];
    for (const row of rows) {
      const reflections = await this.getGoalReflections(row.id);
      const thoughts = await this.getGoalThoughts(row.id);
      const actions = await this.getGoalActions(row.id);
      goals.push(this.rowToGoal(row, reflections, thoughts, actions));
    }
    
    return goals;
  }

  // Reflection operations
  async addReflection(reflection: GoalReflection): Promise<void> {
    await this.initialize();
    
    const stmt = this.db.prepare(`
      INSERT INTO goal_reflections (id, goal_id, content, type, timestamp, insights, adjustments_made)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      reflection.id,
      reflection.goal_id,
      reflection.content,
      reflection.type,
      reflection.timestamp,
      JSON.stringify(reflection.insights),
      JSON.stringify(reflection.adjustments_made)
    );
  }

  async getGoalReflections(goalId: string): Promise<GoalReflection[]> {
    await this.initialize();
    
    const stmt = this.db.prepare('SELECT * FROM goal_reflections WHERE goal_id = ? ORDER BY timestamp DESC');
    const rows = stmt.all(goalId) as any[];
    
    return rows.map(row => ({
      id: row.id,
      goal_id: row.goal_id,
      content: row.content,
      type: row.type,
      timestamp: row.timestamp,
      insights: JSON.parse(row.insights),
      adjustments_made: JSON.parse(row.adjustments_made),
      confidence_level: row.confidence_level || 0,
      agent_contributor: row.agent_contributor
    }));
  }

  // Thought operations
  async addThought(thought: GoalThought): Promise<void> {
    await this.initialize();
    
    const stmt = this.db.prepare(`
      INSERT INTO goal_thoughts (id, goal_id, content, type, timestamp, related_emotions, confidence_level)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      thought.id,
      thought.goal_id,
      thought.content,
      thought.type,
      thought.timestamp,
      JSON.stringify(thought.related_emotions),
      thought.confidence_level
    );
  }

  async getGoalThoughts(goalId: string): Promise<GoalThought[]> {
    await this.initialize();
    
    const stmt = this.db.prepare('SELECT * FROM goal_thoughts WHERE goal_id = ? ORDER BY timestamp DESC');
    const rows = stmt.all(goalId) as any[];
    
    return rows.map(row => ({
      id: row.id,
      goal_id: row.goal_id,
      content: row.content,
      type: row.type,
      timestamp: row.timestamp,
      related_emotions: JSON.parse(row.related_emotions),
      confidence_level: row.confidence_level
    }));
  }

  // Action operations
  async addAction(action: GoalAction): Promise<void> {
    await this.initialize();
    
    const stmt = this.db.prepare(`
      INSERT INTO goal_actions (id, goal_id, action_type, description, timestamp, outcome, effectiveness, lessons_learned)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      action.id,
      action.goal_id,
      action.action_type,
      action.description,
      action.timestamp,
      action.outcome,
      action.effectiveness,
      JSON.stringify(action.lessons_learned)
    );
  }

  async getGoalActions(goalId: string): Promise<GoalAction[]> {
    await this.initialize();
    
    const stmt = this.db.prepare('SELECT * FROM goal_actions WHERE goal_id = ? ORDER BY timestamp DESC');
    const rows = stmt.all(goalId) as any[];
    
    return rows.map(row => ({
      id: row.id,
      goal_id: row.goal_id,
      action_type: row.action_type,
      description: row.description,
      timestamp: row.timestamp,
      outcome: row.outcome,
      effectiveness: row.effectiveness,
      lessons_learned: JSON.parse(row.lessons_learned),
      resources_used: JSON.parse(row.resources_used || '[]'),
      time_taken: row.time_taken || 0,
      performed_by_agent: row.performed_by_agent
    }));
  }

  // Priority queue operations
  async updatePriorityQueue(item: GoalPriorityQueueItem): Promise<void> {
    await this.initialize();
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO goal_priority_queue 
      (goal_id, priority_score, urgency_factor, importance_factor, resource_requirements, estimated_time, dependencies_met, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      item.goal_id,
      item.priority_score,
      item.urgency_factor,
      item.importance_factor,
      JSON.stringify(item.resource_requirements),
      item.estimated_time,
      item.dependencies_met ? 1 : 0,
      new Date().toISOString()
    );
  }

  async getPriorityQueue(): Promise<GoalPriorityQueueItem[]> {
    await this.initialize();
    
    const stmt = this.db.prepare('SELECT * FROM goal_priority_queue ORDER BY priority_score DESC');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      goal_id: row.goal_id,
      priority_score: row.priority_score,
      urgency_factor: row.urgency_factor,
      importance_factor: row.importance_factor,
      resource_requirements: JSON.parse(row.resource_requirements),
      estimated_time: row.estimated_time,
      dependencies_met: row.dependencies_met === 1,
      user_value_factor: row.user_value_factor || 0,
      cerebrum_priority_boost: row.cerebrum_priority_boost || 0,
      last_updated: row.last_updated || new Date().toISOString()
    })) as GoalPriorityQueueItem[];
  }

  // Metrics and analytics
  async getGoalMetrics(): Promise<GoalMetrics> {
    await this.initialize();
    
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM goals');
    const activeStmt = this.db.prepare('SELECT COUNT(*) as count FROM goals WHERE status = ?');
    const completedStmt = this.db.prepare('SELECT COUNT(*) as count FROM goals WHERE status = ?');
    const categoryStmt = this.db.prepare('SELECT category, COUNT(*) as count FROM goals GROUP BY category');
    const priorityStmt = this.db.prepare('SELECT priority, COUNT(*) as count FROM goals GROUP BY priority');
    const recentCompletedStmt = this.db.prepare(`
      SELECT * FROM goals WHERE status = 'completed' 
      ORDER BY actual_completion DESC LIMIT 5
    `);
    const overdueStmt = this.db.prepare(`
      SELECT * FROM goals WHERE status = 'active' 
      AND target_completion IS NOT NULL 
      AND datetime(target_completion) < datetime('now')
    `);

    const total = (totalStmt.get() as any).count;
    const active = (activeStmt.get('active') as any).count;
    const completed = (completedStmt.get('completed') as any).count;
    
    const categoryRows = categoryStmt.all() as any[];
    const priorityRows = priorityStmt.all() as any[];
    const recentCompletedRows = recentCompletedStmt.all() as any[];
    const overdueRows = overdueStmt.all() as any[];

    const goalsByCategory: Record<string, number> = {};
    categoryRows.forEach(row => {
      goalsByCategory[row.category] = row.count;
    });

    const goalsByPriority: Record<string, number> = {};
    priorityRows.forEach(row => {
      goalsByPriority[row.priority.toString()] = row.count;
    });

    const recentCompletions = [];
    for (const row of recentCompletedRows) {
      const reflections = await this.getGoalReflections(row.id);
      const thoughts = await this.getGoalThoughts(row.id);
      const actions = await this.getGoalActions(row.id);
      recentCompletions.push(this.rowToGoal(row, reflections, thoughts, actions));
    }

    const overdue = [];
    for (const row of overdueRows) {
      const reflections = await this.getGoalReflections(row.id);
      const thoughts = await this.getGoalThoughts(row.id);
      const actions = await this.getGoalActions(row.id);
      overdue.push(this.rowToGoal(row, reflections, thoughts, actions));
    }

    return {
      total_goals: total,
      active_goals: active,
      completed_goals: completed,
      completion_rate: total > 0 ? completed / total : 0,
      average_completion_time: 0, // TODO: Calculate from completion times
      goals_by_category: goalsByCategory,
      goals_by_priority: goalsByPriority,
      recent_completions: recentCompletions,
      overdue_goals: overdue,
      goals_by_type: {},
      cerebrum_goals_stats: { total: 0, active: 0, completed: 0 },
      user_satisfaction_scores: { average: 0, count: 0 }
    } as unknown as GoalMetrics;
  }

  // Emotion history operations
  async addEmotionHistory(emotion: string, intensity: number, context?: string, source?: string): Promise<void> {
    await this.initialize();
    
    const stmt = this.db.prepare(`
      INSERT INTO emotion_history (emotion, intensity, timestamp, context, source)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(emotion, intensity, new Date().toISOString(), context || '', source || 'goal_engine');
  }

  async getEmotionHistory(hours: number = 24): Promise<any[]> {
    await this.initialize();
    
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const stmt = this.db.prepare(`
      SELECT * FROM emotion_history 
      WHERE timestamp > ? 
      ORDER BY timestamp DESC
    `);
    
    return stmt.all(cutoffTime);
  }

  // User interaction operations
  async addUserInteraction(content: string, context?: string, emotion?: string): Promise<void> {
    await this.initialize();
    
    const stmt = this.db.prepare(`
      INSERT INTO goal_user_interactions (content, context, timestamp, emotion_at_time)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(content, context || '', new Date().toISOString(), emotion || '');
  }

  async getRecentUserInteractions(limit: number = 10): Promise<any[]> {
    await this.initialize();
    
    const stmt = this.db.prepare(`
      SELECT * FROM goal_user_interactions 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    
    return stmt.all(limit);
  }

  private rowToGoal(row: any, reflections: GoalReflection[], thoughts: GoalThought[], actions: GoalAction[]): Goal {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      category: row.category,
      priority: row.priority,
      status: row.status,
      progress: row.progress,
      created_at: row.created_at,
      updated_at: row.updated_at,
      target_completion: row.target_completion,
      actual_completion: row.actual_completion,
      triggered_by: JSON.parse(row.triggered_by),
      success_criteria: JSON.parse(row.success_criteria),
      parent_goal_id: row.parent_goal_id,
      sub_goal_ids: JSON.parse(row.sub_goal_ids),
      related_goal_ids: JSON.parse(row.related_goal_ids),
      reflections,
      thoughts,
      actions_taken: actions,
      tier: row.tier || 'user',
      origin: row.origin || 'user',
      blocking_dependencies: JSON.parse(row.blocking_dependencies || '[]'),
      agent_interactions: JSON.parse(row.agent_interactions || '[]')
    } as unknown as Goal;
  }

  async close(): Promise<void> {
    this.db.close();
  }
}
