import { NextRequest, NextResponse } from 'next/server';
import { thoughtStream } from '@/lib/shared/instances';

export async function GET(request: NextRequest) {
  try {
    // Get all events from the thought stream
    const events = thoughtStream.getEvents();
    
    // Generate analytics data
    const analytics = {
      totalEvents: events.length,
      sessionDuration: Date.now() - (events[0]?.timestamp ? new Date(events[0].timestamp).getTime() : Date.now()),
      averageConfidence: events.length > 0 
        ? events.reduce((sum, event) => sum + (event.confidence || 0), 0) / events.length 
        : 0,
      eventsByType: events.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      eventsByPriority: events.reduce((acc, event) => {
        const priority = event.details?.priority || 'medium';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentActivity: generateRecentActivity(events)
    };

    return NextResponse.json({
      success: true,
      events,
      analytics
    });
  } catch (error) {
    console.error('Error fetching thought stream data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

function generateRecentActivity(events: any[]) {
  const now = Date.now();
  const buckets = [];
  
  // Create 10 buckets of 30 seconds each (last 5 minutes)
  for (let i = 9; i >= 0; i--) {
    const bucketStart = now - (i + 1) * 30000;
    const bucketEnd = now - i * 30000;
    
    const count = events.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime >= bucketStart && eventTime < bucketEnd;
    }).length;
    
    buckets.push({
      timestamp: bucketEnd,
      count
    });
  }
  
  return buckets;
}
