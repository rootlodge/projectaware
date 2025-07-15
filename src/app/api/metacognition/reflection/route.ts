import { NextRequest, NextResponse } from 'next/server';
import { getMetacognitionEngine } from '@/lib/shared/instances';
import { SelfReflectionSession } from '@/lib/systems/MetacognitionEngine';

/**
 * GET /api/metacognition/reflection
 * Get recent self-reflection sessions
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const type = url.searchParams.get('type') || 'all';

    const metacognition = await getMetacognitionEngine();
    const reflectionSessions = metacognition.getReflectionSessions(limit);

    // Filter by type if specified
    const filteredSessions = type === 'all' 
      ? reflectionSessions 
      : reflectionSessions.filter((session: SelfReflectionSession) => session.session_type === type);

    return NextResponse.json({
      success: true,
      reflection_sessions: filteredSessions,
      total_count: filteredSessions.length,
      available_types: ['daily', 'weekly', 'triggered', 'deep_analysis']
    });

  } catch (error) {
    console.error('[Metacognition API] Error getting reflection sessions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get reflection sessions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/metacognition/reflection
 * Trigger a self-reflection session
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { reason, session_type: _session_type } = data;

    if (!reason) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Reason for reflection is required' 
        },
        { status: 400 }
      );
    }

    const metacognition = await getMetacognitionEngine();
    const session = await metacognition.triggerSelfReflection(reason);

    return NextResponse.json({
      success: true,
      session: session,
      message: `Self-reflection session completed`,
      insights_generated: session.analysis.learning_insights.length,
      recommendations: session.analysis.improvement_recommendations.length
    });

  } catch (error) {
    console.error('[Metacognition API] Error triggering reflection:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to trigger reflection session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
