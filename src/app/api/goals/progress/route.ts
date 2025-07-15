import { NextRequest, NextResponse } from 'next/server';
import { getGoalEngine } from '@/lib/shared/instances';

export async function POST(request: NextRequest) {
  try {
    const { goalId, progress } = await request.json();
    
    if (!goalId || typeof progress !== 'number') {
      return NextResponse.json(
        { success: false, error: 'goalId and progress are required' },
        { status: 400 }
      );
    }
    
    const goalEngine = getGoalEngine();
    await goalEngine.updateGoalProgress(goalId, progress);
    
    return NextResponse.json({
      success: true,
      message: 'Goal progress updated successfully'
    });
  } catch (error) {
    console.error('Error updating goal progress:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update goal progress' },
      { status: 500 }
    );
  }
}
