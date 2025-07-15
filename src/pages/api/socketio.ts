import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { StateManager } from '@/lib/core/StateManager';
import { EmotionEngine } from '@/lib/systems/EmotionEngine';

export interface NextApiResponseServerIO extends NextApiResponse {
  socket: NextApiResponse['socket'] & {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
}

const stateManager = new StateManager();
const emotionEngine = new EmotionEngine(stateManager);

let lastEmitTime = 0;
const EMIT_THROTTLE = 1000; // Emit updates max once per second

export default function SocketHandler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (res.socket.server.io) {
    console.log('Socket.IO already running');
  } else {
    console.log('Initializing Socket.IO server');
    
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socketio',
      addTrailingSlash: false,
    });
    
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      // Send initial system state
      socket.emit('system:status', {
        timestamp: Date.now(),
        state: stateManager.getState(),
        emotion: emotionEngine.getCurrentEmotion()
      });

      // Handle client requests for updates
      socket.on('request:system_status', () => {
        socket.emit('system:status', {
          timestamp: Date.now(),
          state: stateManager.getState(),
          emotion: emotionEngine.getCurrentEmotion()
        });
      });

      socket.on('request:emotion_update', () => {
        socket.emit('emotion:update', {
          timestamp: Date.now(),
          emotion: emotionEngine.getCurrentEmotion(),
          history: emotionEngine.getEmotionHistory().slice(-10)
        });
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    // Set up periodic updates
    setInterval(() => {
      const now = Date.now();
      if (now - lastEmitTime >= EMIT_THROTTLE) {
        io.emit('system:status', {
          timestamp: now,
          state: stateManager.getState(),
          emotion: emotionEngine.getCurrentEmotion()
        });
        
        io.emit('emotion:update', {
          timestamp: now,
          emotion: emotionEngine.getCurrentEmotion(),
          history: emotionEngine.getEmotionHistory().slice(-10)
        });
        
        lastEmitTime = now;
      }
    }, 5000); // Check every 5 seconds
  }
  
  res.end();
}

export const config = {
  api: {
    bodyParser: false,
  },
};
