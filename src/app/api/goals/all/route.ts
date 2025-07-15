import { NextResponse } from 'next/server';
import { getGoalEngine } from '@/lib/shared/instances';

export async function GET() {
  try {
    const goalEngine = getGoalEngine();
    const goals = await goalEngine.getAllGoals();
    
    return NextResponse.json({
      success: true,
      data: goals
    });
  } catch (error) {
    console.error('Error getting all goals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get all goals' },
      { status: 500 }
    );
  }
}
