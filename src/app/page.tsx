'use client';

import { useState, useEffect } from 'react';
import Dashboard from '@/components/Dashboard';
import SystemStatus from '@/components/SystemStatus';
import BrainInterface from '@/components/BrainInterface';
import InteractionInterface from '@/components/InteractionInterface';
import AgentManager from '@/components/AgentManager';
import EmotionDisplay from '@/components/EmotionDisplay';
import ModelSelectorNew from '@/components/ModelSelectorNew';
import OllamaTest from '@/components/MainSettings';
import MemoryDashboard from '@/components/MemoryDashboard';
import { Brain, Cpu, Users, Heart, Settings, BarChart3, Database, MessageCircle, Zap, Eye, ChevronDown, Dna, Cog } from 'lucide-react';
import dynamic from 'next/dynamic';
import AgentOrchestrationDashboard from '@/components/AgentOrchestrationDashboard';
import ThoughtStreamPage from '@/components/ThoughtStream'; 
import AISelfModificationPage from '@/components/SelfModificationDashboard';
import ModelSettingsPage from '@/components/ModelSettingsPage';


export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [brainConversationData, setBrainConversationData] = useState<any>(null);
  const [showMoreInfoDropdown, setShowMoreInfoDropdown] = useState(false);

  useEffect(() => {
    // Load initial system status
    fetchSystemStatus();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchSystemStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle autonomous thinking pause/resume based on active tab
  useEffect(() => {
    const handleAutonomousThinking = async () => {
      try {
        const action = activeTab === 'brain' ? 'pause' : 'resume';
        const reason = activeTab === 'brain' ? 'user_in_brain_interface' : 'user_left_brain_interface';
        const force = activeTab === 'brain'; // Force disable when entering brain interface
        
        await fetch('/api/autonomous/pause', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, reason, force })
        });

        // Also notify the autonomous system about page change
        if (activeTab) {
          await fetch('/api/autonomous/page-change', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              page: activeTab,
              path: `/${activeTab}` 
            })
          });
        }

        console.log(`[UI] Autonomous thinking ${action}d${force ? ' (forced)' : ''} due to: ${reason}`);

        // Clear brain conversation data when leaving brain interface
        if (activeTab !== 'brain') {
          setBrainConversationData(null);
        }
      } catch (error) {
        console.error('Failed to control autonomous thinking:', error);
      }
    };

    handleAutonomousThinking();
  }, [activeTab]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMoreInfoDropdown) {
        setShowMoreInfoDropdown(false);
      }
    };
    
    if (showMoreInfoDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMoreInfoDropdown]);

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

  const handleNavigateToBrain = (conversationData: any) => {
    setBrainConversationData(conversationData);
    setActiveTab('brain');
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'brain', name: 'Brain Interface', icon: Brain },
    { id: 'interaction', name: 'Interaction', icon: MessageCircle },
    { id: 'aiselfmodification', name: 'AI Self-Modification', icon: Dna },
    { id: 'agents', name: 'Agent Manager', icon: Users },
    { id: 'emotions', name: 'Emotion Engine', icon: Heart },
    { id: 'system', name: 'System Status', icon: Cpu },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const moreInfoTabs = [
    { id: 'memory', name: 'Memory Analytics', icon: Database },
    { id: 'orchestration', name: 'Orchestration', icon: Zap },
    { id: 'thoughtstream', name: 'Thought Stream', icon: Eye },
    { id: 'modelsettings', name: 'Model Settings', icon: Cog }
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
                <h1 className="text-2xl font-bold text-white">Project Aware</h1>
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
                  {systemStatus.identity?.name || 'Project Aware'}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-black/10 backdrop-blur-sm border-b border-white/5 relative z-50">
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
            
            {/* More Info Dropdown */}
            <div className="relative z-[100]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoreInfoDropdown(!showMoreInfoDropdown);
                }}
                className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors flex items-center space-x-2 ${
                  moreInfoTabs.some(tab => tab.id === activeTab)
                    ? 'bg-white/10 text-white border-b-2 border-purple-400'
                    : 'text-purple-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>More Info</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showMoreInfoDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showMoreInfoDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-black/95 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl min-w-48 z-[200]">
                  {moreInfoTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab(tab.id);
                          setShowMoreInfoDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-sm font-medium transition-colors flex items-center space-x-2 text-left first:rounded-t-lg last:rounded-b-lg ${
                          activeTab === tab.id
                            ? 'bg-purple-500/30 text-white'
                            : 'text-purple-300 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {activeTab === 'dashboard' && <Dashboard systemStatus={systemStatus} />}
        {activeTab === 'brain' && <BrainInterface initialConversationData={brainConversationData} />}
        {activeTab === 'interaction' && <InteractionInterface onNavigateToBrain={handleNavigateToBrain} />}
        {activeTab === 'aiselfmodification' && <AISelfModificationPage />}
        {activeTab === 'agents' && <AgentManager />}
        {activeTab === 'emotions' && <EmotionDisplay />}
        {activeTab === 'memory' && <MemoryDashboard />}
        {activeTab === 'orchestration' && <AgentOrchestrationDashboard />}
        {activeTab === 'thoughtstream' && <ThoughtStreamPage />}
        {activeTab === 'modelsettings' && <ModelSettingsPage />}
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
