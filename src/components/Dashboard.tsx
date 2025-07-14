'use client';

import React from 'react';
import MetacognitionDashboard from './MetacognitionDashboard';
import SelfModificationDashboard from './SelfModificationDashboard';
import SelfModificationWidget from './SelfModificationWidget';
import AutonomousThinkingWidget from './AutonomousThinkingWidget';

const EmotionTrendForecastPanel: React.FC = () => {
  const [forecast, setForecast] = React.useState<string[]>([]);
  const [trend, setTrend] = React.useState<'rising'|'falling'|'stable'>('stable');
  const [confidence, setConfidence] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const fetchForecast = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/emotions/forecast');
        if (!res.ok) throw new Error('Failed to fetch emotion trend forecast');
        const data = await res.json();
        if (!mounted) return;
        setForecast(data.forecast || []);
        setTrend(data.trend || 'stable');
        setConfidence(data.confidence ?? 0);
      } catch (err) {
        setError('Unable to load emotion trend forecast.');
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
    return () => { mounted = false; };
  }, []);

  return (
    <section aria-labelledby="emotion-trend-heading" className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mt-6" tabIndex={0}>
      <h3 id="emotion-trend-heading" className="text-xl font-bold text-white mb-4 flex items-center">
        <span role="img" aria-label="trend">📈</span>
        <span className="ml-2">Emotion Trend Forecast</span>
      </h3>
      {loading ? (
        <p aria-live="polite" className="text-purple-300">Loading...</p>
      ) : error ? (
        <p role="alert" className="text-red-400">{error}</p>
      ) : (
        <div>
          <dl>
            <dt className="text-purple-300">Forecasted Emotions</dt>
            <dd className="text-white mb-2">{forecast.length > 0 ? forecast.join(', ') : 'N/A'}</dd>
            <dt className="text-purple-300">Trend</dt>
            <dd className="text-white mb-2" aria-label={`Trend is ${trend}`}>{trend.charAt(0).toUpperCase() + trend.slice(1)}</dd>
            <dt className="text-purple-300">Confidence</dt>
            <dd className="text-white">{(confidence * 100).toFixed(0)}%</dd>
          </dl>
        </div>
      )}
    </section>
  );
};

import { useState, useEffect } from 'react';
// Utility fetcher for predictions
async function fetchPredictions() {
  try {
    const res = await fetch('/api/agents/predict');
    if (!res.ok) throw new Error('Failed to fetch predictions');
    return await res.json();
  } catch (err) {
    return { predictions: [], anticipatedNeeds: [], error: typeof err === 'object' && err && 'message' in err ? (err as any).message : String(err) };
  }
}
import { BarChart3, Brain, Users, Heart, Activity, Zap, Database, Clock } from 'lucide-react';
import SoulDashboard from './SoulDashboard';
import GoalDashboard from './GoalDashboard';

interface DashboardProps {
  systemStatus: any;
}

export default function Dashboard({ systemStatus }: DashboardProps) {
  // State for predictions and needs
  const [predictData, setPredictData] = useState<{ predictions: any[]; anticipatedNeeds: any[]; error?: string }>({ predictions: [], anticipatedNeeds: [] });
  const [loadingPredict, setLoadingPredict] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoadingPredict(true);
    fetchPredictions().then(data => {
      if (mounted) {
        setPredictData(data);
        setLoadingPredict(false);
      }
    });
    return () => { mounted = false; };
  }, []);
  const [metrics, setMetrics] = useState({
    cpu_usage: 0,
    memory_usage: 0,
    active_agents: 0,
    total_interactions: 0,
    emotional_stability: 0,
    learning_velocity: 0
  });

  useEffect(() => {
    // Simulate real-time metrics updates
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpu_usage: Math.max(0, Math.min(100, prev.cpu_usage + (Math.random() - 0.5) * 10)),
        memory_usage: Math.max(0, Math.min(100, prev.memory_usage + (Math.random() - 0.5) * 5)),
        active_agents: Math.floor(Math.random() * 8) + 2,
        total_interactions: prev.total_interactions + Math.floor(Math.random() * 3),
        emotional_stability: Math.max(0, Math.min(100, prev.emotional_stability + (Math.random() - 0.5) * 15)),
        learning_velocity: Math.max(0, Math.min(100, prev.learning_velocity + (Math.random() - 0.5) * 8))
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const cards = [
    {
      title: 'System Load',
      value: `${metrics.cpu_usage.toFixed(1)}%`,
      change: '+2.5%',
      icon: Activity,
      color: 'from-blue-500 to-cyan-500',
      textColor: 'text-blue-400'
    },
    {
      title: 'Memory Usage',
      value: `${metrics.memory_usage.toFixed(1)}%`,
      change: '+1.2%',
      icon: Database,
      color: 'from-purple-500 to-pink-500',
      textColor: 'text-purple-400'
    },
    {
      title: 'Active Agents',
      value: metrics.active_agents.toString(),
      change: '+3',
      icon: Users,
      color: 'from-green-500 to-emerald-500',
      textColor: 'text-green-400'
    },
    {
      title: 'Interactions',
      value: metrics.total_interactions.toString(),
      change: '+15',
      icon: Brain,
      color: 'from-orange-500 to-red-500',
      textColor: 'text-orange-400'
    },
    {
      title: 'Emotional Stability',
      value: `${metrics.emotional_stability.toFixed(1)}%`,
      change: '+5.3%',
      icon: Heart,
      color: 'from-pink-500 to-rose-500',
      textColor: 'text-pink-400'
    },
    {
      title: 'Learning Velocity',
      value: `${metrics.learning_velocity.toFixed(1)}%`,
      change: '+8.1%',
      icon: Zap,
      color: 'from-yellow-500 to-orange-500',
      textColor: 'text-yellow-400'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Advanced Autonomous Intelligence Section */}
      <section aria-labelledby="advanced-ai-heading" className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
        <h2 id="advanced-ai-heading" className="text-2xl font-bold text-white mb-4 flex items-center">
          <Zap className="w-6 h-6 mr-2 text-yellow-400" aria-hidden="true" />
          Advanced Autonomous Intelligence
        </h2>
        {loadingPredict ? (
          <div className="text-purple-300">Loading predictions...</div>
        ) : predictData.error ? (
          <div className="text-red-400">{predictData.error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-yellow-300 mb-2">Predicted Next Actions</h3>
              {predictData.predictions.length === 0 ? (
                <div className="text-purple-300">No predictions available.</div>
              ) : (
                <ul className="space-y-2">
                  {predictData.predictions.map((pred, idx) => (
                    <li key={idx} className="bg-yellow-500/10 rounded p-3 text-white flex flex-col" aria-label={`Prediction ${idx + 1}`}>
                      <span className="font-medium">{pred.action || JSON.stringify(pred)}</span>
                      {pred.confidence !== undefined && (
                        <span className="text-yellow-200 text-xs">Confidence: {(pred.confidence * 100).toFixed(1)}%</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-300 mb-2">Anticipated Needs</h3>
              {predictData.anticipatedNeeds.length === 0 ? (
                <div className="text-purple-300">No anticipated needs detected.</div>
              ) : (
                <ul className="space-y-2">
                  {predictData.anticipatedNeeds.map((need, idx) => (
                    <li key={idx} className="bg-green-500/10 rounded p-3 text-white flex flex-col" aria-label={`Anticipated need ${idx + 1}`}>
                      <span className="font-medium">{need.need || JSON.stringify(need)}</span>
                      {need.priority !== undefined && (
                        <span className="text-green-200 text-xs">Priority: {need.priority}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>
      {/* Welcome Section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome to {systemStatus?.identity?.name || 'ProjectAware'}
            </h2>
            <p className="text-purple-300 text-lg">
              {systemStatus?.identity?.mission || 'Advanced AI system dashboard and control center'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {new Date().toLocaleTimeString()}
            </div>
            <div className="text-purple-300">
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Self-Modification Status Widget */}
      <SelfModificationWidget />

      {/* Autonomous Thinking Status Widget */}
      <AutonomousThinkingWidget />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${card.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-green-400 text-sm font-medium">{card.change}</span>
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">{card.title}</h3>
              <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identity Status */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            Identity Status
          </h3>
          {systemStatus ? (
            <div className="space-y-3">
              <div>
                <span className="text-purple-300">Name: </span>
                <span className="text-white font-medium">{systemStatus.identity?.name}</span>
              </div>
              <div>
                <span className="text-purple-300">Mission: </span>
                <span className="text-white">{systemStatus.identity?.mission}</span>
              </div>
              <div>
                <span className="text-purple-300">Traits: </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {systemStatus.identity?.traits?.map((trait: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-purple-300">Loading identity information...</div>
          )}
        </div>

        {/* Emotional State + Trend Forecast */}
        <div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-4">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Heart className="w-5 h-5 mr-2" />
              Emotional State
            </h3>
            {systemStatus?.emotional_state ? (
              <div className="space-y-3">
                <div>
                  <span className="text-purple-300">Primary: </span>
                  <span className="text-white font-medium capitalize">
                    {systemStatus.emotional_state.primary}
                  </span>
                </div>
                <div>
                  <span className="text-purple-300">Intensity: </span>
                  <div className="flex items-center mt-2">
                    <div className="w-full bg-gray-700 rounded-full h-2 mr-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(systemStatus.emotional_state.intensity || 0.5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-white text-sm">
                      {((systemStatus.emotional_state.intensity || 0.5) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-purple-300">Secondary: </span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {systemStatus.emotional_state.secondary?.map((emotion: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-sm"
                      >
                        {emotion}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-purple-300">Loading emotional state...</div>
            )}
          </div>
          <EmotionTrendForecastPanel />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
            <span className="text-purple-300">{new Date().toLocaleTimeString()}</span>
            <span className="text-white ml-3">System initialized successfully</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
            <span className="text-purple-300">{new Date(Date.now() - 30000).toLocaleTimeString()}</span>
            <span className="text-white ml-3">Central brain agent activated</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
            <span className="text-purple-300">{new Date(Date.now() - 60000).toLocaleTimeString()}</span>
            <span className="text-white ml-3">Multi-agent manager started</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
            <span className="text-purple-300">{new Date(Date.now() - 90000).toLocaleTimeString()}</span>
            <span className="text-white ml-3">Emotion engine calibrated</span>
          </div>
        </div>
      </div>

      {/* Metacognition & Self-Awareness Dashboard */}
      <MetacognitionDashboard />

      {/* Soul System Dashboard */}
      <SoulDashboard />

      {/* Goal Engine Dashboard */}
      <GoalDashboard />
    </div>
  );
}
