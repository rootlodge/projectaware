import DatabaseManager from '@/lib/database/manager';

export interface Notification {
  id: string;
  user_id: string;
  type: 'email' | 'push' | 'in_app';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  sent: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_for?: string;
  sent_at?: string;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
  security_alerts: boolean;
  system_updates: boolean;
  newsletter: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone: string;
}

export class NotificationService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  // Create a new notification
  public async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const db = this.dbManager.getDb();
      const now = new Date().toISOString();
      const id = this.generateId();

      db.prepare(`
        INSERT INTO user_notifications (
          id, user_id, type, title, message, data, read, sent, priority,
          scheduled_for, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        notification.user_id,
        notification.type,
        notification.title,
        notification.message,
        notification.data ? JSON.stringify(notification.data) : null,
        notification.read ? 1 : 0,
        notification.sent ? 1 : 0,
        notification.priority,
        notification.scheduled_for,
        now,
        now
      );

      return { success: true, id };
    } catch (error) {
      console.error('Create notification error:', error);
      return { success: false, error: 'Failed to create notification' };
    }
  }

  // Get notifications for a user
  public async getUserNotifications(userId: string, limit: number = 50, offset: number = 0): Promise<Notification[]> {
    const db = this.dbManager.getDb();
    
    const notifications = db.prepare(`
      SELECT * FROM user_notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset) as any[];

    return notifications.map(n => ({
      ...n,
      read: Boolean(n.read),
      sent: Boolean(n.sent),
      data: n.data ? JSON.parse(n.data) : null
    }));
  }

  // Mark notification as read
  public async markAsRead(notificationId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const db = this.dbManager.getDb();
      
      const result = db.prepare(`
        UPDATE user_notifications 
        SET read = 1, read_at = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `).run(new Date().toISOString(), new Date().toISOString(), notificationId, userId);

      if (result.changes === 0) {
        return { success: false, error: 'Notification not found' };
      }

      return { success: true };
    } catch (error) {
      console.error('Mark as read error:', error);
      return { success: false, error: 'Failed to mark as read' };
    }
  }

  // Mark all notifications as read for a user
  public async markAllAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const db = this.dbManager.getDb();
      
      db.prepare(`
        UPDATE user_notifications 
        SET read = 1, read_at = ?, updated_at = ?
        WHERE user_id = ? AND read = 0
      `).run(new Date().toISOString(), new Date().toISOString(), userId);

      return { success: true };
    } catch (error) {
      console.error('Mark all as read error:', error);
      return { success: false, error: 'Failed to mark all as read' };
    }
  }

  // Get notification preferences
  public async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    const db = this.dbManager.getDb();
    
    const prefs = db.prepare(`
      SELECT * FROM user_notification_preferences WHERE user_id = ?
    `).get(userId) as any;

    if (!prefs) {
      return null;
    }

    return {
      ...prefs,
      email_notifications: Boolean(prefs.email_notifications),
      push_notifications: Boolean(prefs.push_notifications),
      marketing_emails: Boolean(prefs.marketing_emails),
      security_alerts: Boolean(prefs.security_alerts),
      system_updates: Boolean(prefs.system_updates),
      newsletter: Boolean(prefs.newsletter)
    };
  }

  // Update notification preferences
  public async updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<{ success: boolean; error?: string }> {
    try {
      const db = this.dbManager.getDb();
      const now = new Date().toISOString();

      // Check if preferences exist
      const existing = db.prepare(`
        SELECT user_id FROM user_notification_preferences WHERE user_id = ?
      `).get(userId);

      if (existing) {
        // Update existing preferences
        const updates: string[] = [];
        const values: any[] = [];

        Object.entries(preferences).forEach(([key, value]) => {
          if (key !== 'user_id') {
            updates.push(`${key} = ?`);
            values.push(typeof value === 'boolean' ? (value ? 1 : 0) : value);
          }
        });

        if (updates.length > 0) {
          updates.push('updated_at = ?');
          values.push(now, userId);

          db.prepare(`
            UPDATE user_notification_preferences 
            SET ${updates.join(', ')} 
            WHERE user_id = ?
          `).run(...values);
        }
      } else {
        // Create new preferences
        db.prepare(`
          INSERT INTO user_notification_preferences (
            user_id, email_notifications, push_notifications, marketing_emails,
            security_alerts, system_updates, newsletter, frequency,
            quiet_hours_start, quiet_hours_end, timezone, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          userId,
          preferences.email_notifications ? 1 : 0,
          preferences.push_notifications ? 1 : 0,
          preferences.marketing_emails ? 1 : 0,
          preferences.security_alerts !== false ? 1 : 0, // Default to true for security
          preferences.system_updates !== false ? 1 : 0, // Default to true for system updates
          preferences.newsletter ? 1 : 0,
          preferences.frequency || 'immediate',
          preferences.quiet_hours_start,
          preferences.quiet_hours_end,
          preferences.timezone || 'UTC',
          now,
          now
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Update notification preferences error:', error);
      return { success: false, error: 'Failed to update preferences' };
    }
  }

  // Send notification (placeholder for future email/push integration)
  public async sendNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const db = this.dbManager.getDb();
      
      const notification = db.prepare(`
        SELECT * FROM user_notifications WHERE id = ?
      `).get(notificationId) as any;

      if (!notification) {
        return { success: false, error: 'Notification not found' };
      }

      // TODO: Implement actual email/push sending here
      // For now, just mark as sent
      db.prepare(`
        UPDATE user_notifications 
        SET sent = 1, sent_at = ?, updated_at = ?
        WHERE id = ?
      `).run(new Date().toISOString(), new Date().toISOString(), notificationId);

      return { success: true };
    } catch (error) {
      console.error('Send notification error:', error);
      return { success: false, error: 'Failed to send notification' };
    }
  }

  // Get unread notification count
  public async getUnreadCount(userId: string): Promise<number> {
    const db = this.dbManager.getDb();
    
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM user_notifications 
      WHERE user_id = ? AND read = 0
    `).get(userId) as { count: number };

    return result.count;
  }

  private generateId(): string {
    return require('uuid').v4().replace(/-/g, '');
  }
}
