'use client';

import { useState, useEffect } from 'react';
import Dashboard from '@/components/Dashboard';
import SystemStatus from '@/components/SystemStatus';
import BrainInterface from '@/components/BrainInterface';
import AgentManager from '@/components/AgentManager';
import EmotionDisplay from '@/components/EmotionDisplay';
import ModelSelectorNew from '@/components/ModelSelectorNew';
import OllamaTest from '@/components/OllamaTest';
import { Brain, Cpu, Users, Heart, Settings, BarChart3 } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [systemStatus, setSystemStatus] = useState<any>(null);

  useEffect(() => {
    // Load initial system status
    fetchSystemStatus();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchSystemStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/brain');
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'brain', name: 'Brain Interface', icon: Brain },
    { id: 'agents', name: 'Agent Manager', icon: Users },
    { id: 'emotions', name: 'Emotion Engine', icon: Heart },
    { id: 'system', name: 'System Status', icon: Cpu },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Neversleep.AI</h1>
                <p className="text-purple-300 text-sm">Advanced AI Dashboard</p>
              </div>
            </div>
            
            {systemStatus && (
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white">System Active</span>
                </div>
                <div className="text-purple-300">
                  {systemStatus.identity?.name || 'Neversleep'}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-black/10 backdrop-blur-sm border-b border-white/5">
        <div className="container mx-auto px-6">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white border-b-2 border-purple-400'
                      : 'text-purple-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {activeTab === 'dashboard' && <Dashboard systemStatus={systemStatus} />}
        {activeTab === 'brain' && <BrainInterface />}
        {activeTab === 'agents' && <AgentManager />}
        {activeTab === 'emotions' && <EmotionDisplay />}
        {activeTab === 'system' && <SystemStatus />}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
              
              {/* Ollama Test Section */}
              <div className="mb-8">
                <OllamaTest />
              </div>
              
              {/* Model Selection Section */}
              <ModelSelectorNew onModelChange={(model: string) => {
                console.log('Model changed to:', model);
                // Optionally trigger a system status refresh
                fetchSystemStatus();
              }} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
