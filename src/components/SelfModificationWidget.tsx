'use client';

import React, { useState, useEffect } from 'react';
import { Settings, AlertTriangle, CheckCircle, Clock, Shield } from 'lucide-react';

interface SelfModificationStatus {
  engine_active: boolean;
  pending_modifications: any[];
  safety_metrics: {
    modifications_today: number;
    success_rate: number;
    rollback_count: number;
  };
}

export default function SelfModificationWidget() {
  const [status, setStatus] = useState<SelfModificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/self-modification?action=status');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStatus(data.status);
        }
      }
    } catch (error) {
      console.error('Error loading self-modification status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <div className="flex items-center space-x-2">
          <Settings className="w-4 h-4 text-gray-400 animate-spin" />
          <span className="text-gray-400 text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-red-900/20 backdrop-blur-sm rounded-xl p-4 border border-red-700/50">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-red-400 text-sm">Self-Modification Offline</span>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    if (!status.engine_active) return 'text-red-400';
    if (status.pending_modifications.length > 0) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusIcon = () => {
    if (!status.engine_active) return AlertTriangle;
    if (status.pending_modifications.length > 0) return Clock;
    return CheckCircle;
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/30">
            <Settings className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h3 className="text-white text-sm font-semibold">Self-Modification</h3>
            <div className="flex items-center space-x-2">
              <StatusIcon className={`w-3 h-3 ${getStatusColor()}`} />
              <span className={`text-xs ${getStatusColor()}`}>
                {status.engine_active 
                  ? status.pending_modifications.length > 0 
                    ? `${status.pending_modifications.length} pending`
                    : 'Active & Monitoring'
                  : 'Disabled'
                }
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center space-x-3 text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>{status.safety_metrics.modifications_today}/3</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span>{(status.safety_metrics.success_rate * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
