'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Database, Wifi, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface SystemMetrics {
  brain_status: 'active' | 'thinking' | 'idle' | 'error';
  memory_entries: number;
  agent_count: number;
  last_activity: string;
  ollama_status: 'connected' | 'disconnected' | 'error';
  emotion_state: string;
  processing_queue: number;
  uptime: number;
}

const SystemStatus: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    brain_status: 'idle',
    memory_entries: 0,
    agent_count: 0,
    last_activity: '',
    ollama_status: 'disconnected',
    emotion_state: 'neutral',
    processing_queue: 0,
    uptime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const response = await fetch('/api/system/status');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Failed to fetch system status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
        return 'text-green-500';
      case 'thinking':
      case 'processing':
        return 'text-yellow-500';
      case 'error':
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
        return <CheckCircle className="w-4 h-4" />;
      case 'thinking':
      case 'processing':
        return <Clock className="w-4 h-4 animate-spin" />;
      case 'error':
      case 'disconnected':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">System Status</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Activity className="w-5 h-5 mr-2" />
        System Status
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Brain Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="flex items-center">
            <Cpu className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Brain</span>
          </div>
          <div className={`flex items-center ${getStatusColor(metrics.brain_status)}`}>
            {getStatusIcon(metrics.brain_status)}
            <span className="ml-1 text-sm capitalize">{metrics.brain_status}</span>
          </div>
        </div>

        {/* Ollama Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="flex items-center">
            <Wifi className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Ollama</span>
          </div>
          <div className={`flex items-center ${getStatusColor(metrics.ollama_status)}`}>
            {getStatusIcon(metrics.ollama_status)}
            <span className="ml-1 text-sm capitalize">{metrics.ollama_status}</span>
          </div>
        </div>

        {/* Memory Entries */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="flex items-center">
            <Database className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Memory</span>
          </div>
          <span className="text-sm font-bold">{metrics.memory_entries.toLocaleString()}</span>
        </div>

        {/* Active Agents */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Agents</span>
          </div>
          <span className="text-sm font-bold">{metrics.agent_count}</span>
        </div>

        {/* Processing Queue */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Queue</span>
          </div>
          <span className="text-sm font-bold">{metrics.processing_queue}</span>
        </div>

        {/* Uptime */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Uptime</span>
          </div>
          <span className="text-sm font-bold">{formatUptime(metrics.uptime)}</span>
        </div>
      </div>

      {/* Current Emotion */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Current Emotion:</strong> {metrics.emotion_state}
        </div>
      </div>

      {/* Last Activity */}
      {metrics.last_activity && (
        <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded">
          <div className="text-sm text-green-800 dark:text-green-200">
            <strong>Last Activity:</strong> {metrics.last_activity}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemStatus;
