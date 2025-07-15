import { NextResponse } from 'next/server';
import { getGoalEngine } from '@/lib/shared/instances';

export async function GET() {
  try {
    const goalEngine = getGoalEngine();
    const queue = await goalEngine.getPriorityQueue();
    
    return NextResponse.json({
      success: true,
      data: queue
    });
  } catch (error) {
    console.error('Error getting priority queue:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get priority queue' },
      { status: 500 }
    );
  }
}
