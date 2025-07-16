import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/analytics/analytics-service';
import { AuthUtils } from '@/lib/auth/utils';

const analyticsService = new AnalyticsService();

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

    // Check if user has admin role
    if (payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';

    switch (type) {
      case 'overview':
        const analytics = await analyticsService.getUserAnalytics();
        return NextResponse.json({
          success: true,
          data: analytics
        });

      case 'users':
        const limit = parseInt(searchParams.get('limit') || '50');
        const userSummaries = await analyticsService.getUserActivitySummary(limit);
        return NextResponse.json({
          success: true,
          data: userSummaries
        });

      case 'trends':
        const days = parseInt(searchParams.get('days') || '30');
        const trends = await analyticsService.getActivityTrends(days);
        return NextResponse.json({
          success: true,
          data: trends
        });

      case 'user-timeline':
        const userId = searchParams.get('userId');
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'User ID required' },
            { status: 400 }
          );
        }
        const timelineLimit = parseInt(searchParams.get('limit') || '100');
        const timeline = await analyticsService.getUserActivityTimeline(userId, timelineLimit);
        return NextResponse.json({
          success: true,
          data: timeline
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid analytics type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
