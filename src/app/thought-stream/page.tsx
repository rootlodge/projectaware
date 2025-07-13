'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const eventSourceRef = useRef<EventSource | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to SSE endpoint
    eventSourceRef.current = new EventSource('/api/thought-stream');
    
    eventSourceRef.current.onopen = () => {
      setIsConnected(true);
    };

    eventSourceRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'history') {
        setEvents(data.events);
      } else if (data.type === 'analytics') {
        setAnalytics(data.analytics);
        updateStats(data.analytics);
      } else if (data.type === 'event') {
        setEvents(prev => {
          const newEvents = [...prev, data.event];
          if (autoScroll && scrollRef.current) {
            setTimeout(() => {
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            }, 100);
          }
          return newEvents;
        });
      }
    };

    eventSourceRef.current.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [autoScroll]);

  const updateStats = (analyticsData: any) => {
    if (!analyticsData) return;
    
    const totalEvents = analyticsData.totalEvents || 0;
    const sessionDuration = analyticsData.sessionDuration || 0;
    const eventVelocity = sessionDuration > 0 ? (totalEvents / (sessionDuration / 60000)) : 0; // events per minute
    
    // Extract top tags from events
    const tagCounts: Record<string, number> = {};
    events.forEach(event => {
      event.details?.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    const topTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);

    setStats({
      totalEvents,
      averageConfidence: analyticsData.averageConfidence || 0,
      sessionDuration,
      eventVelocity,
      topTags,
      confidenceTrend: [] // Would need historical data for this
    });
  };

  // Advanced filtering with tags and full-text search
  const filteredEvents = events.filter(event => {
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

  const generateTestEvents = async () => {
    try {
      const response = await fetch('/api/test-thought-stream', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        console.log(`Generated ${result.events} test events`);
      }
    } catch (error) {
      console.error('Failed to generate test events:', error);
    }
  };

  const renderEventCard = (event: ThoughtEvent, index: number) => {
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
  };

  const renderTimeline = () => (
    <div className="space-y-6" ref={scrollRef}>
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
          <p className="text-purple-300 text-lg mb-2">No thought events found</p>
          <p className="text-purple-400 text-sm mb-6">
            The cognitive stream will populate as the system processes thoughts
          </p>
          <button
            onClick={generateTestEvents}
            className="px-6 py-3 bg-purple-500/20 text-purple-200 rounded-lg border border-purple-400/30 hover:bg-purple-500/30 transition-colors"
          >
            Generate Test Events
          </button>
        </div>
      ) : (
        filteredEvents.map((event, index) => (
          <div key={`${event.timestamp}-${index}`} className="flex items-start space-x-6">
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 bg-purple-400 rounded-full flex-shrink-0"></div>
              {index < filteredEvents.length - 1 && (
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
  );

  const renderCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {filteredEvents.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
          <p className="text-purple-300 text-lg mb-2">No thought events found</p>
          <p className="text-purple-400 text-sm mb-6">
            Adjust your filters or generate test events to see cognitive activity
          </p>
          <button
            onClick={generateTestEvents}
            className="px-6 py-3 bg-purple-500/20 text-purple-200 rounded-lg border border-purple-400/30 hover:bg-purple-500/30 transition-colors"
          >
            Generate Test Events
          </button>
        </div>
      ) : (
        filteredEvents.map((event, index) => renderEventCard(event, index))
      )}
    </div>
  );

  const renderAnalytics = () => {
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
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Thought Stream</h1>
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          <p className="text-gray-600">
            Real-time visualization of cognitive processes and decision-making patterns
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-4 py-2 rounded ${viewMode === 'timeline' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-4 py-2 rounded ${viewMode === 'cards' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className={`px-4 py-2 rounded ${viewMode === 'analytics' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Analytics
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Recording:</span>
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`w-12 h-6 rounded-full ${isRecording ? 'bg-green-500' : 'bg-gray-300'} relative transition-colors`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    isRecording ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="border rounded p-2"
            >
              <option value="all">All Types</option>
              {Object.entries(EVENT_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="border rounded p-2"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            <select
              value={filters.timeRange}
              onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
              className="border rounded p-2"
            >
              <option value="all">All Time</option>
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>

            <input
              type="text"
              placeholder="Search events..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="border rounded p-2"
            />
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          {viewMode === 'timeline' && renderTimeline()}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map((event, index) => renderEventCard(event, index))}
            </div>
          )}
          {viewMode === 'analytics' && renderAnalytics()}
        </div>

        {/* Event Detail Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Event Details</h3>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <span className="font-medium">Type:</span> {selectedEvent.type}
                </div>
                <div>
                  <span className="font-medium">Content:</span> {selectedEvent.content}
                </div>
                <div>
                  <span className="font-medium">Timestamp:</span> {new Date(selectedEvent.timestamp).toLocaleString()}
                </div>
                {selectedEvent.confidence !== undefined && (
                  <div>
                    <span className="font-medium">Confidence:</span> {Math.round(selectedEvent.confidence * 100)}%
                  </div>
                )}
                {selectedEvent.details && (
                  <div>
                    <span className="font-medium">Details:</span>
                    <pre className="bg-gray-100 p-3 rounded mt-2 text-sm overflow-x-auto">
                      {JSON.stringify(selectedEvent.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Footer */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing {filteredEvents.length} of {events.length} events</span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
