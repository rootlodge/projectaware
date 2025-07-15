'use client';

import React, { useState, useEffect } from 'react';
import { Database, Search, TrendingUp, Clock, MessageSquare, Brain, BarChart3, Filter } from 'lucide-react';

interface MemoryAnalytics {
  message_stats: any;
  conversation_patterns: any;
  user_engagement: any;
  emotion_trends: any;
  learning_insights: any;
  peak_activity_hours: any[];
  response_quality: any;
}

interface SearchResult {
  id: number;
  type: string;
  content: string;
  timestamp: string;
  metadata?: any;
}

const MemoryDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<MemoryAnalytics | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'search' | 'cleanup'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/memory?action=analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      const response = await fetch(
        `/api/memory?action=search&query=${encodeURIComponent(searchQuery)}&type=${searchType}&limit=20`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCleanup = async (days: number) => {
    if (!confirm(`Are you sure you want to delete data older than ${days} days?`)) return;
    
    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cleanup',
          data: { daysToKeep: days }
        })
      });
      
      if (response.ok) {
        alert('Cleanup completed successfully');
        loadAnalytics(); // Refresh analytics
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
      alert('Cleanup failed');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Database className="w-8 h-8 text-blue-500" />
          <h2 className="text-2xl font-bold">Memory Analytics</h2>
        </div>
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'analytics', label: 'Analytics', icon: TrendingUp },
          { key: 'search', label: 'Search', icon: Search },
          { key: 'cleanup', label: 'Cleanup', icon: Filter }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Message Stats */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Message Statistics</h3>
              <MessageSquare className="w-6 h-6 text-green-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Messages:</span>
                <span className="font-bold">{formatNumber(analytics.message_stats.total || 0)}</span>
              </div>
              {analytics.message_stats.by_type?.slice(0, 3).map((type: any) => (
                <div key={type.type} className="flex justify-between text-sm">
                  <span>{type.type}:</span>
                  <span>{formatNumber(type.count)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* User Engagement */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">User Engagement</h3>
              <Brain className="w-6 h-6 text-purple-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Unique Sessions:</span>
                <span className="font-bold">{formatNumber(analytics.user_engagement.unique_sessions || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Messages/Session:</span>
                <span className="font-bold">{(analytics.user_engagement.avg_messages_per_session || 0).toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Response Quality */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Response Quality</h3>
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Avg Satisfaction:</span>
                <span className="font-bold">{(analytics.response_quality.metrics?.avg_satisfaction || 0).toFixed(1)}/5</span>
              </div>
              <div className="flex justify-between">
                <span>High Quality:</span>
                <span className="font-bold">{formatNumber(analytics.response_quality.metrics?.high_quality || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Peak Activity Hours */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-orange-500" />
              Peak Activity Hours
            </h3>
            <div className="grid grid-cols-12 gap-1">
              {analytics.peak_activity_hours.map((hour: any) => (
                <div key={hour.hour} className="text-center">
                  <div 
                    className="bg-blue-500 rounded-sm mb-1"
                    style={{
                      height: `${Math.max(4, (hour.activity_count / Math.max(...analytics.peak_activity_hours.map((h: any) => h.activity_count))) * 60)}px`
                    }}
                  ></div>
                  <div className="text-xs text-gray-500">{hour.hour}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Emotion Trends */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold mb-4">Emotion Distribution</h3>
            <div className="space-y-2">
              {analytics.emotion_trends.distribution?.slice(0, 5).map((emotion: any) => (
                <div key={emotion.emotion_state} className="flex justify-between items-center">
                  <span className="capitalize">{emotion.emotion_state}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                        style={{
                          width: `${(emotion.count / (analytics.emotion_trends.distribution?.[0]?.count || 1)) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{emotion.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Insights */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold mb-4">Learning Event Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.learning_insights.event_types?.slice(0, 6).map((event: any) => (
                <div key={event.event_type} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm capitalize">{event.event_type.replace(/_/g, ' ')}</span>
                  <span className="font-bold text-green-600">{event.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* Search Controls */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold mb-4">Search Memory</h3>
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search messages, conversations, or events..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                />
              </div>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              >
                <option value="all">All Types</option>
                <option value="user_message">User Messages</option>
                <option value="ai_response">AI Responses</option>
                <option value="brain_processing">Brain Processing</option>
                <option value="system">System Messages</option>
              </select>
              <button
                onClick={handleSearch}
                disabled={searchLoading}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold mb-4">Search Results ({searchResults.length})</h3>
              <div className="space-y-4">
                {searchResults.map((result) => (
                  <div key={result.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400 capitalize">
                        {result.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(result.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {result.content.length > 200 ? `${result.content.substring(0, 200)}...` : result.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cleanup Tab */}
      {activeTab === 'cleanup' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold mb-4">Memory Cleanup</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Remove old data to optimize performance and manage storage. This action cannot be undone.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { days: 7, label: 'Last Week', description: 'Keep only the last 7 days of data' },
                { days: 30, label: 'Last Month', description: 'Keep only the last 30 days of data' },
                { days: 90, label: 'Last 3 Months', description: 'Keep only the last 90 days of data' }
              ].map(option => (
                <div key={option.days} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <h4 className="font-semibold mb-2">{option.label}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{option.description}</p>
                  <button
                    onClick={() => handleCleanup(option.days)}
                    className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Cleanup
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryDashboard;
