import { NextRequest, NextResponse } from 'next/server';
import { FeedbackService } from '@/lib/feedback/feedback-service';
import { AuthUtils } from '@/lib/auth/utils';
import { z } from 'zod';

const feedbackService = new FeedbackService();

// Validation schemas
const submitFeedbackSchema = z.object({
  type: z.enum(['bug_report', 'feature_request', 'general_feedback', 'rating']),
  category: z.string().min(1).max(100),
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(2000),
  rating: z.number().min(1).max(5).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  metadata: z.any().optional()
});

const submitRatingSchema = z.object({
  rating: z.number().min(1).max(5),
  category: z.string().default('general'),
  comment: z.string().optional()
});

const updateStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  admin_response: z.string().optional()
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'user-feedback';

    switch (type) {
      case 'user-feedback':
        const limit = parseInt(searchParams.get('limit') || '50');
        const userFeedback = await feedbackService.getUserFeedback(payload.sub, limit);
        return NextResponse.json({
          success: true,
          data: userFeedback
        });

      case 'user-ratings':
        const userRatings = await feedbackService.getUserRatings(payload.sub);
        return NextResponse.json({
          success: true,
          data: userRatings
        });

      case 'all-feedback':
        // Admin only
        if (payload.role !== 'admin') {
          return NextResponse.json(
            { success: false, error: 'Admin access required' },
            { status: 403 }
          );
        }

        const allLimit = parseInt(searchParams.get('limit') || '100');
        const status = searchParams.get('status') || undefined;
        const feedbackType = searchParams.get('feedback_type') || undefined;
        
        const allFeedback = await feedbackService.getAllFeedback(allLimit, status, feedbackType);
        return NextResponse.json({
          success: true,
          data: allFeedback
        });

      case 'stats':
        // Admin only
        if (payload.role !== 'admin') {
          return NextResponse.json(
            { success: false, error: 'Admin access required' },
            { status: 403 }
          );
        }

        const stats = await feedbackService.getFeedbackStats();
        return NextResponse.json({
          success: true,
          data: stats
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Feedback GET API error:', error);
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
      case 'submit-feedback':
        const feedbackValidation = submitFeedbackSchema.safeParse(body);
        if (!feedbackValidation.success) {
          return NextResponse.json(
            { success: false, error: 'Invalid input', details: feedbackValidation.error.issues },
            { status: 400 }
          );
        }

        const feedbackResult = await feedbackService.submitFeedback({
          user_id: payload.sub,
          ...feedbackValidation.data
        });

        return NextResponse.json(feedbackResult);

      case 'submit-rating':
        const ratingValidation = submitRatingSchema.safeParse(body);
        if (!ratingValidation.success) {
          return NextResponse.json(
            { success: false, error: 'Invalid input', details: ratingValidation.error.issues },
            { status: 400 }
          );
        }

        const ratingResult = await feedbackService.submitRating(
          payload.sub,
          ratingValidation.data.rating,
          ratingValidation.data.category,
          ratingValidation.data.comment
        );

        return NextResponse.json(ratingResult);

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Feedback POST API error:', error);
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

    // Only admins can update feedback status
    if (payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { feedbackId } = body;

    if (!feedbackId) {
      return NextResponse.json(
        { success: false, error: 'Feedback ID required' },
        { status: 400 }
      );
    }

    const validation = updateStatusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const result = await feedbackService.updateFeedbackStatus(
      feedbackId,
      validation.data.status,
      validation.data.admin_response
    );

    return NextResponse.json(result);

  } catch (error) {
    console.error('Feedback PUT API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
