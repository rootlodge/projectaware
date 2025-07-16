'use client';

import { useState, useEffect } from 'react';
import Dashboard from '@/components/Dashboard';
import AuthModal from '@/components/AuthModal';
import OnboardingFlow from '@/components/OnboardingFlow';
import { Brain, Cpu, Users, Settings, BarChart3, ChevronDown, Cog, LogOut, User } from 'lucide-react';
import dynamic from 'next/dynamic';

interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: string;
  displayName?: string;
  created_at?: string;
}


export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMoreInfoDropdown, setShowMoreInfoDropdown] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMoreInfoDropdown) {
        setShowMoreInfoDropdown(false);
      }
      if (showUserDropdown) {
        setShowUserDropdown(false);
      }
    };
    
    if (showMoreInfoDropdown || showUserDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMoreInfoDropdown, showUserDropdown]);

  // Check for existing auth token on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // In a real app, you'd verify the token with the server
      // For now, we'll just check if it exists
      fetchUserProfile(token);
    }
  }, []);

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUser(result.data);
        }
      } else {
        // Token might be expired
        localStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      localStorage.removeItem('auth_token');
    }
  };

  const handleAuthSuccess = (userData: AuthUser) => {
    setUser(userData);
    setShowAuthModal(false);
    
    // Check if user needs onboarding (new users)
    const userCreatedAt = new Date(userData.created_at || Date.now());
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    if (userCreatedAt > oneDayAgo) {
      setShowOnboarding(true);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      localStorage.removeItem('auth_token');
      setUser(null);
      setShowUserDropdown(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const initializeDatabase = async () => {
    try {
      const response = await fetch('/api/database/init', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        alert('Database initialized successfully!');
      } else {
        alert(`Database initialization failed: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to initialize database');
    }
  };

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
            
            {/* User Authentication Section */}
            <div className="flex items-center gap-4">
              {user ? (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUserDropdown(!showUserDropdown);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span className="text-sm font-medium">{user.displayName || user.email}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                      <div className="p-4 border-b border-gray-700">
                        <p className="text-sm font-medium text-white">{user.displayName || 'User'}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${user.role === 'admin' ? 'bg-red-500' : user.role === 'developer' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                          <span className="text-xs text-gray-400 capitalize">{user.role}</span>
                        </div>
                      </div>
                      <div className="py-2">
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors">
                          Profile Settings
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors">
                          Change Password
                        </button>
                        {user.role === 'admin' && (
                          <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors">
                            Admin Panel
                          </button>
                        )}
                      </div>
                      <div className="border-t border-gray-700 py-2">
                        <button
                          onClick={handleSignOut}
                          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Sign In
                </button>
              )}
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
        {/* Development Tools Section - Only show for admins */}
        {user && user.role === 'admin' && (
          <div className="mb-8 p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Development Tools</h2>
            <div className="flex gap-4">
              <button
                onClick={initializeDatabase}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                Initialize Database
              </button>
              <button
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors font-medium"
                onClick={() => alert('Migration tools coming soon!')}
              >
                Run Migrations
              </button>
              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                onClick={() => alert('Backup tools coming soon!')}
              >
                Backup Database
              </button>
            </div>
          </div>
        )}

        {/* Welcome Section for Logged in Users */}
        {user && (
          <div className="mb-8 p-6 bg-blue-900/20 border border-blue-700/50 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-2">
              Welcome back, {user.full_name || user.email}!
            </h2>
            <p className="text-blue-300">
              You are logged in as a <span className="font-medium capitalize">{user.role}</span>
            </p>
          </div>
        )}

        {activeTab === 'dashboard' && <Dashboard />}
      </main>

      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}
