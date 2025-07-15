'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  Database,
  Zap
} from 'lucide-react';

interface ConfigStatus {
  configurationValid: boolean;
  issueCount: number;
  suggestionCount: number;
  migrationAvailable: boolean;
}

export default function ConfigurationStatus() {
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkMigrationStatus();
  }, []);

  const checkMigrationStatus = async () => {
    try {
      const response = await fetch('/api/config/migrate');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to check migration status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-600 rounded w-1/3 mb-4"></div>
          <div className="h-3 bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const needsMigration = status && (!status.configurationValid || status.issueCount > 0);

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Settings className="w-6 h-6 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Configuration Status</h3>
        </div>
        
        {status && (
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            needsMigration 
              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
              : 'bg-green-500/20 text-green-300 border border-green-500/50'
          }`}>
            {needsMigration ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            <span>
              {needsMigration ? 'Migration Recommended' : 'Configuration Valid'}
            </span>
          </div>
        )}
      </div>

      {status && (
        <div className="space-y-4">
          {needsMigration && (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-300 mb-2">Migration Available</h4>
              <p className="text-yellow-200 text-sm mb-3">
                {status.issueCount > 0 
                  ? `Found ${status.issueCount} configuration issues that can be resolved by migrating to the new TypeScript configuration system.`
                  : "A new TypeScript configuration system is available with improved features and database persistence."
                }
              </p>
              
              <div className="flex space-x-3">
                <Link
                  href="/migration"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm"
                >
                  <Zap className="w-4 h-4" />
                  <span>Start Migration</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
                
                <Link
                  href="/config"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                >
                  <Settings className="w-4 h-4" />
                  <span>Manage Config</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {!needsMigration && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
              <h4 className="font-semibold text-green-300 mb-2">Configuration Ready</h4>
              <p className="text-green-200 text-sm mb-3">
                Your configuration system is up to date and working properly.
              </p>
              
              <Link
                href="/config"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
              >
                <Database className="w-4 h-4" />
                <span>Manage Configuration</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{status.issueCount}</div>
              <div className="text-xs text-gray-400">Issues</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{status.suggestionCount}</div>
              <div className="text-xs text-gray-400">Suggestions</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className={`text-2xl font-bold ${status.configurationValid ? 'text-green-400' : 'text-yellow-400'}`}>
                {status.configurationValid ? '✓' : '⚠'}
              </div>
              <div className="text-xs text-gray-400">Status</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
