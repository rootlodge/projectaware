'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ThoughtEvent } from '@/lib/core/ThoughtStream';
import { 
  Brain, 
  Activity, 
  Zap, 
  Heart, 
  Target, 
  BookOpen, 
  Eye, 
  Lightbulb, 
  Users, 
  Shuffle, 
  Palette, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  Clock,
  Filter,
  Search,
  Play,
  Pause,
  Download,
  Maximize2,
  TrendingUp,
  Cpu,
  Database,
  MessageCircle,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Event type configurations with consistent theming
const EVENT_CONFIG = {
  reflection: { 
    color: 'bg-purple-500/20 border-purple-400/30 text-purple-200', 
    accent: 'border-l-purple-400',
    icon: Brain, 
    label: 'Reflection',
    description: 'Deep introspective analysis'
  },
  thought: { 
    color: 'bg-blue-500/20 border-blue-400/30 text-blue-200', 
    accent: 'border-l-blue-400',
    icon: Lightbulb, 
    label: 'Thought',
    description: 'Cognitive processing event'
  },
  action: { 
    color: 'bg-green-500/20 border-green-400/30 text-green-200', 
    accent: 'border-l-green-400',
    icon: Zap, 
    label: 'Action',
    description: 'System execution event'
  },
  emotion: { 
    color: 'bg-red-500/20 border-red-400/30 text-red-200', 
    accent: 'border-l-red-400',
    icon: Heart, 
    label: 'Emotion',
    description: 'Emotional state change'
  },
  memory: { 
    color: 'bg-yellow-500/20 border-yellow-400/30 text-yellow-200', 
    accent: 'border-l-yellow-400',
    icon: Database, 
    label: 'Memory',
    description: 'Memory formation/retrieval'
  },
  goal: { 
    color: 'bg-indigo-500/20 border-indigo-400/30 text-indigo-200', 
    accent: 'border-l-indigo-400',
    icon: Target, 
    label: 'Goal',
    description: 'Goal-related processing'
  },
  learning: { 
    color: 'bg-teal-500/20 border-teal-400/30 text-teal-200', 
    accent: 'border-l-teal-400',
    icon: BookOpen, 
    label: 'Learning',
    description: 'Knowledge acquisition'
  },
  prediction: { 
    color: 'bg-orange-500/20 border-orange-400/30 text-orange-200', 
    accent: 'border-l-orange-400',
    icon: TrendingUp, 
    label: 'Prediction',
    description: 'Predictive analysis'
  },
  decision: { 
    color: 'bg-slate-500/20 border-slate-400/30 text-slate-200', 
    accent: 'border-l-slate-400',
    icon: Settings, 
    label: 'Decision',
    description: 'Decision-making process'
  },
  observation: { 
    color: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200', 
    accent: 'border-l-emerald-400',
    icon: Eye, 
    label: 'Observation',
    description: 'Environmental awareness'
  },
  insight: { 
    color: 'bg-violet-500/20 border-violet-400/30 text-violet-200', 
    accent: 'border-l-violet-400',
    icon: Lightbulb, 
    label: 'Insight',
    description: 'Breakthrough understanding'
  },
  collaboration: { 
    color: 'bg-pink-500/20 border-pink-400/30 text-pink-200', 
    accent: 'border-l-pink-400',
    icon: Users, 
    label: 'Collaboration',
    description: 'Multi-agent coordination'
  },
  adaptation: { 
    color: 'bg-cyan-500/20 border-cyan-400/30 text-cyan-200', 
    accent: 'border-l-cyan-400',
    icon: Shuffle, 
    label: 'Adaptation',
    description: 'Behavioral adjustment'
  },
  creativity: { 
    color: 'bg-rose-500/20 border-rose-400/30 text-rose-200', 
    accent: 'border-l-rose-400',
    icon: Palette, 
    label: 'Creativity',
    description: 'Creative ideation'
  },
  validation: { 
    color: 'bg-green-500/20 border-green-400/30 text-green-200', 
    accent: 'border-l-green-400',
    icon: CheckCircle, 
    label: 'Validation',
    description: 'Verification process'
  },
  error: { 
    color: 'bg-red-600/20 border-red-500/30 text-red-200', 
    accent: 'border-l-red-500',
    icon: AlertTriangle, 
    label: 'Error',
    description: 'Error condition'
  },
  confidence: { 
    color: 'bg-indigo-500/20 border-indigo-400/30 text-indigo-200', 
    accent: 'border-l-indigo-400',
    icon: BarChart3, 
    label: 'Confidence',
    description: 'Confidence assessment'
  },
  reasoning: { 
    color: 'bg-blue-500/20 border-blue-400/30 text-blue-200', 
    accent: 'border-l-blue-400',
    icon: Cpu, 
    label: 'Reasoning',
    description: 'Logical reasoning'
  },
  tree: { 
    color: 'bg-green-500/20 border-green-400/30 text-green-200', 
    accent: 'border-l-green-400',
    icon: Settings, 
    label: 'Decision Tree',
    description: 'Decision tree analysis'
  },
  system: { 
    color: 'bg-slate-500/20 border-slate-400/30 text-slate-200', 
    accent: 'border-l-slate-400',
    icon: Cpu, 
    label: 'System',
    description: 'System operation'
  },
  user_interaction: { 
    color: 'bg-blue-500/20 border-blue-400/30 text-blue-200', 
    accent: 'border-l-blue-400',
    icon: MessageCircle, 
    label: 'User Interaction',
    description: 'User engagement event'
  }
};

const PRIORITY_COLORS = {
  low: 'text-slate-400',
  medium: 'text-blue-400',
  high: 'text-orange-400',
  critical: 'text-red-400'
};

interface Filters {
  type: string;
  priority: string;
  confidence: { min: number; max: number };
  timeRange: string;
  search: string;
  tags: string[];
}

interface ThoughtStreamStats {
  totalEvents: number;
  averageConfidence: number;
  sessionDuration: number;
  eventVelocity: number;
  topTags: string[];
  confidenceTrend: number[];
}

export default function ThoughtStreamPage() {
  const [events, setEvents] = useState<ThoughtEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<ThoughtEvent | null>(null);
  const [filters, setFilters] = useState<Filters>({
    type: 'all',
    priority: 'all',
    confidence: { min: 0, max: 1 },
    timeRange: 'all',
    search: '',
    tags: []
  });
  const [viewMode, setViewMode] = useState<'timeline' | 'cards' | 'analytics' | 'flow'>('timeline');
  const [isRecording, setIsRecording] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState<ThoughtStreamStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [visibleCards, setVisibleCards] = useState(20); // For lazy loading cards
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      setIsConnected(true);
      const response = await fetch('/api/thought-stream', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEvents(data.events || []);
          setAnalytics(data.analytics || null);
          setIsRecording(data.isRecording ?? true);
          setLastRefresh(new Date());
          setIsConnected(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch thought stream data:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up polling for real-time updates
  useEffect(() => {
    // Initial fetch
    fetchData();
    
    // Set up polling every 3 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchData();
    }, 3000);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchData]);

  // Refetch when filters change
  useEffect(() => {
    fetchData();
  }, [filters, fetchData]);

  // Auto-scroll behavior
  useEffect(() => {
    if (autoScroll && scrollRef.current && events.length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ 
          top: scrollRef.current.scrollHeight, 
          behavior: 'smooth' 
        });
      }, 100);
    }
  }, [events, autoScroll]);

  const updateStats = React.useCallback((analyticsData: any, currentEvents?: ThoughtEvent[]) => {
    if (!analyticsData) return;
    
    const totalEvents = analyticsData.totalEvents || 0;
    const sessionDuration = analyticsData.sessionDuration || 0;
    const eventVelocity = sessionDuration > 0 ? (totalEvents / (sessionDuration / 60000)) : 0; // events per minute
    
    // Extract top tags from current events if provided
    let topTags: string[] = [];
    if (currentEvents) {
      const tagCounts: Record<string, number> = {};
      currentEvents.forEach(event => {
        event.details?.tags?.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      
      topTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag);
    }

    setStats({
      totalEvents,
      averageConfidence: analyticsData.averageConfidence || 0,
      sessionDuration,
      eventVelocity,
      topTags,
      confidenceTrend: [] // Would need historical data for this
    });
  }, []);

  // Update stats whenever analytics or events change
  useEffect(() => {
    if (analytics) {
      updateStats(analytics, events);
    }
  }, [analytics, events, updateStats]);

  // Memoize filtered events to prevent re-computation on every render
  const filteredEvents = React.useMemo(() => {
    return events.filter(event => {
      if (filters.type !== 'all' && event.type !== filters.type) return false;
      if (filters.priority !== 'all' && event.details?.priority !== filters.priority) return false;
      if (event.confidence !== undefined && 
          (event.confidence < filters.confidence.min || event.confidence > filters.confidence.max)) return false;
      
      if (filters.timeRange !== 'all') {
        const eventTime = new Date(event.timestamp).getTime();
        const now = Date.now();
        const ranges = {
          '5m': 5 * 60 * 1000,
          '15m': 15 * 60 * 1000,
          '1h': 60 * 60 * 1000,
          '6h': 6 * 60 * 60 * 1000,
          '24h': 24 * 60 * 60 * 1000,
          '7d': 7 * 24 * 60 * 60 * 1000
        };
        const range = ranges[filters.timeRange as keyof typeof ranges];
        if (range && eventTime < now - range) return false;
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchMatch = event.content.toLowerCase().includes(searchLower) ||
                           event.details?.context?.toLowerCase().includes(searchLower) ||
                           event.details?.reasoning?.some(r => r.toLowerCase().includes(searchLower)) ||
                           event.details?.tags?.some(t => t.toLowerCase().includes(searchLower));
        if (!searchMatch) return false;
      }

      if (filters.tags.length > 0) {
        const hasRequiredTags = filters.tags.every(tag => 
          event.details?.tags?.includes(tag)
        );
        if (!hasRequiredTags) return false;
      }

      return true;
    });
  }, [events, filters]);

  // Pagination calculations (only for timeline view)
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEvents = viewMode === 'timeline' ? filteredEvents.slice(startIndex, endIndex) : filteredEvents;

  // Lazy loading for cards view
  const visibleCardsEvents = viewMode === 'cards' ? filteredEvents.slice(0, visibleCards) : filteredEvents;

  // Reset to first page when filters change (timeline only)
  React.useEffect(() => {
    if (viewMode === 'timeline') {
      setCurrentPage(1);
    }
  }, [filters, viewMode]);

  // Reset visible cards when switching to cards view or filters change
  React.useEffect(() => {
    if (viewMode === 'cards') {
      setVisibleCards(20);
    }
  }, [filters, viewMode]);

  // Lazy loading intersection observer for cards view
  React.useEffect(() => {
    if (viewMode !== 'cards' || !cardsContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && visibleCards < filteredEvents.length) {
          setVisibleCards(prev => Math.min(prev + 20, filteredEvents.length));
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before the element comes into view
        threshold: 0.1
      }
    );

    // Observe the last few cards to trigger loading
    const cards = cardsContainerRef.current.children;
    if (cards.length > 3) {
      observer.observe(cards[cards.length - 3] as Element);
    }

    return () => {
      observer.disconnect();
    };
  }, [viewMode, visibleCards, filteredEvents.length, visibleCardsEvents]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 1000) return 'Just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-slate-400';
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    if (confidence >= 0.4) return 'text-orange-400';
    return 'text-red-400';
  };

  const toggleRecording = async () => {
    try {
      const response = await fetch('/api/thought-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-recording' })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsRecording(data.recording);
        }
      }
    } catch (error) {
      console.error('Failed to toggle recording:', error);
    }
  };

  const generateTestEvents = async () => {
    try {
      const response = await fetch('/api/test-thought-stream', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        console.log(`Generated ${result.events} test events`);
        // Refresh data immediately after generating test events
        fetchData();
      }
    } catch (error) {
      console.error('Failed to generate test events:', error);
    }
  };

  const activateGoalEngine = async () => {
    try {
      const response = await fetch('/api/activate-goal-engine', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        console.log(`Goal engine activated: ${result.message}`);
        // Refresh data after activating goal engine
        fetchData();
      }
    } catch (error) {
      console.error('Failed to activate goal engine:', error);
    }
  };

  const renderEventCard = React.useCallback((event: ThoughtEvent, index: number) => {
    const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.thought;
    const IconComponent = config.icon;
    
    return (
      <div
        key={`${event.timestamp}-${index}`}
        className={`bg-white/5 backdrop-blur-sm rounded-xl p-6 border ${config.color} ${config.accent} border-l-4 cursor-pointer hover:bg-white/10 transition-all duration-300 group`}
        onClick={() => setSelectedEvent(event)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-white">{config.label}</span>
              <p className="text-xs text-purple-300">{config.description}</p>
            </div>
            {event.details?.priority && (
              <span className={`text-xs font-medium px-2 py-1 rounded-full bg-white/10 ${PRIORITY_COLORS[event.details.priority as keyof typeof PRIORITY_COLORS]}`}>
                {event.details.priority.toUpperCase()}
              </span>
            )}
          </div>
          <div className="text-xs text-purple-300 flex flex-col items-end">
            <span>{formatTimestamp(event.timestamp)}</span>
            {event.confidence !== undefined && (
              <span className={`${getConfidenceColor(event.confidence)} font-medium`}>
                {Math.round(event.confidence * 100)}%
              </span>
            )}
          </div>
        </div>
        
        <p className="text-white mb-4 line-clamp-3 leading-relaxed">{event.content}</p>
        
        {/* Event metadata */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4 text-purple-300">
            {event.details?.goalId && (
              <span className="flex items-center space-x-1">
                <Target className="w-3 h-3" />
                <span>Goal: {event.details.goalId.slice(0, 8)}...</span>
              </span>
            )}
            {event.details?.duration && (
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{event.details.duration}ms</span>
              </span>
            )}
          </div>
          {event.details?.tags && event.details.tags.length > 0 && (
            <div className="flex space-x-1">
              {event.details.tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="bg-purple-500/20 text-purple-200 px-2 py-1 rounded text-xs">
                  {tag}
                </span>
              ))}
              {event.details.tags.length > 3 && (
                <span className="text-purple-400">+{event.details.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Reasoning preview */}
        {event.details?.reasoning && event.details.reasoning.length > 0 && (
          <div className="mt-3 p-3 bg-black/20 rounded-lg border border-white/10">
            <p className="text-xs text-purple-300 mb-1">Reasoning:</p>
            <p className="text-xs text-white line-clamp-2">{event.details.reasoning[0]}</p>
          </div>
        )}
      </div>
    );
  }, [formatTimestamp, getConfidenceColor, setSelectedEvent]);

  const renderTimeline = React.useCallback(() => (
    <div className="space-y-6" ref={scrollRef}>
      {paginatedEvents.length === 0 ? (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
          <p className="text-purple-300 text-lg mb-2">No thought events found</p>
          <p className="text-purple-400 text-sm mb-6">
            The cognitive stream will populate as the system processes thoughts
          </p>
          <div className="flex gap-4">
            <button
              onClick={generateTestEvents}
              className="px-6 py-3 bg-purple-500/20 text-purple-200 rounded-lg border border-purple-400/30 hover:bg-purple-500/30 transition-colors"
            >
              Generate Test Events
            </button>
            <button
              onClick={activateGoalEngine}
              className="px-6 py-3 bg-blue-500/20 text-blue-200 rounded-lg border border-blue-400/30 hover:bg-blue-500/30 transition-colors"
            >
              Activate Goal Engine
            </button>
          </div>
        </div>
      ) : (
        paginatedEvents.map((event, index) => (
          <div key={`${event.timestamp}-${index}`} className="flex items-start space-x-6">
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 bg-purple-400 rounded-full flex-shrink-0"></div>
              {index < paginatedEvents.length - 1 && (
                <div className="w-0.5 h-16 bg-gradient-to-b from-purple-400 to-transparent mt-2"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {renderEventCard(event, index)}
            </div>
          </div>
        ))
      )}
    </div>
  ), [paginatedEvents, generateTestEvents, activateGoalEngine, renderEventCard]);

  const renderCards = React.useCallback(() => (
    <div>
      <div ref={cardsContainerRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {visibleCardsEvents.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
            <p className="text-purple-300 text-lg mb-2">No thought events found</p>
            <p className="text-purple-400 text-sm mb-6">
              Adjust your filters or generate test events to see cognitive activity
            </p>
            <div className="flex gap-4">
              <button
                onClick={generateTestEvents}
                className="px-6 py-3 bg-purple-500/20 text-purple-200 rounded-lg border border-purple-400/30 hover:bg-purple-500/30 transition-colors"
              >
                Generate Test Events
              </button>
              <button
                onClick={activateGoalEngine}
                className="px-6 py-3 bg-blue-500/20 text-blue-200 rounded-lg border border-blue-400/30 hover:bg-blue-500/30 transition-colors"
              >
                Activate Goal Engine
              </button>
            </div>
          </div>
        ) : (
          visibleCardsEvents.map((event, index) => renderEventCard(event, index))
        )}
      </div>
      
      {/* Lazy Loading Indicator */}
      {viewMode === 'cards' && visibleCards < filteredEvents.length && (
        <div className="text-center py-8">
          <div className="flex items-center justify-center space-x-3">
            <Activity className="w-5 h-5 animate-spin text-purple-400" />
            <span className="text-purple-300">Loading more events...</span>
          </div>
          <p className="text-purple-400 text-sm mt-2">
            Showing {visibleCards} of {filteredEvents.length} events
          </p>
        </div>
      )}
      
      {/* All Cards Loaded Indicator */}
      {viewMode === 'cards' && visibleCards >= filteredEvents.length && filteredEvents.length > 20 && (
        <div className="text-center py-6">
          <div className="flex items-center justify-center space-x-2 text-purple-400">
            <CheckCircle className="w-5 h-5" />
            <span>All {filteredEvents.length} events loaded</span>
          </div>
        </div>
      )}
    </div>
  ), [visibleCardsEvents, generateTestEvents, activateGoalEngine, renderEventCard, viewMode, visibleCards, filteredEvents.length]);

  const renderAnalytics = React.useCallback(() => {
    if (!analytics && !stats) {
      return (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
          <p className="text-purple-300">Loading analytics...</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Real-time Stats */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Live Metrics</h3>
            <Activity className="w-5 h-5 text-purple-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-purple-300">Total Events:</span>
              <span className="text-white font-medium">{stats?.totalEvents || analytics?.totalEvents || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-purple-300">Avg Confidence:</span>
              <span className={`font-medium ${getConfidenceColor(stats?.averageConfidence || analytics?.averageConfidence)}`}>
                {Math.round((stats?.averageConfidence || analytics?.averageConfidence || 0) * 100)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-purple-300">Event Rate:</span>
              <span className="text-white font-medium">{stats?.eventVelocity.toFixed(1) || '0.0'}/min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-purple-300">Session:</span>
              <span className="text-white font-medium">{Math.round((stats?.sessionDuration || analytics?.sessionDuration || 0) / 60000)}m</span>
            </div>
          </div>
        </div>

        {/* Event Types Distribution */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Event Types</h3>
            <BarChart3 className="w-5 h-5 text-purple-400" />
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {analytics?.eventsByType ? Object.entries(analytics.eventsByType).map(([type, count]) => {
              const config = EVENT_CONFIG[type as keyof typeof EVENT_CONFIG];
              const IconComponent = config?.icon || Brain;
              return (
                <div key={type} className="flex justify-between items-center py-1">
                  <div className="flex items-center space-x-2">
                    <IconComponent className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-300 capitalize text-sm">{type}</span>
                  </div>
                  <span className="text-white font-medium">{count as number}</span>
                </div>
              );
            }) : (
              <p className="text-purple-400 text-sm">No data available</p>
            )}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Priority Levels</h3>
            <AlertTriangle className="w-5 h-5 text-purple-400" />
          </div>
          <div className="space-y-2">
            {analytics?.eventsByPriority ? Object.entries(analytics.eventsByPriority).map(([priority, count]) => (
              <div key={priority} className="flex justify-between items-center">
                <span className={`capitalize ${PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS]}`}>
                  {priority}
                </span>
                <span className="text-white font-medium">{count as number}</span>
              </div>
            )) : (
              <p className="text-purple-400 text-sm">No data available</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Activity Timeline</h3>
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <div className="space-y-2">
            {analytics?.recentActivity ? analytics.recentActivity.map((bucket: any, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-purple-300 text-sm">
                  {new Date(bucket.timestamp).toLocaleTimeString()}
                </span>
                <div className="flex items-center space-x-2">
                  <div 
                    className="h-2 bg-purple-400 rounded"
                    style={{ width: `${Math.max(bucket.count * 10, 8)}px` }}
                  ></div>
                  <span className="text-white font-medium text-sm">{bucket.count}</span>
                </div>
              </div>
            )) : (
              <p className="text-purple-400 text-sm">No recent activity</p>
            )}
          </div>
        </div>

        {/* Top Tags */}
        {stats?.topTags && stats.topTags.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Trending Tags</h3>
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.topTags.map((tag, index) => (
                <span 
                  key={index}
                  className="bg-purple-500/20 text-purple-200 px-3 py-1 rounded-full text-sm border border-purple-400/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }, [analytics, stats, getConfidenceColor]);

  return (
    <div className="space-y-6">
      {/* Header with Real-time Status */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30">
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Cognitive Stream</h1>
              <p className="text-purple-300">
                Real-time visualization of AI thought processes and decision patterns
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-sm text-purple-300">
                {isLoading ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {/* Last Refresh Time */}
            <div className="text-xs text-purple-400">
              Last update: {lastRefresh.toLocaleTimeString()}
            </div>
            
            {/* Live Stats */}
            {stats && (
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1 text-purple-300">
                  <Activity className="w-4 h-4" />
                  <span>{stats.totalEvents}</span>
                </div>
                <div className="flex items-center space-x-1 text-purple-300">
                  <TrendingUp className="w-4 h-4" />
                  <span>{stats.eventVelocity.toFixed(1)}/min</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* View Mode Toggles */}
            <div className="flex items-center bg-black/20 rounded-lg p-1">
              {[
                { id: 'timeline', label: 'Timeline', icon: Clock },
                { id: 'cards', label: 'Cards', icon: BarChart3 },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp }
              ].map((mode) => {
                const IconComponent = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id as any)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                      viewMode === mode.id
                        ? 'bg-purple-500/30 text-white'
                        : 'text-purple-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                showFilters 
                  ? 'bg-purple-500/30 text-white' 
                  : 'bg-white/5 text-purple-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            {/* Recording Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-purple-300">Recording:</span>            <button
              onClick={toggleRecording}
              className={`w-12 h-6 rounded-full relative transition-colors ${
                isRecording ? 'bg-green-500/30 border border-green-400' : 'bg-red-500/30 border border-red-400'
              }`}
            >
                <div
                  className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    isRecording ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Auto-scroll Toggle */}
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-3 py-2 rounded-lg text-sm transition-all flex items-center space-x-2 ${
                autoScroll 
                  ? 'bg-blue-500/30 text-blue-200' 
                  : 'bg-white/5 text-purple-300 hover:text-white'
              }`}
            >
              {autoScroll ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{autoScroll ? 'Auto' : 'Manual'}</span>
            </button>

            {/* Export Data */}
            <button
              onClick={() => {
                const data = JSON.stringify({ events: filteredEvents, analytics, stats }, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `thought-stream-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
              }}
              className="px-3 py-2 bg-white/5 text-purple-300 hover:text-white hover:bg-white/10 rounded-lg text-sm transition-all flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Advanced Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-purple-300 hover:text-white"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* Event Type Filter */}
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2">Event Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-purple-400 focus:outline-none"
              >
                <option value="all">All Types</option>
                {Object.entries(EVENT_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-purple-400 focus:outline-none"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Time Range Filter */}
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2">Time Range</label>
              <select
                value={filters.timeRange}
                onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
                className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-purple-400 focus:outline-none"
              >
                <option value="all">All Time</option>
                <option value="5m">Last 5 Minutes</option>
                <option value="15m">Last 15 Minutes</option>
                <option value="1h">Last Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
            </div>

            {/* Confidence Range */}
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2">
                Confidence: {Math.round(filters.confidence.min * 100)}% - {Math.round(filters.confidence.max * 100)}%
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={filters.confidence.min}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    confidence: { ...prev.confidence, min: parseFloat(e.target.value) }
                  }))}
                  className="w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={filters.confidence.max}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    confidence: { ...prev.confidence, max: parseFloat(e.target.value) }
                  }))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-purple-300 mb-2">Search Content</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400" />
                <input
                  type="text"
                  placeholder="Search events, reasoning, tags..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:border-purple-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(filters.type !== 'all' || filters.priority !== 'all' || filters.timeRange !== 'all' || filters.search) && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-purple-300">Active filters:</span>
                  <span className="text-white">{filteredEvents.length} of {events.length} events</span>
                </div>
                <button
                  onClick={() => setFilters({
                    type: 'all',
                    priority: 'all',
                    confidence: { min: 0, max: 1 },
                    timeRange: 'all',
                    search: '',
                    tags: []
                  })}
                  className="text-purple-300 hover:text-white text-sm"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <Activity className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-400" />
              <p className="text-purple-300">Loading thought stream...</p>
            </div>
          ) : (
            <>
              {viewMode === 'timeline' && renderTimeline()}
              {viewMode === 'cards' && renderCards()}
              {viewMode === 'analytics' && renderAnalytics()}
            </>
          )}
        </div>
      </div>

      {/* Pagination Controls (Timeline Only) */}
      {viewMode === 'timeline' && filteredEvents.length > 0 && totalPages > 1 && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-purple-300">Items per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when changing items per page
                  }}
                  className="bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-white text-sm focus:border-purple-400 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="text-sm text-purple-300">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredEvents.length)} of {filteredEvents.length} events
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* First Page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/5 text-purple-300 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                First
              </button>

              {/* Previous Page */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/5 text-purple-300 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
              >
                <ChevronUp className="w-4 h-4 rotate-[-90deg]" />
                <span>Previous</span>
              </button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {(() => {
                  const pages = [];
                  const showPages = 5; // Number of page buttons to show
                  let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
                  let endPage = Math.min(totalPages, startPage + showPages - 1);
                  
                  // Adjust start if we're near the end
                  if (endPage - startPage + 1 < showPages) {
                    startPage = Math.max(1, endPage - showPages + 1);
                  }

                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          currentPage === i
                            ? 'border-purple-400 bg-purple-500/30 text-white'
                            : 'border-white/10 bg-white/5 text-purple-300 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }
                  return pages;
                })()}
              </div>

              {/* Next Page */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/5 text-purple-300 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronUp className="w-4 h-4 rotate-90" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/5 text-purple-300 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/95 backdrop-blur-sm rounded-xl border border-white/10 max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                {(() => {
                  const config = EVENT_CONFIG[selectedEvent.type] || EVENT_CONFIG.thought;
                  const IconComponent = config.icon;
                  return (
                    <>
                      <div className="p-2 rounded-lg bg-white/10">
                        <IconComponent className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">{config.label} Event</h3>
                        <p className="text-purple-300 text-sm">{config.description}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-purple-300 hover:text-white transition-colors"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-white mb-3">Content</h4>
                    <p className="text-purple-200 leading-relaxed bg-black/20 p-4 rounded-lg border border-white/10">
                      {selectedEvent.content}
                    </p>
                  </div>

                  {selectedEvent.details?.reasoning && selectedEvent.details.reasoning.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium text-white mb-3">Reasoning Process</h4>
                      <div className="space-y-2">
                        {selectedEvent.details.reasoning.map((reason, index) => (
                          <div key={index} className="flex items-start space-x-3 bg-black/20 p-3 rounded-lg border border-white/10">
                            <span className="text-purple-400 font-medium text-sm">{index + 1}.</span>
                            <p className="text-purple-200 text-sm">{reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedEvent.details?.alternatives && selectedEvent.details.alternatives.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium text-white mb-3">Alternatives Considered</h4>
                      <div className="space-y-2">
                        {selectedEvent.details.alternatives.map((alt, index) => (
                          <div key={index} className="bg-black/20 p-3 rounded-lg border border-white/10">
                            <p className="text-purple-200 text-sm">{alt}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Metadata Sidebar */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-white mb-3">Event Metadata</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-purple-300">Timestamp:</span>
                        <span className="text-white text-sm font-mono">
                          {new Date(selectedEvent.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      {selectedEvent.confidence !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-purple-300">Confidence:</span>
                          <span className={`font-medium ${getConfidenceColor(selectedEvent.confidence)}`}>
                            {Math.round(selectedEvent.confidence * 100)}%
                          </span>
                        </div>
                      )}

                      {selectedEvent.details?.priority && (
                        <div className="flex justify-between items-center">
                          <span className="text-purple-300">Priority:</span>
                          <span className={`font-medium ${PRIORITY_COLORS[selectedEvent.details.priority as keyof typeof PRIORITY_COLORS]}`}>
                            {selectedEvent.details.priority.toUpperCase()}
                          </span>
                        </div>
                      )}

                      {selectedEvent.details?.impact && (
                        <div className="flex justify-between items-center">
                          <span className="text-purple-300">Impact:</span>
                          <span className="text-white font-medium">{selectedEvent.details.impact}</span>
                        </div>
                      )}

                      {selectedEvent.details?.duration && (
                        <div className="flex justify-between items-center">
                          <span className="text-purple-300">Duration:</span>
                          <span className="text-white font-medium">{selectedEvent.details.duration}ms</span>
                        </div>
                      )}

                      {selectedEvent.details?.goalId && (
                        <div className="flex justify-between items-center">
                          <span className="text-purple-300">Goal ID:</span>
                          <span className="text-white font-mono text-xs">{selectedEvent.details.goalId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedEvent.details?.tags && selectedEvent.details.tags.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium text-white mb-3">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedEvent.details.tags.map((tag, index) => (
                          <span 
                            key={index}
                            className="bg-purple-500/20 text-purple-200 px-2 py-1 rounded text-xs border border-purple-400/30"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedEvent.details?.relatedEmotions && selectedEvent.details.relatedEmotions.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium text-white mb-3">Related Emotions</h4>
                      <div className="space-y-1">
                        {selectedEvent.details.relatedEmotions.map((emotion, index) => (
                          <div key={index} className="text-purple-200 text-sm">{emotion}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedEvent.details?.context && (
                    <div>
                      <h4 className="text-lg font-medium text-white mb-3">Context</h4>
                      <p className="text-purple-200 text-sm bg-black/20 p-3 rounded-lg border border-white/10">
                        {selectedEvent.details.context}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Stats */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6 text-purple-300">
            {viewMode === 'timeline' ? (
              <>
                <span>
                  Showing {filteredEvents.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredEvents.length)} of {filteredEvents.length} filtered events
                  {filteredEvents.length !== events.length && (
                    <span className="text-purple-400"> ({events.length} total)</span>
                  )}
                </span>
                {totalPages > 1 && (
                  <>
                    <span>•</span>
                    <span>Page {currentPage} of {totalPages}</span>
                  </>
                )}
              </>
            ) : viewMode === 'cards' ? (
              <>
                <span>
                  Showing {visibleCards} of {filteredEvents.length} filtered events
                  {filteredEvents.length !== events.length && (
                    <span className="text-purple-400"> ({events.length} total)</span>
                  )}
                </span>
                {visibleCards < filteredEvents.length && (
                  <>
                    <span>•</span>
                    <span>Scroll down to load more</span>
                  </>
                )}
              </>
            ) : (
              <span>
                Analyzing {filteredEvents.length} filtered events
                {filteredEvents.length !== events.length && (
                  <span className="text-purple-400"> ({events.length} total)</span>
                )}
              </span>
            )}
            {stats && (
              <>
                <span>•</span>
                <span>Event rate: {stats.eventVelocity.toFixed(1)}/min</span>
                <span>•</span>
                <span>Avg confidence: {Math.round(stats.averageConfidence * 100)}%</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2 text-purple-400">
            <Clock className="w-4 h-4" />
            <span>Live stream active</span>
          </div>
        </div>
      </div>
    </div>
  );
}