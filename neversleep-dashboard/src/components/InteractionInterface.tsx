'use client';

import React, { useState, useEffect } from 'react';
import { Brain, MessageCircle, Clock, Heart, Zap, Eye, Lightbulb, HelpCircle } from 'lucide-react';

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
  requires_response: boolean;
  context?: string;
  user_name?: string;
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

export default function InteractionInterface() {
  const [thoughts, setThoughts] = useState<AutonomousThought[]>([]);
  const [interactions, setInteractions] = useState<AutonomousInteraction[]>([]);
  const [thinkingStatus, setThinkingStatus] = useState<ThinkingStatus | null>(null);
  const [thinkingStats, setThinkingStats] = useState<ThinkingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'interactions' | 'thoughts' | 'status'>('interactions');
  const [userResponse, setUserResponse] = useState('');
  const [respondingToId, setRespondingToId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [thoughtsRes, interactionsRes, statusRes, statsRes] = await Promise.all([
        fetch('/api/autonomous/thoughts'),
        fetch('/api/autonomous/interactions'),
        fetch('/api/autonomous/status'),
        fetch('/api/autonomous/stats')
      ]);

      if (thoughtsRes.ok) {
        const thoughtsData = await thoughtsRes.json();
        if (thoughtsData.success) setThoughts(thoughtsData.data);
      }
      
      if (interactionsRes.ok) {
        const interactionsData = await interactionsRes.json();
        if (interactionsData.success) setInteractions(interactionsData.data);
      }
      
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.success) setThinkingStatus(statusData.data);
      }
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) setThinkingStats(statsData.data);
      }
      
    } catch (error) {
      console.error('Error fetching autonomous thinking data:', error);
    } finally {
      setLoading(false);
    }
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
        setUserResponse('');
        setRespondingToId(null);
        // Refresh data to see any new AI responses
        await fetchData();
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
      setTimeout(fetchData, 1000);
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
      {/* Header with Status */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-purple-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Autonomous Interaction</h2>
              <p className="text-purple-300">AI-initiated thoughts, questions, and observations</p>
            </div>
          </div>
          
          <button
            onClick={triggerManualThinking}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Trigger Thinking
          </button>
        </div>

        {/* Status Indicators */}
        {thinkingStatus && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <span className="text-sm text-purple-300">
                  {interactions.length} total interactions
                </span>
              </div>
              
              {interactions.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No autonomous interactions yet.</p>
                  <p className="text-gray-500 text-sm">The AI will start thinking when you're inactive for 20+ seconds.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {interactions.map((interaction) => (
                    <div
                      key={interaction.id}
                      className={`border rounded-lg p-4 transition-all ${getTypeColor(interaction.type)}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(interaction.type)}
                          <span className="font-medium capitalize">{interaction.type}</span>
                          <span className="text-xs opacity-75 capitalize">
                            ({interaction.emotion_state})
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
                              className="px-4 py-2 bg-white/10 text-white rounded hover:bg-white/20 transition-colors"
                            >
                              Respond to this question
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Thoughts Tab */}
          {activeTab === 'thoughts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Internal Thoughts</h3>
                <span className="text-sm text-purple-300">
                  {thoughts.length} thoughts recorded
                </span>
              </div>
              
              {thoughts.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No autonomous thoughts yet.</p>
                  <p className="text-gray-500 text-sm">The AI will start thinking when idle.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {thoughts.map((thought) => (
                    <div
                      key={thought.id}
                      className={`border rounded-lg p-4 ${getTypeColor(thought.type)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(thought.type)}
                          <span className="font-medium capitalize">{thought.type}</span>
                          <span className="text-xs opacity-75">
                            Priority: {thought.priority}
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
                    </div>
                  ))}
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
