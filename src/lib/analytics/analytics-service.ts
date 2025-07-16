import DatabaseManager from '@/lib/database/manager';
import { User, UserActivity } from '@/lib/types/auth';

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByRole: { [role: string]: number };
  activityStats: {
    totalActivities: number;
    activitiesThisWeek: number;
    topActivities: Array<{ action: string; count: number }>;
  };
  retentionStats: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
  };
}

export interface UserActivitySummary {
  userId: string;
  email: string;
  full_name: string;
  totalActivities: number;
  lastActivity: string;
  mostCommonActions: Array<{ action: string; count: number }>;
  registrationDate: string;
  daysSinceRegistration: number;
}

export class AnalyticsService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  // Get comprehensive user analytics
  public async getUserAnalytics(): Promise<UserAnalytics> {
    const db = this.dbManager.getDb();
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total users
    const totalUsersResult = db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL
    `).get() as { count: number };

    // Active users (users who have logged in within the last 30 days)
    const activeUsersResult = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM user_sessions 
      WHERE created_at >= ? AND expires_at > ?
    `).get(monthStart.toISOString(), now.toISOString()) as { count: number };

    // New users by time period
    const newUsersToday = db.prepare(`
      SELECT COUNT(*) as count FROM users 
      WHERE created_at >= ? AND deleted_at IS NULL
    `).get(todayStart.toISOString()) as { count: number };

    const newUsersThisWeek = db.prepare(`
      SELECT COUNT(*) as count FROM users 
      WHERE created_at >= ? AND deleted_at IS NULL
    `).get(weekStart.toISOString()) as { count: number };

    const newUsersThisMonth = db.prepare(`
      SELECT COUNT(*) as count FROM users 
      WHERE created_at >= ? AND deleted_at IS NULL
    `).get(monthStart.toISOString()) as { count: number };

    // Users by role
    const usersByRoleResults = db.prepare(`
      SELECT role, COUNT(*) as count 
      FROM users 
      WHERE deleted_at IS NULL 
      GROUP BY role
    `).all() as Array<{ role: string; count: number }>;

    const usersByRole: { [role: string]: number } = {};
    usersByRoleResults.forEach(row => {
      usersByRole[row.role] = row.count;
    });

    // Activity statistics
    const totalActivitiesResult = db.prepare(`
      SELECT COUNT(*) as count FROM user_activities
    `).get() as { count: number };

    const activitiesThisWeekResult = db.prepare(`
      SELECT COUNT(*) as count FROM user_activities 
      WHERE timestamp >= ?
    `).get(weekStart.toISOString()) as { count: number };

    const topActivitiesResults = db.prepare(`
      SELECT action, COUNT(*) as count 
      FROM user_activities 
      WHERE timestamp >= ?
      GROUP BY action 
      ORDER BY count DESC 
      LIMIT 10
    `).all(weekStart.toISOString()) as Array<{ action: string; count: number }>;

    // Retention statistics
    const dailyActiveUsersResult = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM user_activities 
      WHERE timestamp >= ?
    `).get(todayStart.toISOString()) as { count: number };

    const weeklyActiveUsersResult = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM user_activities 
      WHERE timestamp >= ?
    `).get(weekStart.toISOString()) as { count: number };

    const monthlyActiveUsersResult = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM user_activities 
      WHERE timestamp >= ?
    `).get(monthStart.toISOString()) as { count: number };

    return {
      totalUsers: totalUsersResult.count,
      activeUsers: activeUsersResult.count,
      newUsersToday: newUsersToday.count,
      newUsersThisWeek: newUsersThisWeek.count,
      newUsersThisMonth: newUsersThisMonth.count,
      usersByRole,
      activityStats: {
        totalActivities: totalActivitiesResult.count,
        activitiesThisWeek: activitiesThisWeekResult.count,
        topActivities: topActivitiesResults
      },
      retentionStats: {
        dailyActiveUsers: dailyActiveUsersResult.count,
        weeklyActiveUsers: weeklyActiveUsersResult.count,
        monthlyActiveUsers: monthlyActiveUsersResult.count
      }
    };
  }

  // Get detailed user activity summary
  public async getUserActivitySummary(limit: number = 50): Promise<UserActivitySummary[]> {
    const db = this.dbManager.getDb();
    
    const results = db.prepare(`
      SELECT 
        u.id as userId,
        u.email,
        u.full_name,
        u.created_at as registrationDate,
        COUNT(ua.id) as totalActivities,
        MAX(ua.timestamp) as lastActivity
      FROM users u
      LEFT JOIN user_activities ua ON u.id = ua.user_id
      WHERE u.deleted_at IS NULL
      GROUP BY u.id, u.email, u.full_name, u.created_at
      ORDER BY totalActivities DESC, lastActivity DESC
      LIMIT ?
    `).all(limit) as Array<{
      userId: string;
      email: string;
      full_name: string;
      totalActivities: number;
      lastActivity: string;
      registrationDate: string;
    }>;

    const summaries: UserActivitySummary[] = [];

    for (const user of results) {
      // Get most common actions for this user
      const topActions = db.prepare(`
        SELECT action, COUNT(*) as count 
        FROM user_activities 
        WHERE user_id = ?
        GROUP BY action 
        ORDER BY count DESC 
        LIMIT 5
      `).all(user.userId) as Array<{ action: string; count: number }>;

      const registrationDate = new Date(user.registrationDate);
      const daysSinceRegistration = Math.floor((Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));

      summaries.push({
        userId: user.userId,
        email: user.email,
        full_name: user.full_name || 'Unknown',
        totalActivities: user.totalActivities,
        lastActivity: user.lastActivity || 'Never',
        mostCommonActions: topActions,
        registrationDate: user.registrationDate,
        daysSinceRegistration
      });
    }

    return summaries;
  }

  // Get user activity timeline
  public async getUserActivityTimeline(userId: string, limit: number = 100): Promise<UserActivity[]> {
    const db = this.dbManager.getDb();
    
    const activities = db.prepare(`
      SELECT * FROM user_activities 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(userId, limit) as UserActivity[];

    return activities;
  }

  // Get system-wide activity trends
  public async getActivityTrends(days: number = 30): Promise<Array<{ date: string; count: number }>> {
    const db = this.dbManager.getDb();
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = db.prepare(`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as count
      FROM user_activities 
      WHERE timestamp >= ?
      GROUP BY DATE(timestamp)
      ORDER BY date
    `).all(startDate.toISOString()) as Array<{ date: string; count: number }>;

    return results;
  }
}
