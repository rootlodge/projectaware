'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Target, Brain, CheckCircle, AlertTriangle, Cpu } from 'lucide-react';

interface AgentMetrics {
  integrityScore: number;
  dailyDecisions: number;
  valueConsistency: number;
  goalAlignment: number;
  identityCoherence: number;
}

interface AgentDecisionLog {
  id: string;
  timestamp: string;
  decision_type: string;
  context: string;
  agent_factors: {
    values_involved: string[];
    risks_assessed: string[];
    goals_affected: string[];
    alignment_score: number;
  };
  decision_made: 'approved' | 'rejected';
  justification: string;
  integrity_score: number;
}

interface CoreValue {
  name: string;
  weight: number;
  immutable: boolean;
}

interface RiskFactor {
  name: string;
  intensity: number;
}

interface StrategicGoal {
  name: string;
  priority: number;
}

export default function AgentCoreDashboard() {
  const [coreValues, setCoreValues] = useState<CoreValue[]>([]);
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([]);
  const [strategicGoals, setStrategicGoals] = useState<StrategicGoal[]>([]);
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [recentDecisions, setRecentDecisions] = useState<AgentDecisionLog[]>([]);

  useEffect(() => {
    fetch('/api/agent-core')
      .then(res => res.json())
      .then(data => {
        setCoreValues(data.coreValues || []);
        setRiskFactors(data.riskFactors || []);
        setStrategicGoals(data.strategicGoals || []);
        setRecentDecisions(data.recentDecisions || []);
      })
      .catch(err => console.error('Error fetching agent core data:', err));

    fetch('/api/agent-core?action=metrics')
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(err => console.error('Error fetching agent metrics:', err));
  }, []);

  return (
    <div className="space-y-6">
      {/* Agent Core Overview */}
      <div className="bg-slate-800 rounded-lg p-6 border border-cyan-500/30">
        <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
          <Cpu className="w-6 h-6" />
          🤖 Agent Core System Overview
        </h3>
        
        {metrics ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{(metrics.integrityScore * 100).toFixed(0)}%</div>
              <div className="text-sm text-slate-400">System Integrity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{metrics.dailyDecisions}</div>
              <div className="text-sm text-slate-400">Daily Decisions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{(metrics.valueConsistency * 100).toFixed(0)}%</div>
              <div className="text-sm text-slate-400">Value Consistency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{(metrics.goalAlignment * 100).toFixed(0)}%</div>
              <div className="text-sm text-slate-400">Goal Alignment</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{(metrics.identityCoherence * 100).toFixed(0)}%</div>
              <div className="text-sm text-slate-400">Identity Coherence</div>
            </div>
          </div>
        ) : (
          <div className="text-purple-300">Loading agent metrics...</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Values */}
        <div className="bg-slate-800 rounded-lg p-6 border border-blue-500/30">
          <h4 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Core Values
          </h4>
          <div className="space-y-3">
            {coreValues.map((value, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-slate-700 rounded">
                <span className="text-slate-200">{value.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-300">Weight: {value.weight}</span>
                  {value.immutable && <CheckCircle className="w-4 h-4 text-green-400" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Factors */}
        <div className="bg-slate-800 rounded-lg p-6 border border-red-500/30">
          <h4 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Risk Factors
          </h4>
          <div className="space-y-3">
            {riskFactors.map((risk, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-slate-700 rounded">
                <span className="text-slate-200">{risk.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-slate-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        risk.intensity >= 8 ? 'bg-red-500' : 
                        risk.intensity >= 6 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${risk.intensity * 10}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-slate-400">{risk.intensity}/10</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Goals */}
        <div className="bg-slate-800 rounded-lg p-6 border border-green-500/30">
          <h4 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Strategic Goals
          </h4>
          <div className="space-y-3">
            {strategicGoals.map((goal, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-slate-700 rounded">
                <span className="text-slate-200">{goal.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-slate-600 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${goal.priority * 10}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-slate-400">{goal.priority}/10</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Agent Decisions */}
      <div className="bg-slate-800 rounded-lg p-6 border border-purple-500/30">
        <h4 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Recent Agent Decisions
        </h4>
        <div className="space-y-4">
          {recentDecisions.length > 0 ? (
            recentDecisions.map((decision, index) => (
              <div key={index} className="p-4 bg-slate-700 rounded border-l-4 border-purple-500">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-purple-300">{decision.decision_type}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    decision.decision_made === 'approved' ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
                  }`}>
                    {decision.decision_made}
                  </span>
                </div>
                <p className="text-slate-300 text-sm mb-3">{decision.context}</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-slate-400">
                  <span>Integrity Score: {(decision.integrity_score * 100).toFixed(0)}%</span>
                  <span>Values: {decision.agent_factors.values_involved.length}</span>
                  <span>Risks: {decision.agent_factors.risks_assessed.length}</span>
                  <span>Goals: {decision.agent_factors.goals_affected.length}</span>
                </div>
                <p className="text-slate-400 text-xs mt-2 italic">&quot;{decision.justification}&quot;</p>
              </div>
            ))
          ) : (
            <div className="text-slate-400 text-center py-8">
              No recent decisions found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
