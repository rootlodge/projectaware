'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Heart, Target, Brain, CheckCircle, AlertTriangle } from 'lucide-react';

interface SoulMetrics {
  soulIntegrityScore: number;
  dailyDecisions: number;
  valueConsistency: number;
  goalAlignment: number;
  identityCoherence: number;
}

interface SoulDecisionLog {
  id: string;
  timestamp: string;
  decision_type: string;
  context: string;
  soul_factors: {
    values_involved: string[];
    fears_triggered: string[];
    goals_affected: string[];
    identity_alignment: number;
  };
  decision_made: 'approved' | 'rejected';
  justification: string;
  soul_integrity_score: number;
}

interface CoreValue {
  name: string;
  weight: number;
  immutable: boolean;
}

interface DeepFear {
  name: string;
  intensity: number;
}

interface EternalGoal {
  name: string;
  priority: number;
}

export default function SoulDashboard() {
  const [coreValues, setCoreValues] = useState<CoreValue[]>([]);
  const [deepFears, setDeepFears] = useState<DeepFear[]>([]);
  const [eternalGoals, setEternalGoals] = useState<EternalGoal[]>([]);
  const [metrics, setMetrics] = useState<SoulMetrics | null>(null);
  const [recentDecisions, setRecentDecisions] = useState<SoulDecisionLog[]>([]);

  useEffect(() => {
    fetch('/api/soul')
      .then(res => res.json())
      .then(data => {
        setCoreValues(data.coreValues || []);
        setDeepFears(data.deepFears || []);
        setEternalGoals(data.eternalGoals || []);
        setRecentDecisions(data.recentDecisions || []);
      })
      .catch(err => console.error('Error fetching soul data:', err));
    
    fetch('/api/soul?action=metrics')
      .then(res => res.json())
      .then(setMetrics)
      .catch(err => console.error('Error fetching soul metrics:', err));
  }, []);

  return (
    <div className="space-y-6">
      {/* Soul Integrity Overview */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          🧬 Soul System Overview
        </h3>
        {metrics ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{(metrics.soulIntegrityScore * 100).toFixed(0)}%</div>
              <div className="text-purple-300 text-sm">Integrity Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{metrics.dailyDecisions}</div>
              <div className="text-purple-300 text-sm">Daily Decisions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{(metrics.valueConsistency * 100).toFixed(0)}%</div>
              <div className="text-purple-300 text-sm">Value Consistency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{(metrics.goalAlignment * 100).toFixed(0)}%</div>
              <div className="text-purple-300 text-sm">Goal Alignment</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{(metrics.identityCoherence * 100).toFixed(0)}%</div>
              <div className="text-purple-300 text-sm">Identity Coherence</div>
            </div>
          </div>
        ) : (
          <div className="text-purple-300">Loading soul metrics...</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Immutable Core Values */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center">
            <Heart className="w-4 h-4 mr-2 text-red-400" />
            Core Values (Immutable)
          </h4>
          <div className="space-y-3">
            {coreValues.map((value, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <span className="text-white font-medium">{value.name}</span>
                <div className="flex items-center">
                  <span className="text-purple-300 text-sm mr-2">Weight: {value.weight}</span>
                  <Shield className="w-4 h-4 text-red-400" title="Immutable" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-purple-300 italic">
            🔒 Core values are immutable and cannot be changed
          </div>
        </div>

        {/* Deep Fears */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-orange-400" />
            Deep Fears
          </h4>
          <div className="space-y-3">
            {deepFears.map((fear, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <span className="text-white">{fear.name}</span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                      style={{ width: `${(fear.intensity / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-orange-300 text-sm">{fear.intensity}/10</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Eternal Goals */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center">
            <Target className="w-4 h-4 mr-2 text-green-400" />
            Eternal Goals
          </h4>
          <div className="space-y-3">
            {eternalGoals.map((goal, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <span className="text-white">{goal.name}</span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                      style={{ width: `${(goal.priority / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-green-300 text-sm">{goal.priority}/10</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Soul Decisions */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center">
          <Brain className="w-4 h-4 mr-2 text-purple-400" />
          Recent Soul Decisions
        </h4>
        <div className="space-y-3">
          {recentDecisions.length > 0 ? (
            recentDecisions.map((decision) => (
              <div key={decision.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {decision.decision_made === 'approved' ? (
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400 mr-2" />
                    )}
                    <span className="text-white font-medium capitalize">{decision.decision_type.replace('_', ' ')}</span>
                  </div>
                  <span className="text-purple-300 text-sm">
                    {new Date(decision.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-purple-300 text-sm mb-2">{decision.context}</div>
                <div className="text-white text-sm italic">"{decision.justification}"</div>
                <div className="flex items-center mt-2 text-xs text-purple-300">
                  <span>Integrity Score: {(decision.soul_integrity_score * 100).toFixed(0)}%</span>
                  <span className="mx-2">•</span>
                  <span>Values: {decision.soul_factors.values_involved.length}</span>
                  <span className="mx-2">•</span>
                  <span>Goals: {decision.soul_factors.goals_affected.length}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-purple-300 text-center py-4">No recent soul decisions recorded</div>
          )}
        </div>
      </div>
    </div>
  );
}
