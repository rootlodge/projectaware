import { NextRequest, NextResponse } from 'next/server';
import { getGoalEngine } from '@/lib/shared/instances';

export async function GET() {
  try {
    const goalEngine = getGoalEngine();
    const status = goalEngine.getStatus();
    
    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting goal engine status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get goal engine status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, content, context, goalId, progress } = await request.json();
    const goalEngine = getGoalEngine();
    
    let result;
    
    switch (action) {
      case 'analyze_and_create':
        result = await goalEngine.analyzeAndCreateGoals();
        break;
      case 'process_next':
        result = await goalEngine.processNextGoal();
        break;
      case 'log_user_interaction':
        if (content) {
          await goalEngine.logUserInteraction(content, context);
          result = { success: true };
        }
        break;
      case 'update_progress':
        if (goalId && typeof progress === 'number') {
          await goalEngine.updateGoalProgress(goalId, progress);
          result = { success: true };
        } else {
          return NextResponse.json(
            { success: false, error: 'goalId and progress are required for update_progress' },
            { status: 400 }
          );
        }
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error executing goal engine action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute action' },
      { status: 500 }
    );
  }
}
