import DatabaseManager from '@/lib/database/manager';

export interface Feedback {
  id: string;
  user_id: string;
  type: 'bug_report' | 'feature_request' | 'general_feedback' | 'rating';
  category: string;
  title: string;
  description: string;
  rating?: number; // 1-5 scale
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  metadata?: any;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  admin_response?: string;
}

export interface FeedbackStats {
  totalFeedback: number;
  averageRating: number;
  feedbackByType: { [type: string]: number };
  feedbackByStatus: { [status: string]: number };
  recentFeedback: Feedback[];
}

export class FeedbackService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  // Submit new feedback
  public async submitFeedback(feedback: Omit<Feedback, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const db = this.dbManager.getDb();
      const now = new Date().toISOString();
      const id = this.generateId();

      db.prepare(`
        INSERT INTO user_feedback (
          id, user_id, type, category, title, description, rating, priority,
          status, metadata, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        feedback.user_id,
        feedback.type,
        feedback.category,
        feedback.title,
        feedback.description,
        feedback.rating || null,
        feedback.priority,
        'open', // Default status
        feedback.metadata ? JSON.stringify(feedback.metadata) : null,
        now,
        now
      );

      return { success: true, id };
    } catch (error) {
      console.error('Submit feedback error:', error);
      return { success: false, error: 'Failed to submit feedback' };
    }
  }

  // Get user's feedback history
  public async getUserFeedback(userId: string, limit: number = 50): Promise<Feedback[]> {
    const db = this.dbManager.getDb();
    
    const feedback = db.prepare(`
      SELECT * FROM user_feedback 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(userId, limit) as any[];

    return feedback.map(f => ({
      ...f,
      metadata: f.metadata ? JSON.parse(f.metadata) : null
    }));
  }

  // Get all feedback (admin only)
  public async getAllFeedback(limit: number = 100, status?: string, type?: string): Promise<Feedback[]> {
    const db = this.dbManager.getDb();
    
    let query = `
      SELECT uf.*, u.email, u.full_name 
      FROM user_feedback uf
      LEFT JOIN users u ON uf.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ` AND uf.status = ?`;
      params.push(status);
    }

    if (type) {
      query += ` AND uf.type = ?`;
      params.push(type);
    }

    query += ` ORDER BY uf.created_at DESC LIMIT ?`;
    params.push(limit);

    const feedback = db.prepare(query).all(...params) as any[];

    return feedback.map(f => ({
      ...f,
      metadata: f.metadata ? JSON.parse(f.metadata) : null
    }));
  }

  // Update feedback status (admin only)
  public async updateFeedbackStatus(
    feedbackId: string, 
    status: 'open' | 'in_progress' | 'resolved' | 'closed',
    adminResponse?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const db = this.dbManager.getDb();
      const now = new Date().toISOString();

      let query = `
        UPDATE user_feedback 
        SET status = ?, updated_at = ?
      `;
      const params = [status, now];

      if (adminResponse) {
        query += `, admin_response = ?`;
        params.push(adminResponse);
      }

      if (status === 'resolved' || status === 'closed') {
        query += `, resolved_at = ?`;
        params.push(now);
      }

      query += ` WHERE id = ?`;
      params.push(feedbackId);

      const result = db.prepare(query).run(...params);

      if (result.changes === 0) {
        return { success: false, error: 'Feedback not found' };
      }

      return { success: true };
    } catch (error) {
      console.error('Update feedback status error:', error);
      return { success: false, error: 'Failed to update feedback status' };
    }
  }

  // Get feedback statistics
  public async getFeedbackStats(): Promise<FeedbackStats> {
    const db = this.dbManager.getDb();

    // Total feedback count
    const totalResult = db.prepare(`
      SELECT COUNT(*) as count FROM user_feedback
    `).get() as { count: number };

    // Average rating
    const ratingResult = db.prepare(`
      SELECT AVG(rating) as avg_rating FROM user_feedback 
      WHERE rating IS NOT NULL
    `).get() as { avg_rating: number };

    // Feedback by type
    const typeResults = db.prepare(`
      SELECT type, COUNT(*) as count 
      FROM user_feedback 
      GROUP BY type
    `).all() as Array<{ type: string; count: number }>;

    const feedbackByType: { [type: string]: number } = {};
    typeResults.forEach(row => {
      feedbackByType[row.type] = row.count;
    });

    // Feedback by status
    const statusResults = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM user_feedback 
      GROUP BY status
    `).all() as Array<{ status: string; count: number }>;

    const feedbackByStatus: { [status: string]: number } = {};
    statusResults.forEach(row => {
      feedbackByStatus[row.status] = row.count;
    });

    // Recent feedback
    const recentFeedback = db.prepare(`
      SELECT uf.*, u.email, u.full_name 
      FROM user_feedback uf
      LEFT JOIN users u ON uf.user_id = u.id
      ORDER BY uf.created_at DESC 
      LIMIT 10
    `).all() as any[];

    return {
      totalFeedback: totalResult.count,
      averageRating: Math.round((ratingResult.avg_rating || 0) * 10) / 10,
      feedbackByType,
      feedbackByStatus,
      recentFeedback: recentFeedback.map(f => ({
        ...f,
        metadata: f.metadata ? JSON.parse(f.metadata) : null
      }))
    };
  }

  // Submit a quick rating
  public async submitRating(userId: string, rating: number, category: string = 'general', comment?: string): Promise<{ success: boolean; error?: string }> {
    if (rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5' };
    }

    return this.submitFeedback({
      user_id: userId,
      type: 'rating',
      category: category,
      title: `${rating}-star rating`,
      description: comment || `User rated ${rating} stars`,
      rating: rating,
      priority: 'low'
    });
  }

  // Get user's ratings history
  public async getUserRatings(userId: string): Promise<Array<{ rating: number; category: string; created_at: string; comment?: string }>> {
    const db = this.dbManager.getDb();
    
    const ratings = db.prepare(`
      SELECT rating, category, description, created_at 
      FROM user_feedback 
      WHERE user_id = ? AND type = 'rating' AND rating IS NOT NULL
      ORDER BY created_at DESC
    `).all(userId) as any[];

    return ratings.map(r => ({
      rating: r.rating,
      category: r.category,
      created_at: r.created_at,
      comment: r.description !== `User rated ${r.rating} stars` ? r.description : undefined
    }));
  }

  private generateId(): string {
    return require('uuid').v4().replace(/-/g, '');
  }
}
