import { NextRequest } from 'next/server';
import { ThoughtStream } from '@/lib/core/ThoughtStream';

export async function POST(request: NextRequest) {
  try {
    const { recording } = await request.json();
    const thoughtStream = ThoughtStream.getInstance();
    
    thoughtStream.setRecording(recording);
    
    return Response.json({ 
      success: true, 
      recording: recording,
      message: `Recording ${recording ? 'enabled' : 'disabled'}`
    });
  } catch (error) {
    console.error('Error toggling recording:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to toggle recording' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const thoughtStream = ThoughtStream.getInstance();
    
    return Response.json({ 
      success: true, 
      recording: thoughtStream.getRecordingStatus()
    });
  } catch (error) {
    console.error('Error getting recording status:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to get recording status' 
    }, { status: 500 });
  }
}
