import { NextRequest, NextResponse } from 'next/server';
import { getGoalEngine } from '@/lib/shared/instances';

export async function GET() {
  try {
    const goalEngine = getGoalEngine();
    const metrics = await goalEngine.getGoalMetrics();
    
    return NextResponse.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error getting goal metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get goal metrics' },
      { status: 500 }
    );
  }
}
