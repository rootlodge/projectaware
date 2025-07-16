import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notifications/notification-service';
import { AuthUtils } from '@/lib/auth/utils';
import { z } from 'zod';

const notificationService = new NotificationService();

// Validation schemas
const createNotificationSchema = z.object({
  type: z.enum(['email', 'push', 'in_app']),
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(1000),
  data: z.any().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  scheduled_for: z.string().optional()
});

const updatePreferencesSchema = z.object({
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  marketing_emails: z.boolean().optional(),
  security_alerts: z.boolean().optional(),
  system_updates: z.boolean().optional(),
  newsletter: z.boolean().optional(),
  frequency: z.enum(['immediate', 'daily', 'weekly']).optional(),
  quiet_hours_start: z.string().optional(),
  quiet_hours_end: z.string().optional(),
  timezone: z.string().optional()
});

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
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'notifications';

    switch (type) {
      case 'notifications':
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        const notifications = await notificationService.getUserNotifications(userId, limit, offset);
        return NextResponse.json({
          success: true,
          data: notifications
        });

      case 'unread-count':
        const count = await notificationService.getUnreadCount(userId);
        return NextResponse.json({
          success: true,
          data: { count }
        });

      case 'preferences':
        const preferences = await notificationService.getNotificationPreferences(userId);
        return NextResponse.json({
          success: true,
          data: preferences
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Notifications GET API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create':
        // Only admins can create notifications for other users
        if (payload.role !== 'admin') {
          return NextResponse.json(
            { success: false, error: 'Admin access required' },
            { status: 403 }
          );
        }

        const validation = createNotificationSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            { success: false, error: 'Invalid input', details: validation.error.issues },
            { status: 400 }
          );
        }

        const createResult = await notificationService.createNotification({
          user_id: body.user_id,
          ...validation.data,
          read: false,
          sent: false
        });

        return NextResponse.json(createResult);

      case 'mark-read':
        const { notificationId } = body;
        if (!notificationId) {
          return NextResponse.json(
            { success: false, error: 'Notification ID required' },
            { status: 400 }
          );
        }

        const markResult = await notificationService.markAsRead(notificationId, payload.sub);
        return NextResponse.json(markResult);

      case 'mark-all-read':
        const markAllResult = await notificationService.markAllAsRead(payload.sub);
        return NextResponse.json(markAllResult);

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Notifications POST API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const validation = updatePreferencesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const result = await notificationService.updateNotificationPreferences(payload.sub, validation.data);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Notifications PUT API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
