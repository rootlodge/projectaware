import { NextRequest } from 'next/server';
import { ThoughtStream } from '@/lib/core/ThoughtStream';

export async function GET(request: NextRequest) {
  const thoughtStream = ThoughtStream.getInstance();
  
  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      try {
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
      } catch (error) {
        console.error('Error sending initial SSE data:', error);
        controller.close();
        return;
      }
      
      // Listen for new thought events
      const thoughtListener = (event: any) => {
        try {
          if (controller.desiredSize !== null) { // Check if controller is still open
            const message = `data: ${JSON.stringify({
              type: 'event',
              event: event
            })}\n\n`;
            controller.enqueue(encoder.encode(message));
          }
        } catch (error) {
          console.error('Error sending thought event:', error);
          // Remove listeners if controller is closed
          thoughtStream.off('thought', thoughtListener);
          thoughtStream.off('thought', analyticsListener);
        }
      };
      
      // Listen for analytics updates
      const analyticsListener = () => {
        try {
          if (controller.desiredSize !== null) { // Check if controller is still open
            const analytics = thoughtStream.getAnalytics();
            const message = `data: ${JSON.stringify({
              type: 'analytics',
              analytics: analytics
            })}\n\n`;
            controller.enqueue(encoder.encode(message));
          }
        } catch (error) {
          console.error('Error sending analytics update:', error);
          // Remove listeners if controller is closed
          thoughtStream.off('thought', thoughtListener);
          thoughtStream.off('thought', analyticsListener);
        }
      };
      
      // Listen for recording state changes
      const recordingListener = (isRecording: boolean) => {
        try {
          if (controller.desiredSize !== null) { // Check if controller is still open
            const message = `data: ${JSON.stringify({
              type: 'recording-changed',
              recording: isRecording
            })}\n\n`;
            controller.enqueue(encoder.encode(message));
          }
        } catch (error) {
          console.error('Error sending recording state change:', error);
          // Remove listener if controller is closed
          thoughtStream.off('recording-changed', recordingListener);
        }
      };
      
      thoughtStream.on('thought', thoughtListener);
      thoughtStream.on('thought', analyticsListener); // Update analytics on new events
      thoughtStream.on('recording-changed', recordingListener);
      
      // Send periodic analytics updates
      const analyticsInterval = setInterval(() => {
        try {
          if (controller.desiredSize !== null) { // Check if controller is still open
            analyticsListener();
          } else {
            clearInterval(analyticsInterval);
          }
        } catch (error) {
          console.error('Error in analytics interval:', error);
          clearInterval(analyticsInterval);
        }
      }, 30000); // Every 30 seconds
      
      // Keep connection alive with heartbeat
      const heartbeatInterval = setInterval(() => {
        try {
          if (controller.desiredSize !== null) { // Check if controller is still open
            const heartbeat = `: heartbeat\n\n`;
            controller.enqueue(encoder.encode(heartbeat));
          } else {
            clearInterval(heartbeatInterval);
          }
        } catch (error) {
          console.error('Error in heartbeat:', error);
          clearInterval(heartbeatInterval);
        }
      }, 15000); // Every 15 seconds
      
      // Clean up on close
      request.signal.addEventListener('abort', () => {
        console.log('SSE connection aborted, cleaning up listeners');
        thoughtStream.off('thought', thoughtListener);
        thoughtStream.off('thought', analyticsListener);
        thoughtStream.off('recording-changed', recordingListener);
        clearInterval(analyticsInterval);
        clearInterval(heartbeatInterval);
        try {
          if (controller.desiredSize !== null) {
            controller.close();
          }
        } catch (error) {
          console.error('Error closing controller:', error);
        }
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
