import { NextRequest, NextResponse } from 'next/server';
import { getGoalEngine } from '@/lib/shared/instances';

export async function GET() {
  try {
    const goalEngine = getGoalEngine();
    const activeGoal = await goalEngine.getActiveGoal();
    
    return NextResponse.json({
      success: true,
      data: activeGoal
    });
  } catch (error) {
    console.error('Error getting active goal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get active goal' },
      { status: 500 }
    );
  }
}
