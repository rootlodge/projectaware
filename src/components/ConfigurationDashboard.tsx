'use client';

import React, { useState } from 'react';
import ConfigurationStatus from '@/components/ConfigurationStatus';
import ConfigurationManager from '@/components/ConfigurationManager';
import { 
  Settings, 
  Database, 
  Zap, 
  FileText, 
  Shield,
  Activity,
  Cog
} from 'lucide-react';

type TabType = 'overview' | 'manage' | 'status' | 'advanced';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const tabs: Tab[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Activity,
    description: 'Configuration status and quick actions'
  },
  {
    id: 'manage',
    label: 'Manage',
    icon: Settings,
    description: 'Edit and manage configuration settings'
  },
  {
    id: 'status',
    label: 'System Status',
    icon: Shield,
    description: 'View system status and health metrics'
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: Cog,
    description: 'Advanced configuration options'
  }
];

export default function ConfigurationDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <ConfigurationStatus />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="flex items-center space-x-3 mb-4">
                  <Database className="w-6 h-6 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Database Config</h3>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  Configuration stored in database for persistence and real-time updates.
                </p>
                <div className="flex items-center space-x-2 text-green-400 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Connected</span>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="flex items-center space-x-3 mb-4">
                  <Zap className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-white">TypeScript Config</h3>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  Type-safe configuration with validation and IntelliSense support.
                </p>
                <div className="flex items-center space-x-2 text-green-400 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Active</span>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="flex items-center space-x-3 mb-4">
                  <FileText className="w-6 h-6 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Migration Ready</h3>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  Automatic migration from environment variables and JSON files.
                </p>
                <div className="flex items-center space-x-2 text-blue-400 text-sm">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Available</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('manage')}
                  className="p-4 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 rounded-lg transition-colors text-left"
                >
                  <Settings className="w-6 h-6 text-purple-400 mb-2" />
                  <div className="text-white font-medium">Manage Settings</div>
                  <div className="text-gray-300 text-sm">Edit configuration</div>
                </button>

                <button
                  onClick={() => window.open('/migration', '_blank')}
                  className="p-4 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/50 rounded-lg transition-colors text-left"
                >
                  <Zap className="w-6 h-6 text-yellow-400 mb-2" />
                  <div className="text-white font-medium">Run Migration</div>
                  <div className="text-gray-300 text-sm">Migrate from env vars</div>
                </button>

                <button
                  onClick={() => setActiveTab('status')}
                  className="p-4 bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 rounded-lg transition-colors text-left"
                >
                  <Shield className="w-6 h-6 text-green-400 mb-2" />
                  <div className="text-white font-medium">System Status</div>
                  <div className="text-gray-300 text-sm">Check health</div>
                </button>

                <button
                  onClick={() => setActiveTab('advanced')}
                  className="p-4 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded-lg transition-colors text-left"
                >
                  <Cog className="w-6 h-6 text-blue-400 mb-2" />
                  <div className="text-white font-medium">Advanced</div>
                  <div className="text-gray-300 text-sm">Advanced options</div>
                </button>
              </div>
            </div>
          </div>
        );

      case 'manage':
        return <ConfigurationManager />;

      case 'status':
        return (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-300">✓</div>
                  <div className="text-sm text-green-200">Configuration</div>
                </div>
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-300">✓</div>
                  <div className="text-sm text-green-200">Database</div>
                </div>
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-300">✓</div>
                  <div className="text-sm text-green-200">Memory System</div>
                </div>
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-300">✓</div>
                  <div className="text-sm text-green-200">API</div>
                </div>
              </div>
            </div>

            <ConfigurationStatus />
          </div>
        );

      case 'advanced':
        return (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Advanced Configuration</h3>
              <p className="text-gray-300 mb-6">
                Advanced configuration options for power users and developers.
              </p>

              <div className="space-y-4">
                <div className="border border-gray-600 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Environment Variables</h4>
                  <p className="text-gray-300 text-sm mb-3">
                    Essential environment variables that are still needed:
                  </p>
                  <div className="bg-gray-800 rounded p-3 font-mono text-sm text-gray-300">
                    <div>PORT=3000</div>
                    <div>NODE_ENV=development</div>
                    <div>OLLAMA_URL=http://localhost:11434</div>
                    <div>DATABASE_URL=sqlite:./data/neversleep.db</div>
                  </div>
                </div>

                <div className="border border-gray-600 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Configuration Schema</h4>
                  <p className="text-gray-300 text-sm mb-3">
                    TypeScript interfaces define the configuration structure:
                  </p>
                  <div className="bg-gray-800 rounded p-3 font-mono text-sm text-gray-300">
                    <div>- OnboardingConfig: User onboarding flow</div>
                    <div>- AuthConfig: Authentication settings</div>
                    <div>- SystemConfig: Core system configuration</div>
                    <div>- UIConfig: User interface preferences</div>
                    <div>- SecurityConfig: Security settings</div>
                    <div>- PerformanceConfig: Performance tuning</div>
                    <div>- NotificationConfig: Notification preferences</div>
                    <div>- BackupConfig: Backup and recovery</div>
                  </div>
                </div>

                <div className="border border-gray-600 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Database Storage</h4>
                  <p className="text-gray-300 text-sm mb-3">
                    Configuration is stored in the database for persistence and real-time updates.
                    Uses the existing MemorySystem with the configuration_summaries table.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Configuration Dashboard</h1>
          <p className="text-gray-300">
            Manage your application configuration with the new TypeScript system
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white/5 backdrop-blur-sm rounded-lg p-1 border border-white/10">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md transition-colors ${
                    isActive
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                  title={tab.description}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="relative">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
