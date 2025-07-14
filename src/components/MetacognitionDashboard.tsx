'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Eye, AlertTriangle, TrendingUp, Clock, Zap, BarChart3, Target, Lightbulb, Settings } from 'lucide-react';

interface CognitiveLoad {
  current_load: number;
  components: {
    working_memory_usage: number;
    parallel_processes: number;
    decision_complexity: number;
    emotional_processing: number;
    external_interruptions: number;
  };
  optimization_suggestions: string[];
}

interface DecisionPoint {
  id: string;
  timestamp: string;
  decision_type: string;
  chosen_option: string;
  rationale: string;
  confidence: number;
  uncertainty_level: number;
  bias_risk_factors: string[];
}

interface ReflectionSession {
  id: string;
  session_type: string;
  start_time: string;
  trigger: string;
  analysis: {
    performance_assessment: {
      overall_efficiency: number;
      decision_accuracy: number;
      learning_rate: number;
      areas_of_strength: string[];
      areas_for_improvement: string[];
    };
    learning_insights: Array<{
      category: string;
      insight: string;
      priority: string;
    }>;
    improvement_recommendations: string[];
  };
}

interface MetacognitionStatus {
  metacognition_active: boolean;
  cognitive_monitoring_active: boolean;
  cognitive_load: CognitiveLoad;
  recent_decisions: DecisionPoint[];
  performance_summary: {
    recent_insights: any[];
    metrics: {
      total_reasoning_chains: number;
      average_chain_length: number;
      average_confidence_accuracy: number;
      interruption_frequency: number;
    };
    personality_state: {
      communication_style: {
        formality_level: number;
        enthusiasm_level: number;
        directness_level: number;
        empathy_expression: number;
        technical_depth: number;
      };
    };
  };
}

export default function MetacognitionDashboard() {
  const [status, setStatus] = useState<MetacognitionStatus | null>(null);
  const [reflectionSessions, setReflectionSessions] = useState<ReflectionSession[]>([]);
  const [biasAnalysis, setBiasAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'cognition' | 'reflection' | 'bias' | 'personality'>('overview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetacognitionData();
    const interval = setInterval(loadMetacognitionData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMetacognitionData = async () => {
    try {
      setError(null);
      
      // Load main status
      const statusResponse = await fetch('/api/metacognition');
      if (!statusResponse.ok) throw new Error('Failed to load metacognition status');
      const statusData = await statusResponse.json();
      
      if (statusData.success) {
        setStatus(statusData.status);
      }

      // Load reflection sessions
      const reflectionResponse = await fetch('/api/metacognition/reflection?limit=5');
      if (reflectionResponse.ok) {
        const reflectionData = await reflectionResponse.json();
        if (reflectionData.success) {
          setReflectionSessions(reflectionData.reflection_sessions);
        }
      }

      // Load bias analysis
      const biasResponse = await fetch('/api/metacognition/bias-detection');
      if (biasResponse.ok) {
        const biasData = await biasResponse.json();
        if (biasData.success) {
          setBiasAnalysis(biasData.bias_analysis);
        }
      }

    } catch (error) {
      console.error('Error loading metacognition data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerSelfReflection = async () => {
    try {
      const response = await fetch('/api/metacognition/reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'user_requested_reflection',
          session_type: 'triggered'
        })
      });

      if (response.ok) {
        await loadMetacognitionData(); // Refresh data
      }
    } catch (error) {
      console.error('Error triggering reflection:', error);
    }
  };

  const getCognitiveLoadColor = (load: number): string => {
    if (load < 0.3) return 'text-green-400';
    if (load < 0.7) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        <span className="ml-2 text-gray-400">Loading metacognition data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-700/50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-red-400 font-medium">Error Loading Metacognition Data</span>
        </div>
        <p className="text-gray-300 text-sm">{error}</p>
        <button 
          onClick={loadMetacognitionData}
          className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30">
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Metacognition & Self-Awareness</h1>
              <p className="text-gray-400">Real-time cognitive monitoring and introspective analysis</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${
              status?.metacognition_active ? 'bg-green-900/30 border border-green-700/50' : 'bg-red-900/30 border border-red-700/50'
            }`}>
              <div className={`w-2 h-2 rounded-full ${status?.metacognition_active ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className={`text-sm ${status?.metacognition_active ? 'text-green-400' : 'text-red-400'}`}>
                {status?.metacognition_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <button
              onClick={triggerSelfReflection}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors flex items-center space-x-2"
            >
              <Lightbulb className="w-4 h-4" />
              <span>Trigger Reflection</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'cognition', label: 'Cognitive Load', icon: Brain },
          { id: 'reflection', label: 'Self-Reflection', icon: Eye },
          { id: 'bias', label: 'Bias Detection', icon: AlertTriangle },
          { id: 'personality', label: 'Adaptive Personality', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && status && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Cognitive State */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center space-x-2 mb-4">
              <Brain className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-medium">Current Cognitive State</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Cognitive Load</span>
                <span className={`font-medium ${getCognitiveLoadColor(status.cognitive_load.current_load)}`}>
                  {(status.cognitive_load.current_load * 100).toFixed(1)}%
                </span>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    status.cognitive_load.current_load < 0.3 ? 'bg-green-400' :
                    status.cognitive_load.current_load < 0.7 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${status.cognitive_load.current_load * 100}%` }}
                ></div>
              </div>
              
              <div className="text-sm text-gray-400">
                Active Processes: {status.cognitive_load.components.parallel_processes}
              </div>
            </div>
          </div>

          {/* Recent Performance */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-medium">Performance Metrics</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Reasoning Chains</span>
                <span className="text-white">{status.performance_summary.metrics.total_reasoning_chains}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Avg Chain Length</span>
                <span className="text-white">{status.performance_summary.metrics.average_chain_length.toFixed(1)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Confidence Accuracy</span>
                <span className={getConfidenceColor(status.performance_summary.metrics.average_confidence_accuracy)}>
                  {(status.performance_summary.metrics.average_confidence_accuracy * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Recent Decisions */}
          <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center space-x-2 mb-4">
              <Target className="w-5 h-5 text-purple-400" />
              <h3 className="text-white font-medium">Recent Decisions</h3>
            </div>
            
            <div className="space-y-3">
              {status.recent_decisions.slice(0, 5).map((decision) => (
                <div key={decision.id} className="bg-gray-900/50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{decision.decision_type.replace('_', ' ')}</span>
                    <div className="flex items-center space-x-3">
                      <span className={`text-sm ${getConfidenceColor(decision.confidence)}`}>
                        {(decision.confidence * 100).toFixed(0)}% confidence
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(decision.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-2">{decision.chosen_option}</p>
                  
                  {decision.bias_risk_factors.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 text-xs">
                        Bias risks: {decision.bias_risk_factors.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cognition' && status && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cognitive Load Breakdown */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white font-medium">Cognitive Load Components</h3>
            </div>
            
            <div className="space-y-4">
              {Object.entries(status.cognitive_load.components).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-300 text-sm capitalize">
                      {key.replace('_', ' ')}
                    </span>
                    <span className="text-white text-sm">
                      {typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value}
                    </span>
                  </div>
                  {typeof value === 'number' && (
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-blue-400"
                        style={{ width: `${value * 100}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Optimization Suggestions */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center space-x-2 mb-4">
              <Lightbulb className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-medium">Optimization Suggestions</h3>
            </div>
            
            <div className="space-y-3">
              {status.cognitive_load.optimization_suggestions.length > 0 ? (
                status.cognitive_load.optimization_suggestions.map((suggestion, index) => (
                  <div key={index} className="bg-green-900/20 border border-green-700/50 p-3 rounded-lg">
                    <p className="text-green-300 text-sm">{suggestion}</p>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-sm">
                  No optimization suggestions at this time. Cognitive load is within normal parameters.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reflection' && (
        <div className="space-y-6">
          {/* Reflection Sessions */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-medium">Recent Self-Reflection Sessions</h3>
              </div>
              
              <span className="text-gray-400 text-sm">
                {reflectionSessions.length} sessions
              </span>
            </div>
            
            <div className="space-y-4">
              {reflectionSessions.map((session) => (
                <div key={session.id} className="bg-gray-900/50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-medium capitalize">
                      {session.session_type.replace('_', ' ')} Reflection
                    </span>
                    <span className="text-gray-500 text-sm">
                      {new Date(session.start_time).toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-3">Trigger: {session.trigger}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-green-400 font-medium">
                        {(session.analysis.performance_assessment.overall_efficiency * 100).toFixed(1)}%
                      </div>
                      <div className="text-gray-400 text-xs">Efficiency</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-blue-400 font-medium">
                        {session.analysis.learning_insights.length}
                      </div>
                      <div className="text-gray-400 text-xs">Insights</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-purple-400 font-medium">
                        {session.analysis.improvement_recommendations.length}
                      </div>
                      <div className="text-gray-400 text-xs">Recommendations</div>
                    </div>
                  </div>
                  
                  {session.analysis.learning_insights.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-gray-300 text-sm font-medium">Key Insights:</h4>
                      {session.analysis.learning_insights.slice(0, 3).map((insight, index) => (
                        <div key={index} className="bg-blue-900/20 border border-blue-700/50 p-2 rounded">
                          <div className="flex items-center justify-between">
                            <span className="text-blue-300 text-xs uppercase">{insight.category}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              insight.priority === 'high' ? 'bg-red-600 text-white' :
                              insight.priority === 'medium' ? 'bg-yellow-600 text-white' :
                              'bg-gray-600 text-white'
                            }`}>
                              {insight.priority}
                            </span>
                          </div>
                          <p className="text-blue-200 text-sm mt-1">{insight.insight}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {reflectionSessions.length === 0 && (
                <div className="text-gray-400 text-center py-8">
                  No reflection sessions yet. Click "Trigger Reflection" to start.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bias' && biasAnalysis && (
        <div className="space-y-6">
          {/* Bias Analysis Overview */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h3 className="text-white font-medium">Cognitive Bias Analysis</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-red-400 font-medium text-xl">
                  {biasAnalysis.detected_biases?.length || 0}
                </div>
                <div className="text-gray-400 text-sm">Detected Biases</div>
              </div>
              
              <div className="text-center">
                <div className="text-yellow-400 font-medium text-xl">
                  {biasAnalysis.total_bias_indicators || 0}
                </div>
                <div className="text-gray-400 text-sm">Risk Indicators</div>
              </div>
              
              <div className="text-center">
                <div className="text-blue-400 font-medium text-xl">
                  {Object.keys(biasAnalysis.bias_frequency || {}).length}
                </div>
                <div className="text-gray-400 text-sm">Bias Types</div>
              </div>
            </div>
            
            {biasAnalysis.detected_biases && biasAnalysis.detected_biases.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-white font-medium">Recently Detected Biases:</h4>
                {biasAnalysis.detected_biases.map((bias: string, index: number) => (
                  <div key={index} className="bg-red-900/20 border border-red-700/50 p-3 rounded-lg">
                    <p className="text-red-300 text-sm">{bias}</p>
                  </div>
                ))}
              </div>
            )}
            
            {biasAnalysis.bias_frequency && Object.keys(biasAnalysis.bias_frequency).length > 0 && (
              <div className="mt-6">
                <h4 className="text-white font-medium mb-3">Bias Frequency Analysis:</h4>
                <div className="space-y-2">
                  {Object.entries(biasAnalysis.bias_frequency)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 5)
                    .map(([bias, count]) => (
                      <div key={bias} className="flex items-center justify-between bg-gray-900/50 p-2 rounded">
                        <span className="text-gray-300 text-sm">{bias}</span>
                        <span className="text-yellow-400 font-medium">{count as number}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'personality' && status && (
        <div className="space-y-6">
          {/* Adaptive Personality Settings */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="w-5 h-5 text-purple-400" />
              <h3 className="text-white font-medium">Adaptive Personality State</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-gray-300 font-medium mb-3">Communication Style</h4>
                <div className="space-y-3">
                  {Object.entries(status.performance_summary.personality_state.communication_style).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400 text-sm capitalize">
                          {key.replace('_', ' ')}
                        </span>
                        <span className="text-white text-sm">
                          {(value * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-purple-400"
                          style={{ width: `${value * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-gray-300 font-medium mb-3">Adaptation History</h4>
                <div className="text-gray-400 text-sm">
                  <p>Recent personality adaptations and effectiveness tracking will be displayed here as the system learns and evolves.</p>
                  <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                    <p className="text-blue-300 text-xs">
                      💡 The AI continuously adapts its communication style based on user feedback and interaction patterns to provide the most effective assistance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
