import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SystemStatus {
  timestamp: number;
  state: any;
  emotion: any;
}

interface EmotionUpdate {
  timestamp: number;
  emotion: any;
  history: any[];
}

export const useRealTime = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [emotionUpdate, setEmotionUpdate] = useState<EmotionUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io({
      path: '/api/socketio',
    });

    socketInstance.on('connect', () => {
      console.log('Connected to real-time server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from real-time server');
      setIsConnected(false);
    });

    socketInstance.on('system:status', (data: SystemStatus) => {
      setSystemStatus(data);
    });

    socketInstance.on('emotion:update', (data: EmotionUpdate) => {
      setEmotionUpdate(data);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const requestSystemStatus = () => {
    if (socket) {
      socket.emit('request:system_status');
    }
  };

  const requestEmotionUpdate = () => {
    if (socket) {
      socket.emit('request:emotion_update');
    }
  };

  return {
    socket,
    systemStatus,
    emotionUpdate,
    isConnected,
    requestSystemStatus,
    requestEmotionUpdate,
  };
};

export default useRealTime;
