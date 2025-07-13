import { NextRequest } from 'next/server';
import { ThoughtStream } from '@/lib/core/ThoughtStream';

export async function GET(request: NextRequest) {
  const thoughtStream = ThoughtStream.getInstance();
  
  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial history
      const history = thoughtStream.getHistory();
      const historyMessage = `data: ${JSON.stringify({
        type: 'history',
        events: history
      })}\n\n`;
      controller.enqueue(encoder.encode(historyMessage));
      
      // Send initial analytics
      const analytics = thoughtStream.getAnalytics();
      const analyticsMessage = `data: ${JSON.stringify({
        type: 'analytics',
        analytics: analytics
      })}\n\n`;
      controller.enqueue(encoder.encode(analyticsMessage));
      
      // Listen for new thought events
      const thoughtListener = (event: any) => {
        const message = `data: ${JSON.stringify({
          type: 'event',
          event: event
        })}\n\n`;
        controller.enqueue(encoder.encode(message));
      };
      
      // Listen for analytics updates
      const analyticsListener = () => {
        const analytics = thoughtStream.getAnalytics();
        const message = `data: ${JSON.stringify({
          type: 'analytics',
          analytics: analytics
        })}\n\n`;
        controller.enqueue(encoder.encode(message));
      };
      
      // Listen for recording state changes
      const recordingListener = (isRecording: boolean) => {
        const message = `data: ${JSON.stringify({
          type: 'recording-changed',
          isRecording: isRecording
        })}\n\n`;
        controller.enqueue(encoder.encode(message));
      };
      
      thoughtStream.on('thought', thoughtListener);
      thoughtStream.on('thought', analyticsListener); // Update analytics on new events
      thoughtStream.on('recording-changed', recordingListener);
      
      // Send periodic analytics updates
      const analyticsInterval = setInterval(() => {
        analyticsListener();
      }, 30000); // Every 30 seconds
      
      // Keep connection alive with heartbeat
      const heartbeatInterval = setInterval(() => {
        const heartbeat = `: heartbeat\n\n`;
        controller.enqueue(encoder.encode(heartbeat));
      }, 15000); // Every 15 seconds
      
      // Clean up on close
      request.signal.addEventListener('abort', () => {
        thoughtStream.off('thought', thoughtListener);
        thoughtStream.off('recording-changed', recordingListener);
        clearInterval(analyticsInterval);
        clearInterval(heartbeatInterval);
        controller.close();
      });
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}
