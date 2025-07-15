import { NextRequest, NextResponse } from 'next/server';
import { ThoughtStream } from '@/lib/core/ThoughtStream';

export async function GET(request: NextRequest) {
  try {
    const thoughtStream = ThoughtStream.getInstance();
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const confidenceMin = searchParams.get('confidenceMin');
    const confidenceMax = searchParams.get('confidenceMax');
    const since = searchParams.get('since'); // For incremental updates
    
    // Build filters object
    const filters: any = {};
    
    if (type && type !== 'all') {
      filters.type = type;
    }
    
    if (priority && priority !== 'all') {
      filters.priority = priority;
    }
    
    if (confidenceMin || confidenceMax) {
      filters.confidence = {
        min: confidenceMin ? parseFloat(confidenceMin) : 0,
        max: confidenceMax ? parseFloat(confidenceMax) : 1
      };
    }
    
    // Add timestamp filter for incremental updates
    if (since) {
      filters.since = since;
    }
    
    // Get filtered events and analytics
    const events = thoughtStream.getHistory(filters);
    const analytics = thoughtStream.getAnalytics();
    const isRecording = thoughtStream.getRecordingStatus();
    
    return NextResponse.json({
      success: true,
      events,
      analytics,
      isRecording,
      timestamp: new Date().toISOString(),
      isIncremental: !!since
    });
    
  } catch (error) {
    console.error('Error fetching thought stream data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch thought stream data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const thoughtStream = ThoughtStream.getInstance();
    
    // Handle different POST actions
    if (body.action === 'toggle-recording') {
      const newState = !thoughtStream.getRecordingStatus();
      thoughtStream.setRecording(newState);
      
      return NextResponse.json({
        success: true,
        recording: newState,
        message: `Recording ${newState ? 'started' : 'stopped'}`
      });
    }
    
    if (body.action === 'clear-history') {
      thoughtStream.clearHistory();
      
      return NextResponse.json({
        success: true,
        message: 'History cleared'
      });
    }
    
    if (body.action === 'add-event' && body.event) {
      thoughtStream.log(body.event);
      
      return NextResponse.json({
        success: true,
        message: 'Event added to thought stream'
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error handling thought stream POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}