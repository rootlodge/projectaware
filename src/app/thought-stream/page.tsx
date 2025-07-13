'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ThoughtEvent } from '@/lib/core/ThoughtStream';

// Event type colors and icons
const EVENT_CONFIG = {
  reflection: { color: 'bg-purple-100 border-purple-300 text-purple-800', icon: '🔮', label: 'Reflection' },
  thought: { color: 'bg-blue-100 border-blue-300 text-blue-800', icon: '💭', label: 'Thought' },
  action: { color: 'bg-green-100 border-green-300 text-green-800', icon: '⚡', label: 'Action' },
  emotion: { color: 'bg-red-100 border-red-300 text-red-800', icon: '❤️', label: 'Emotion' },
  memory: { color: 'bg-yellow-100 border-yellow-300 text-yellow-800', icon: '🧠', label: 'Memory' },
  goal: { color: 'bg-indigo-100 border-indigo-300 text-indigo-800', icon: '🎯', label: 'Goal' },
  learning: { color: 'bg-teal-100 border-teal-300 text-teal-800', icon: '📚', label: 'Learning' },
  prediction: { color: 'bg-orange-100 border-orange-300 text-orange-800', icon: '🔮', label: 'Prediction' },
  decision: { color: 'bg-gray-100 border-gray-300 text-gray-800', icon: '⚖️', label: 'Decision' },
  observation: { color: 'bg-green-100 border-green-300 text-green-800', icon: '👁️', label: 'Observation' },
  insight: { color: 'bg-violet-100 border-violet-300 text-violet-800', icon: '💡', label: 'Insight' },
  collaboration: { color: 'bg-pink-100 border-pink-300 text-pink-800', icon: '🤝', label: 'Collaboration' },
  adaptation: { color: 'bg-cyan-100 border-cyan-300 text-cyan-800', icon: '🔄', label: 'Adaptation' },
  creativity: { color: 'bg-rose-100 border-rose-300 text-rose-800', icon: '🎨', label: 'Creativity' },
  validation: { color: 'bg-emerald-100 border-emerald-300 text-emerald-800', icon: '✅', label: 'Validation' },
  error: { color: 'bg-red-200 border-red-400 text-red-900', icon: '❌', label: 'Error' },
  confidence: { color: 'bg-indigo-100 border-indigo-300 text-indigo-800', icon: '📊', label: 'Confidence' },
  reasoning: { color: 'bg-blue-100 border-blue-300 text-blue-800', icon: '🤔', label: 'Reasoning' },
  tree: { color: 'bg-green-100 border-green-300 text-green-800', icon: '🌳', label: 'Decision Tree' },
  system: { color: 'bg-gray-100 border-gray-300 text-gray-800', icon: '⚙️', label: 'System' },
  user_interaction: { color: 'bg-blue-100 border-blue-300 text-blue-800', icon: '👤', label: 'User Interaction' }
};

const PRIORITY_COLORS = {
  low: 'text-gray-500',
  medium: 'text-blue-600',
  high: 'text-orange-600',
  critical: 'text-red-600'
};

interface Filters {
  type: string;
  priority: string;
  confidence: { min: number; max: number };
  timeRange: string;
  search: string;
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
    search: ''
  });
  const [viewMode, setViewMode] = useState<'timeline' | 'cards' | 'analytics'>('timeline');
  const [isRecording, setIsRecording] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);

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
      } else if (data.type === 'event') {
        setEvents(prev => [...prev, data.event]);
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
  }, []);

  // Filter events based on current filters
  const filteredEvents = events.filter(event => {
    if (filters.type !== 'all' && event.type !== filters.type) return false;
    if (filters.priority !== 'all' && event.details?.priority !== filters.priority) return false;
    if (event.confidence !== undefined && 
        (event.confidence < filters.confidence.min || event.confidence > filters.confidence.max)) return false;
    
    if (filters.timeRange !== 'all') {
      const eventTime = new Date(event.timestamp).getTime();
      const now = Date.now();
      const ranges = {
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
      };
      const range = ranges[filters.timeRange as keyof typeof ranges];
      if (range && eventTime < now - range) return false;
    }

    if (filters.search && !event.content.toLowerCase().includes(filters.search.toLowerCase()) &&
        !event.details?.context?.toLowerCase().includes(filters.search.toLowerCase())) return false;

    return true;
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const renderEventCard = (event: ThoughtEvent, index: number) => {
    const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.thought;
    
    return (
      <div
        key={`${event.timestamp}-${index}`}
        className={`p-4 rounded-lg border-l-4 ${config.color} cursor-pointer hover:shadow-md transition-shadow`}
        onClick={() => setSelectedEvent(event)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{config.icon}</span>
            <span className="font-semibold text-sm">{config.label}</span>
            {event.details?.priority && (
              <span className={`text-xs font-medium ${PRIORITY_COLORS[event.details.priority as keyof typeof PRIORITY_COLORS]}`}>
                {event.details.priority.toUpperCase()}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {formatTimestamp(event.timestamp)}
          </div>
        </div>
        
        <p className="text-gray-700 mb-2 line-clamp-3">{event.content}</p>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            {event.confidence !== undefined && (
              <span>Confidence: {Math.round(event.confidence * 100)}%</span>
            )}
            {event.details?.goalId && (
              <span>Goal: {event.details.goalId.slice(0, 8)}...</span>
            )}
          </div>
          {event.details?.tags && event.details.tags.length > 0 && (
            <div className="flex space-x-1">
              {event.details.tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="bg-gray-200 px-2 py-1 rounded text-xs">
                  {tag}
                </span>
              ))}
              {event.details.tags.length > 3 && (
                <span className="text-gray-400">+{event.details.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTimeline = () => (
    <div className="space-y-4">
      {filteredEvents.map((event, index) => (
        <div key={`${event.timestamp}-${index}`} className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
          <div className="flex-1">
            {renderEventCard(event, index)}
          </div>
        </div>
      ))}
    </div>
  );

  const renderAnalytics = () => {
    if (!analytics) return <div>Loading analytics...</div>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Event Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Events:</span>
              <span className="font-medium">{analytics.totalEvents}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Confidence:</span>
              <span className="font-medium">{Math.round(analytics.averageConfidence * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Session Duration:</span>
              <span className="font-medium">{Math.round(analytics.sessionDuration / 60000)}m</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Events by Type</h3>
          <div className="space-y-2">
            {Object.entries(analytics.eventsByType).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span>{EVENT_CONFIG[type as keyof typeof EVENT_CONFIG]?.icon || '📝'}</span>
                  <span className="capitalize">{type}</span>
                </div>
                <span className="font-medium">{count as number}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-2">
            {analytics.recentActivity.map((bucket: any, index: number) => (
              <div key={index} className="flex justify-between">
                <span className="text-sm text-gray-600">
                  {new Date(bucket.timestamp).toLocaleTimeString()}
                </span>
                <span className="font-medium">{bucket.count}</span>
              </div>
            ))}
          </div>
        </div>
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
