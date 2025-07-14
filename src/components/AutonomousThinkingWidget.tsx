'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Clock, Activity, Pause, Play, Settings, Minus, Plus } from 'lucide-react';

interface AutonomousThinkingStatus {
  is_thinking: boolean;
  time_since_activity: number;
  processing_efficiency: number;
  recent_thoughts: any[];
  throttle_config: {
    enabled: boolean;
    max_thoughts_per_minute: number;
    unlimited: boolean;
  };
}

export default function AutonomousThinkingWidget() {
  const [status, setStatus] = useState<AutonomousThinkingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [thoughtCount, setThoughtCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [tempThoughtsPerMinute, setTempThoughtsPerMinute] = useState(8);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (status?.throttle_config) {
      setTempThoughtsPerMinute(status.throttle_config.max_thoughts_per_minute);
    }
  }, [status]);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/autonomous/status');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStatus(data.data);
          setThoughtCount(data.data.recent_thoughts?.length || 0);
        }
      }
    } catch (error) {
      console.error('Error loading autonomous thinking status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateThrottleSettings = async () => {
    try {
      const response = await fetch('/api/autonomous/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_throttle',
          config: {
            thought_throttling: {
              max_thoughts_per_minute: tempThoughtsPerMinute
            }
          }
        })
      });

      if (response.ok) {
        await loadStatus(); // Reload status to show updated config
        setShowSettings(false);
      }
    } catch (error) {
      console.error('Error updating throttle settings:', error);
    }
  };

  const adjustThoughtsPerMinute = (delta: number) => {
    setTempThoughtsPerMinute(prev => Math.max(1, Math.min(60, prev + delta)));
  };

  const formatTimeAgo = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <div className="flex items-center space-x-2">
          <Brain className="w-4 h-4 text-gray-400 animate-pulse" />
          <span className="text-gray-400 text-sm">Loading autonomous thinking status...</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <div className="flex items-center space-x-2">
          <Brain className="w-4 h-4 text-red-400" />
          <span className="text-red-400 text-sm">Autonomous thinking unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Brain className="w-5 h-5 mr-2 text-blue-400" />
        Autonomous Thinking System
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Indicator */}
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-300 text-sm">Status</span>
            {status.is_thinking ? (
              <Activity className="w-4 h-4 text-green-400 animate-pulse" />
            ) : (
              <Pause className="w-4 h-4 text-yellow-400" />
            )}
          </div>
          <div className={`text-lg font-semibold ${status.is_thinking ? 'text-green-400' : 'text-yellow-400'}`}>
            {status.is_thinking ? 'Active' : 'Inactive'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Last activity: {formatTimeAgo(status.time_since_activity)}
          </div>
        </div>

        {/* Rate Limiting */}
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-300 text-sm">Rate Limit</span>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              <Settings className="w-4 h-4 text-purple-400" />
            </button>
          </div>
          <div className="text-lg font-semibold text-white">
            {status.throttle_config.unlimited 
              ? 'Unlimited' 
              : `${status.throttle_config.max_thoughts_per_minute}/min`}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {status.throttle_config.enabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>

        {/* Performance */}
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-300 text-sm">Efficiency</span>
            <Clock className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-lg font-semibold text-orange-400">
            {(status.processing_efficiency * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Recent thoughts: {thoughtCount}
          </div>
        </div>
      </div>

      {/* Recent Thoughts Preview */}
      {status.recent_thoughts && status.recent_thoughts.length > 0 && (
        <div className="mt-4 bg-white/5 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-2">Recent Autonomous Activity</h4>
          <div className="space-y-2 max-h-24 overflow-y-auto">
            {status.recent_thoughts.slice(0, 3).map((thought, index) => (
              <div key={index} className="text-xs text-gray-300 truncate">
                <span className="text-purple-400">{new Date(thought.timestamp).toLocaleTimeString()}</span>
                {' - '}
                <span>{thought.content.substring(0, 60)}...</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="mt-4 bg-white/5 rounded-lg p-4 border border-purple-500/30">
          <h4 className="text-sm font-semibold text-white mb-3">Rate Limit Settings</h4>
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-purple-300 text-sm">Thoughts per minute:</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => adjustThoughtsPerMinute(-1)}
                className="p-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Minus className="w-3 h-3 text-white" />
              </button>
              <span className="text-white font-semibold w-8 text-center">{tempThoughtsPerMinute}</span>
              <button
                onClick={() => adjustThoughtsPerMinute(1)}
                className="p-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Plus className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={updateThrottleSettings}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-2 rounded transition-colors"
            >
              Apply
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm px-3 py-2 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
