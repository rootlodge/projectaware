import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/auth/user-service';
import { AuthUtils } from '@/lib/auth/utils';
import DatabaseManager from '@/lib/database/manager';

const userService = new UserService();

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = AuthUtils.verifyAccessToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = payload.sub;
    const db = DatabaseManager.getInstance().getDb();

    // Export all user data
    const userData = db.prepare(`
      SELECT id, email, username, full_name, avatar_url, email_verified, 
             phone_verified, theme, language, timezone, status, role,
             privacy_consent, marketing_consent, data_retention_days,
             created_at, updated_at
      FROM users 
      WHERE id = ? AND deleted_at IS NULL
    `).get(userId);

    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user preferences
    const preferences = db.prepare(`
      SELECT * FROM user_preferences WHERE user_id = ?
    `).all(userId);

    // Get user activities (last 1000 entries)
    const activities = db.prepare(`
      SELECT action, metadata, ip_address, user_agent, timestamp
      FROM user_activities 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT 1000
    `).all(userId);

    // Get user sessions
    const sessions = db.prepare(`
      SELECT device_info, ip_address, user_agent, created_at, expires_at, last_used_at
      FROM user_sessions 
      WHERE user_id = ? AND expires_at > ?
    `).all(userId, new Date().toISOString());

    // Get notification preferences
    const notificationPrefs = db.prepare(`
      SELECT * FROM user_notification_preferences WHERE user_id = ?
    `).all(userId);

    const exportData = {
      user: userData,
      preferences: preferences,
      activities: activities,
      sessions: sessions,
      notificationPreferences: notificationPrefs,
      exportDate: new Date().toISOString(),
      dataRetentionPolicy: 'Data will be retained according to your preferences and legal requirements'
    };

    return NextResponse.json({
      success: true,
      data: exportData
    });

  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = AuthUtils.verifyAccessToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { confirm } = await request.json();
    
    if (!confirm) {
      return NextResponse.json(
        { success: false, error: 'Confirmation required' },
        { status: 400 }
      );
    }

    const userId = payload.sub;
    const db = DatabaseManager.getInstance().getDb();

    // Perform soft delete (GDPR compliant)
    db.transaction(() => {
      // Mark user as deleted
      db.prepare(`
        UPDATE users 
        SET deleted_at = ?, 
            email = ?, 
            full_name = 'Deleted User',
            avatar_url = NULL,
            updated_at = ?
        WHERE id = ?
      `).run(
        new Date().toISOString(),
        `deleted_${userId}@deleted.local`,
        new Date().toISOString(),
        userId
      );

      // Invalidate all sessions
      db.prepare(`
        UPDATE user_sessions 
        SET expires_at = ? 
        WHERE user_id = ?
      `).run(new Date().toISOString(), userId);

      // Log the deletion activity
      db.prepare(`
        INSERT INTO user_activities (id, user_id, action, metadata, ip_address, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        AuthUtils.generateSecureToken(),
        userId,
        'account_deleted',
        JSON.stringify({ reason: 'user_requested' }),
        request.headers.get('x-forwarded-for') || 'unknown',
        new Date().toISOString()
      );
    })();

    return NextResponse.json({
      success: true,
      message: 'Account successfully deleted. All personal data has been anonymized.'
    });

  } catch (error) {
    console.error('Data deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
