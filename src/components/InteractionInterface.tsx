'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Brain, MessageCircle, Clock, Heart, Zap, Eye, Lightbulb, HelpCircle, Filter, Search, ChevronDown, RefreshCw } from 'lucide-react';

interface AutonomousThought {
  id: string;
  type: 'reflection' | 'question' | 'goal_creation' | 'pondering' | 'analysis';
  content: string;
  timestamp: string;
  emotion_influence: string;
  priority: number;
  related_concepts?: string[];
  follow_up_questions?: string[];
  user_name?: string;
}

interface AutonomousInteraction {
  id: string;
  type: 'question' | 'observation' | 'suggestion' | 'concern';
  content: string;
  timestamp: string;
  emotion_state: string;
  emotion_intensity: number;
  priority: number; // 1-5, higher is more urgent
  requires_response: boolean;
  context?: string;
  user_name?: string;
  responded_to?: boolean;
  user_response?: string;
  response_timestamp?: string;
}

interface ThinkingStatus {
  is_thinking: boolean;
  time_since_activity: number;
  current_session?: any;
  processing_efficiency: number;
}

interface ThinkingStats {
  total_thoughts: number;
  total_interactions: number;
  total_sessions: number;
  avg_session_duration: number;
  most_common_emotion: string;
  efficiency_trend: number;
}

interface InteractionInterfaceProps {
  onNavigateToBrain?: (conversationData: any) => void;
}

interface FilterOptions {
  type: string[];
  emotion: string[];
  priority: number[];
  dateRange: 'all' | 'today' | 'week' | 'month';
  responded: 'all' | 'pending' | 'responded';
  search: string;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export default function InteractionInterface({ onNavigateToBrain }: InteractionInterfaceProps) {
  const [thoughts, setThoughts] = useState<AutonomousThought[]>([]);
  const [interactions, setInteractions] = useState<AutonomousInteraction[]>([]);
  const [thinkingStatus, setThinkingStatus] = useState<ThinkingStatus | null>(null);
  const [thinkingStats, setThinkingStats] = useState<ThinkingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'interactions' | 'thoughts' | 'status'>('interactions');
  const [userResponse, setUserResponse] = useState('');
  const [respondingToId, setRespondingToId] = useState<string | null>(null);
  
  // Filtering and pagination state
  const [filters, setFilters] = useState<FilterOptions>({
    type: [],
    emotion: [],
    priority: [],
    dateRange: 'all',
    responded: 'all',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [thoughtsPagination, setThoughtsPagination] = useState<PaginationState>({
    page: 1,
    limit: 50, // Increased to show more items
    total: 0,
    hasMore: false
  });
  const [interactionsPagination, setInteractionsPagination] = useState<PaginationState>({
    page: 1,
    limit: 50, // Increased to show more items
    total: 0,
    hasMore: false
  });

  // Auto-refresh when not on the specific page
  useEffect(() => {
    // Initial data fetch
    fetchData();
    
    // Set up polling for real-time updates - more frequent when active
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch data when filters change only (not when activeTab changes)
  useEffect(() => {
    fetchData(true); // Reset pagination when filters change
  }, [filters]);

  const fetchData = useCallback(async (resetPagination = false) => {
    if (resetPagination) {
      setThoughtsPagination(prev => ({ ...prev, page: 1 }));
      setInteractionsPagination(prev => ({ ...prev, page: 1 }));
    }
    
    try {
      setRefreshing(true);
      
      const currentThoughtsPage = resetPagination ? 1 : thoughtsPagination.page;
      const currentInteractionsPage = resetPagination ? 1 : interactionsPagination.page;
      
      // Build query parameters for filtering and pagination
      const thoughtsParams = new URLSearchParams({
        page: currentThoughtsPage.toString(),
        limit: thoughtsPagination.limit.toString(),
        ...(filters.type.length > 0 && { types: filters.type.join(',') }),
        ...(filters.emotion.length > 0 && { emotions: filters.emotion.join(',') }),
        ...(filters.priority.length > 0 && { priorities: filters.priority.join(',') }),
        ...(filters.dateRange !== 'all' && { dateRange: filters.dateRange }),
        ...(filters.search && { search: filters.search })
      });

      const interactionsParams = new URLSearchParams({
        page: currentInteractionsPage.toString(),
        limit: interactionsPagination.limit.toString(),
        ...(filters.type.length > 0 && { types: filters.type.join(',') }),
        ...(filters.emotion.length > 0 && { emotions: filters.emotion.join(',') }),
        ...(filters.priority.length > 0 && { priorities: filters.priority.join(',') }),
        ...(filters.dateRange !== 'all' && { dateRange: filters.dateRange }),
        ...(filters.responded !== 'all' && { responded: filters.responded }),
        ...(filters.search && { search: filters.search })
      });

      // Always fetch status, stats, AND both interactions and thoughts data
      const requests = [
        fetch('/api/autonomous/status'),
        fetch('/api/autonomous/stats'),
        fetch(`/api/autonomous/thoughts?${thoughtsParams}`),
        fetch(`/api/autonomous/interactions?${interactionsParams}`)
      ];

      const [statusRes, statsRes, thoughtsRes, interactionsRes] = await Promise.all(requests);
      
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.success) setThinkingStatus(statusData.data);
      }
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) setThinkingStats(statsData.data);
      }

      // Always fetch thoughts data
      if (thoughtsRes.ok) {
        const thoughtsData = await thoughtsRes.json();
        console.log('Fetched thoughts data:', thoughtsData); // Debug log
        if (thoughtsData.success) {
          if (resetPagination || currentThoughtsPage === 1) {
            setThoughts(thoughtsData.data.items || thoughtsData.data || []);
          } else {
            // Append for lazy loading
            setThoughts(prev => [...prev, ...(thoughtsData.data.items || [])]);
          }
          
          if (thoughtsData.data.pagination) {
            setThoughtsPagination(prev => ({
              ...prev,
              total: thoughtsData.data.pagination.total,
              hasMore: thoughtsData.data.pagination.hasMore
            }));
          }
        }
      }

      // Always fetch interactions data
      if (interactionsRes.ok) {
        const interactionsData = await interactionsRes.json();
        console.log('Fetched interactions data:', interactionsData); // Debug log
        if (interactionsData.success) {
          if (resetPagination || currentInteractionsPage === 1) {
            setInteractions(interactionsData.data.items || interactionsData.data || []);
          } else {
            // Append for lazy loading
            setInteractions(prev => [...prev, ...(interactionsData.data.items || [])]);
          }
          
          if (interactionsData.data.pagination) {
            setInteractionsPagination(prev => ({
              ...prev,
              total: interactionsData.data.pagination.total,
              hasMore: interactionsData.data.pagination.hasMore
            }));
          }
        }
      }
      
    } catch (error) {
      console.error('Error fetching autonomous thinking data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, thoughtsPagination.page, interactionsPagination.page, thoughtsPagination.limit, interactionsPagination.limit]);

  // Load more data for lazy loading
  const loadMore = useCallback(() => {
    if (activeTab === 'thoughts' && thoughtsPagination.hasMore) {
      setThoughtsPagination(prev => ({ ...prev, page: prev.page + 1 }));
    } else if (activeTab === 'interactions' && interactionsPagination.hasMore) {
      setInteractionsPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  }, [activeTab, thoughtsPagination.hasMore, interactionsPagination.hasMore]);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Filter data based on current filters
  const filteredInteractions = useMemo(() => {
    return interactions.filter(interaction => {
      // Type filter
      if (filters.type.length > 0 && !filters.type.includes(interaction.type)) {
        return false;
      }
      
      // Emotion filter
      if (filters.emotion.length > 0 && !filters.emotion.includes(interaction.emotion_state)) {
        return false;
      }
      
      // Priority filter
      if (filters.priority.length > 0 && !filters.priority.includes(interaction.priority)) {
        return false;
      }
      
      // Date range filter
      if (filters.dateRange !== 'all') {
        const now = new Date();
        const itemDate = new Date(interaction.timestamp);
        let cutoffDate = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            cutoffDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        if (itemDate < cutoffDate) return false;
      }
      
      // Responded filter
      if (filters.responded === 'pending' && interaction.responded_to) {
        return false;
      }
      if (filters.responded === 'responded' && !interaction.responded_to) {
        return false;
      }
      
      // Search filter
      if (filters.search && !interaction.content.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [interactions, filters]);

  const filteredThoughts = useMemo(() => {
    return thoughts.filter(thought => {
      // Type filter
      if (filters.type.length > 0 && !filters.type.includes(thought.type)) {
        return false;
      }
      
      // Emotion filter
      if (filters.emotion.length > 0 && !filters.emotion.includes(thought.emotion_influence)) {
        return false;
      }
      
      // Priority filter
      if (filters.priority.length > 0 && !filters.priority.includes(thought.priority)) {
        return false;
      }
      
      // Date range filter
      if (filters.dateRange !== 'all') {
        const now = new Date();
        const itemDate = new Date(thought.timestamp);
        let cutoffDate = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            cutoffDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        if (itemDate < cutoffDate) return false;
      }
      
      // Search filter
      if (filters.search && !thought.content.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [thoughts, filters]);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const allItems = [...interactions, ...thoughts];
    return {
      types: [...new Set(allItems.map(item => item.type))],
      emotions: [...new Set([
        ...interactions.map(i => i.emotion_state),
        ...thoughts.map(t => t.emotion_influence)
      ])],
      priorities: [...new Set(allItems.map(item => item.priority))].sort((a, b) => b - a)
    };
  }, [interactions, thoughts]);

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleFilterValue = (key: 'type' | 'emotion' | 'priority', value: any) => {
    setFilters(prev => {
      const currentArray = prev[key] as any[];
      return {
        ...prev,
        [key]: currentArray.includes(value) 
          ? currentArray.filter(v => v !== value)
          : [...currentArray, value]
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      type: [],
      emotion: [],
      priority: [],
      dateRange: 'all',
      responded: 'all',
      search: ''
    });
  };

  const respondToInteraction = async (interactionId: string) => {
    if (!userResponse.trim()) return;
    
    try {
      const response = await fetch('/api/autonomous/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionId,
          response: userResponse.trim()
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserResponse('');
        setRespondingToId(null);
        
        // If should navigate to brain interface, call the callback
        if (data.data.shouldNavigateToBrain && onNavigateToBrain) {
          onNavigateToBrain(data.data.conversationData);
        }
        
        // Refresh data to see any new AI responses
        await fetchData(true);
      }
    } catch (error) {
      console.error('Error responding to interaction:', error);
    }
  };

  const triggerManualThinking = async () => {
    try {
      await fetch('/api/autonomous/manual-trigger', {
        method: 'POST'
      });
      
      // Refresh data after a short delay
      setTimeout(() => fetchData(true), 1000);
    } catch (error) {
      console.error('Error triggering manual thinking:', error);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'question': return <HelpCircle className="w-4 h-4" />;
      case 'observation': return <Eye className="w-4 h-4" />;
      case 'suggestion': return <Lightbulb className="w-4 h-4" />;
      case 'concern': return <Heart className="w-4 h-4" />;
      case 'reflection': return <Brain className="w-4 h-4" />;
      case 'analysis': return <Zap className="w-4 h-4" />;
      case 'pondering': return <MessageCircle className="w-4 h-4" />;
      case 'goal_creation': return <Lightbulb className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'question': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'observation': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'suggestion': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'concern': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'reflection': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'analysis': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'pondering': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'goal_creation': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  if (loading && !thinkingStatus) {
    return (
      <div className="space-y-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
            <span className="ml-3 text-white">Loading autonomous thinking system...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Status and Controls */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-purple-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Autonomous Interaction</h2>
              <p className="text-purple-300">AI-initiated thoughts, questions, and observations</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {(filters.type.length > 0 || filters.emotion.length > 0 || filters.priority.length > 0 || 
                filters.dateRange !== 'all' || filters.responded !== 'all' || filters.search) && (
                <span className="bg-blue-400 text-blue-900 text-xs px-2 py-1 rounded-full font-bold">
                  {[...filters.type, ...filters.emotion, ...filters.priority, 
                    ...(filters.dateRange !== 'all' ? [filters.dateRange] : []),
                    ...(filters.responded !== 'all' ? [filters.responded] : []),
                    ...(filters.search ? ['search'] : [])
                  ].length}
                </span>
              )}
            </button>
            
            <button
              onClick={triggerManualThinking}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Trigger Thinking
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border-t border-white/10 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">Filters</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-purple-300 hover:text-white transition-colors"
              >
                Clear All
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm text-purple-300 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    placeholder="Search content..."
                    className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm text-purple-300 mb-2">Type</label>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {filterOptions.types.map(type => (
                    <label key={type} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.type.includes(type)}
                        onChange={() => toggleFilterValue('type', type)}
                        className="rounded"
                      />
                      <span className="text-white capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Emotion Filter */}
              <div>
                <label className="block text-sm text-purple-300 mb-2">Emotion</label>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {filterOptions.emotions.map(emotion => (
                    <label key={emotion} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.emotion.includes(emotion)}
                        onChange={() => toggleFilterValue('emotion', emotion)}
                        className="rounded"
                      />
                      <span className="text-white capitalize">{emotion}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm text-purple-300 mb-2">Priority</label>
                <div className="space-y-1">
                  {filterOptions.priorities.map(priority => (
                    <label key={priority} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.priority.includes(priority)}
                        onChange={() => toggleFilterValue('priority', priority)}
                        className="rounded"
                      />
                      <span className="text-white">Priority {priority}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm text-purple-300 mb-2">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => updateFilter('dateRange', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                </select>
              </div>

              {/* Response Status Filter (for interactions) */}
              {activeTab === 'interactions' && (
                <div>
                  <label className="block text-sm text-purple-300 mb-2">Response Status</label>
                  <select
                    value={filters.responded}
                    onChange={(e) => updateFilter('responded', e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending Response</option>
                    <option value="responded">Responded</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Indicators */}
        {thinkingStatus && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${thinkingStatus.is_thinking ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-purple-300">
                  {thinkingStatus.is_thinking ? 'Thinking' : 'Idle'}
                </span>
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-sm text-purple-300">Time Since Activity</div>
              <div className="text-white font-medium">
                {Math.floor(thinkingStatus.time_since_activity / 1000)}s
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-sm text-purple-300">Processing Efficiency</div>
              <div className="text-white font-medium">
                {(thinkingStatus.processing_efficiency * 100).toFixed(0)}%
              </div>
            </div>
            
            {thinkingStats && (
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-sm text-purple-300">Dominant Emotion</div>
                <div className="text-white font-medium capitalize">
                  {thinkingStats.most_common_emotion}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
        <div className="flex border-b border-white/10">
          {[
            { id: 'interactions', label: 'AI Questions & Observations', icon: MessageCircle },
            { id: 'thoughts', label: 'Internal Thoughts', icon: Brain },
            { id: 'status', label: 'Thinking Sessions', icon: Zap }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-white bg-white/10 border-b-2 border-purple-400'
                    : 'text-purple-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Interactions Tab */}
          {activeTab === 'interactions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">AI-Initiated Interactions</h3>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-purple-300">
                    Showing {filteredInteractions.length} of {interactionsPagination.total || interactions.length}
                  </span>
                  {refreshing && (
                    <div className="flex items-center space-x-2 text-purple-300">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Updating...</span>
                    </div>
                  )}
                </div>
              </div>
              
              {filteredInteractions.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  {interactions.length === 0 ? (
                    <>
                      <p className="text-gray-400">No autonomous interactions yet.</p>
                      <p className="text-gray-500 text-sm">The AI will start thinking when you're inactive for 20+ seconds.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-400">No interactions match your current filters.</p>
                      <p className="text-gray-500 text-sm">Try adjusting your filters or clearing them.</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Pending Interactions (High Priority) */}
                  {filteredInteractions
                    .filter(i => !i.responded_to)
                    .sort((a, b) => b.priority - a.priority)
                    .map((interaction) => (
                    <div
                      key={interaction.id}
                      className={`border rounded-lg p-4 transition-all ${getTypeColor(interaction.type)} ${
                        interaction.priority >= 4 ? 'ring-2 ring-red-400/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(interaction.type)}
                          <span className="font-medium capitalize">{interaction.type}</span>
                          <span className="text-xs opacity-75 capitalize">
                            ({interaction.emotion_state})
                          </span>
                          {/* Priority Badge */}
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                            interaction.priority >= 4 ? 'bg-red-500/20 text-red-300' :
                            interaction.priority >= 3 ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            P{interaction.priority}
                          </span>
                          {/* Emotion Intensity */}
                          <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                            {Math.round(interaction.emotion_intensity * 100)}%
                          </span>
                        </div>
                        <div className="text-xs opacity-75 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(interaction.timestamp)}</span>
                        </div>
                      </div>
                      
                      <p className="text-white mb-3 leading-relaxed">
                        {interaction.content}
                      </p>
                      
                      {interaction.requires_response && (
                        <div className="border-t border-white/10 pt-3">
                          {respondingToId === interaction.id ? (
                            <div className="space-y-3">
                              <textarea
                                value={userResponse}
                                onChange={(e) => setUserResponse(e.target.value)}
                                placeholder="Type your response..."
                                className="w-full p-3 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 resize-none"
                                rows={3}
                              />
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => respondToInteraction(interaction.id)}
                                  disabled={!userResponse.trim()}
                                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Send Response
                                </button>
                                <button
                                  onClick={() => {
                                    setRespondingToId(null);
                                    setUserResponse('');
                                  }}
                                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setRespondingToId(interaction.id)}
                              className={`px-4 py-2 text-white rounded transition-colors ${
                                interaction.priority >= 4 
                                  ? 'bg-red-600 hover:bg-red-700' 
                                  : 'bg-white/10 hover:bg-white/20'
                              }`}
                            >
                              {interaction.priority >= 4 ? 'Urgent: Respond' : 'Respond to this question'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Responded Interactions */}
                  {filteredInteractions.some(i => i.responded_to) && (
                    <div className="mt-8">
                      <h4 className="text-white font-semibold mb-4">Previous Interactions</h4>
                      <div className="space-y-3">
                        {filteredInteractions
                          .filter(i => i.responded_to)
                          .map((interaction) => (
                          <div
                            key={interaction.id}
                            className={`border rounded-lg p-4 opacity-75 ${getTypeColor(interaction.type)}`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                {getTypeIcon(interaction.type)}
                                <span className="font-medium capitalize">{interaction.type}</span>
                                <span className="text-xs opacity-75">✓ Responded</span>
                              </div>
                              <div className="text-xs opacity-75">
                                {formatTimeAgo(interaction.timestamp)}
                              </div>
                            </div>
                            <p className="text-white/75 mb-2">{interaction.content}</p>
                            {interaction.user_response && (
                              <div className="bg-white/5 rounded p-2 text-sm">
                                <span className="text-blue-300">Your response: </span>
                                <span className="text-white/75">{interaction.user_response}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Lazy Load More Button */}
                  {interactionsPagination.hasMore && (
                    <div className="text-center py-4">
                      <button
                        onClick={loadMore}
                        disabled={refreshing}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {refreshing ? 'Loading...' : 'Load More Interactions'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Thoughts Tab */}
          {activeTab === 'thoughts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Internal Thoughts</h3>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-purple-300">
                    Showing {filteredThoughts.length} of {thoughtsPagination.total || thoughts.length}
                  </span>
                  {refreshing && (
                    <div className="flex items-center space-x-2 text-purple-300">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Updating...</span>
                    </div>
                  )}
                </div>
              </div>
              
              {filteredThoughts.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  {thoughts.length === 0 ? (
                    <>
                      <p className="text-gray-400">No autonomous thoughts yet.</p>
                      <p className="text-gray-500 text-sm">The AI will start thinking when idle.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-400">No thoughts match your current filters.</p>
                      <p className="text-gray-500 text-sm">Try adjusting your filters or clearing them.</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredThoughts
                    .sort((a, b) => b.priority - a.priority)
                    .map((thought) => (
                    <div
                      key={thought.id}
                      className={`border rounded-lg p-4 ${getTypeColor(thought.type)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(thought.type)}
                          <span className="font-medium capitalize">{thought.type}</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                            thought.priority >= 4 ? 'bg-red-500/20 text-red-300' :
                            thought.priority >= 3 ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            P{thought.priority}
                          </span>
                        </div>
                        <div className="text-xs opacity-75 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(thought.timestamp)}</span>
                        </div>
                      </div>
                      
                      <p className="text-white mb-2 leading-relaxed text-sm">
                        {thought.content}
                      </p>
                      
                      <div className="flex items-center space-x-2 text-xs opacity-75">
                        <Heart className="w-3 h-3" />
                        <span className="capitalize">{thought.emotion_influence}</span>
                      </div>
                      
                      {thought.related_concepts && thought.related_concepts.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {thought.related_concepts.map((concept, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-white/10 rounded text-xs"
                            >
                              {concept}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {thought.follow_up_questions && thought.follow_up_questions.length > 0 && (
                        <div className="mt-2 border-t border-white/10 pt-2">
                          <div className="text-xs text-purple-300 mb-1">Follow-up questions:</div>
                          <div className="space-y-1">
                            {thought.follow_up_questions.map((question, index) => (
                              <div key={index} className="text-xs text-white/75 italic">
                                • {question}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Lazy Load More Button */}
                  {thoughtsPagination.hasMore && (
                    <div className="text-center py-4">
                      <button
                        onClick={loadMore}
                        disabled={refreshing}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {refreshing ? 'Loading...' : 'Load More Thoughts'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Status Tab */}
          {activeTab === 'status' && thinkingStats && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white">Thinking Statistics</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-sm text-purple-300">Total Thoughts</div>
                  <div className="text-2xl font-bold text-white">{thinkingStats.total_thoughts}</div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-sm text-purple-300">Total Interactions</div>
                  <div className="text-2xl font-bold text-white">{thinkingStats.total_interactions}</div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-sm text-purple-300">Thinking Sessions</div>
                  <div className="text-2xl font-bold text-white">{thinkingStats.total_sessions}</div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-sm text-purple-300">Avg Session Duration</div>
                  <div className="text-2xl font-bold text-white">
                    {Math.round(thinkingStats.avg_session_duration / 1000)}s
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-sm text-purple-300">Efficiency Trend</div>
                  <div className="text-2xl font-bold text-white">
                    {(thinkingStats.efficiency_trend * 100).toFixed(0)}%
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-sm text-purple-300">Dominant Emotion</div>
                  <div className="text-xl font-bold text-white capitalize">
                    {thinkingStats.most_common_emotion}
                  </div>
                </div>
              </div>
              
              {thinkingStatus?.current_session && (
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Current Thinking Session</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-purple-300">Started:</span>
                      <span className="text-white ml-2">
                        {formatTimeAgo(thinkingStatus.current_session.start_time)}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-300">Thoughts Generated:</span>
                      <span className="text-white ml-2">
                        {thinkingStatus.current_session.thoughts_generated}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
