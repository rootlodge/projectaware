'use client';

import { useState, useEffect } from 'react';
import Dashboard from '@/components/Dashboard';
import { Brain, Cpu, Users, Heart, Settings, BarChart3, Database, MessageCircle, Zap, Eye, ChevronDown, Dna, Cog, HardDrive } from 'lucide-react';
import dynamic from 'next/dynamic';


export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');;
  const [showMoreInfoDropdown, setShowMoreInfoDropdown] = useState(false);

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

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'system', name: 'System Status', icon: Cpu },
  ];

  const moreInfoTabs = [
    { id: 'comingsoon', name: 'comingsoon', icon: Cog }
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
        {activeTab === 'dashboard' && <Dashboard />}
      </main>
    </div>
  );
}
