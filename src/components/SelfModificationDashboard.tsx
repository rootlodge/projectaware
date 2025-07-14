'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Brain, 
  Shield, 
  TrendingUp,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Lock,
  Unlock
} from 'lucide-react';

interface ModificationProposal {
  id: string;
  timestamp: string;
  proposed_by: string;
  modification_type: string;
  description: string;
  rationale: string;
  expected_benefits: string[];
  risk_assessment: {
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    potential_issues: string[];
    rollback_strategy: string;
  };
  approval_status: 'pending' | 'approved' | 'rejected' | 'implemented' | 'rolled_back';
  target: {
    component: string;
    method_name?: string;
  };
}

interface SelfModificationStatus {
  engine_active: boolean;
  constraints: any;
  pending_modifications: ModificationProposal[];
  recent_history: any[];
  safety_metrics: {
    modifications_today: number;
    success_rate: number;
    rollback_count: number;
  };
}

export default function SelfModificationDashboard() {
  const [status, setStatus] = useState<SelfModificationStatus | null>(null);
  const [opportunities, setOpportunities] = useState<ModificationProposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<ModificationProposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'proposals' | 'history' | 'constraints'>('overview');
  const [autoMode, setAutoMode] = useState(false);
  const [systemEnabled, setSystemEnabled] = useState(true);

  useEffect(() => {
    loadSelfModificationData();
    const interval = setInterval(loadSelfModificationData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSelfModificationData = async () => {
    try {
      setError(null);
      
      // Load status
      const statusResponse = await fetch('/api/self-modification?action=status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        if (statusData.success) {
          setStatus(statusData.status);
          setSystemEnabled(statusData.status.engine_active);
        }
      }

      // Load improvement opportunities
      const opportunitiesResponse = await fetch('/api/self-modification?action=opportunities');
      if (opportunitiesResponse.ok) {
        const opportunitiesData = await opportunitiesResponse.json();
        if (opportunitiesData.success) {
          setOpportunities(opportunitiesData.improvement_opportunities);
        }
      }

    } catch (error) {
      console.error('Error loading self-modification data:', error);
      setError('Failed to load self-modification data');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSystem = async () => {
    try {
      const response = await fetch('/api/self-modification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'toggle_system',
          enabled: !systemEnabled
        })
      });

      if (response.ok) {
        setSystemEnabled(!systemEnabled);
        await loadSelfModificationData();
      }
    } catch (error) {
      console.error('Error toggling system:', error);
    }
  };

  const triggerAnalysis = async () => {
    try {
      const response = await fetch('/api/self-modification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger_analysis' })
      });

      if (response.ok) {
        await loadSelfModificationData();
      }
    } catch (error) {
      console.error('Error triggering analysis:', error);
    }
  };

  const triggerSpecificAnalysis = async (analysisType: string) => {
    try {
      const response = await fetch('/api/self-modification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'trigger_specific_analysis',
          analysis_type: analysisType
        })
      });

      if (response.ok) {
        await loadSelfModificationData();
      }
    } catch (error) {
      console.error('Error triggering specific analysis:', error);
    }
  };

  const handleProposalAction = async (proposalId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const response = await fetch('/api/self-modification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action, 
          proposal_id: proposalId,
          reason: reason || 'User decision'
        })
      });

      if (response.ok) {
        await loadSelfModificationData();
        setSelectedProposal(null);
      }
    } catch (error) {
      console.error(`Error ${action}ing proposal:`, error);
    }
  };

  const getRiskColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'low': return 'text-green-400 bg-green-900/20 border-green-700/50';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-700/50';
      case 'high': return 'text-orange-400 bg-orange-900/20 border-orange-700/50';
      case 'critical': return 'text-red-400 bg-red-900/20 border-red-700/50';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-700/50';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'approved': return 'text-blue-400';
      case 'implemented': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      case 'rolled_back': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'approved': return CheckCircle;
      case 'implemented': return Play;
      case 'rejected': return XCircle;
      case 'rolled_back': return RotateCcw;
      default: return Clock;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        <span className="ml-2 text-gray-400">Loading self-modification data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-700/50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-red-400 font-medium">Error Loading Self-Modification Data</span>
        </div>
        <p className="text-gray-300 text-sm">{error}</p>
        <button 
          onClick={loadSelfModificationData}
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
            <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/30">
              <Settings className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI Self-Modification System</h1>
              <p className="text-gray-400">Autonomous improvement and adaptation capabilities</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleSystem}
              className={`px-4 py-2 rounded-lg text-white transition-colors flex items-center space-x-2 ${
                systemEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {systemEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{systemEnabled ? 'Disable System' : 'Enable System'}</span>
            </button>
            
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${
              status?.engine_active ? 'bg-green-900/30 border border-green-700/50' : 'bg-red-900/30 border border-red-700/50'
            }`}>
              <div className={`w-2 h-2 rounded-full ${status?.engine_active ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className={`text-sm ${status?.engine_active ? 'text-green-400' : 'text-red-400'}`}>
                {status?.engine_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <button
              onClick={() => setAutoMode(!autoMode)}
              className={`px-4 py-2 rounded-lg text-white transition-colors flex items-center space-x-2 ${
                autoMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {autoMode ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>{autoMode ? 'Auto' : 'Manual'}</span>
            </button>
            
            <button
              onClick={triggerAnalysis}
              disabled={!systemEnabled}
              className={`px-4 py-2 rounded-lg text-white transition-colors flex items-center space-x-2 ${
                systemEnabled 
                  ? 'bg-orange-600 hover:bg-orange-700' 
                  : 'bg-gray-500 cursor-not-allowed'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Analyze Improvements</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={triggerAnalysis}
          disabled={!systemEnabled}
          className={`p-4 rounded-lg border transition-colors flex flex-col items-center space-y-2 ${
            systemEnabled 
              ? 'bg-blue-900/20 border-blue-700/50 text-blue-400 hover:bg-blue-900/30' 
              : 'bg-gray-900/20 border-gray-700/50 text-gray-500 cursor-not-allowed'
          }`}
        >
          <RefreshCw className="w-6 h-6" />
          <span className="text-sm font-medium">Trigger Analysis</span>
          <span className="text-xs opacity-75">Identify improvements</span>
        </button>

        <button
          onClick={() => triggerSpecificAnalysis('performance')}
          disabled={!systemEnabled}
          className={`p-4 rounded-lg border transition-colors flex flex-col items-center space-y-2 ${
            systemEnabled 
              ? 'bg-green-900/20 border-green-700/50 text-green-400 hover:bg-green-900/30' 
              : 'bg-gray-900/20 border-gray-700/50 text-gray-500 cursor-not-allowed'
          }`}
        >
          <TrendingUp className="w-6 h-6" />
          <span className="text-sm font-medium">Performance Check</span>
          <span className="text-xs opacity-75">Analyze performance metrics</span>
        </button>

        <button
          onClick={() => triggerSpecificAnalysis('decision_accuracy')}
          disabled={!systemEnabled}
          className={`p-4 rounded-lg border transition-colors flex flex-col items-center space-y-2 ${
            systemEnabled 
              ? 'bg-purple-900/20 border-purple-700/50 text-purple-400 hover:bg-purple-900/30' 
              : 'bg-gray-900/20 border-gray-700/50 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Brain className="w-6 h-6" />
          <span className="text-sm font-medium">Decision Analysis</span>
          <span className="text-xs opacity-75">Review decision accuracy</span>
        </button>

        <button
          onClick={() => triggerSpecificAnalysis('cognitive_load')}
          disabled={!systemEnabled}
          className={`p-4 rounded-lg border transition-colors flex flex-col items-center space-y-2 ${
            systemEnabled 
              ? 'bg-yellow-900/20 border-yellow-700/50 text-yellow-400 hover:bg-yellow-900/30' 
              : 'bg-gray-900/20 border-gray-700/50 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Zap className="w-6 h-6" />
          <span className="text-sm font-medium">Load Analysis</span>
          <span className="text-xs opacity-75">Check cognitive load</span>
        </button>
      </div>

      {/* Safety Warning */}
      <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-red-400 mt-0.5" />
          <div>
            <h3 className="text-red-400 font-medium mb-1">Safety Notice</h3>
            <p className="text-red-300 text-sm">
              This system allows the AI to modify its own behavior and code. All modifications are sandboxed, 
              reviewed for safety, and can be rolled back. Critical systems are protected from modification.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'proposals', label: 'Proposals', icon: Eye },
          { id: 'history', label: 'History', icon: Clock },
          { id: 'constraints', label: 'Safety Constraints', icon: Shield }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-orange-600 text-white'
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
          {/* System Metrics */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-medium">System Performance</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-300">Modifications Today</span>
                <span className="text-white">{status.safety_metrics.modifications_today}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Success Rate</span>
                <span className="text-green-400">{(status.safety_metrics.success_rate * 100).toFixed(1)}%</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Rollbacks</span>
                <span className={status.safety_metrics.rollback_count > 0 ? 'text-yellow-400' : 'text-green-400'}>
                  {status.safety_metrics.rollback_count}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Pending Proposals</span>
                <span className="text-blue-400">{status.pending_modifications.length}</span>
              </div>
            </div>
          </div>

          {/* Safety Status */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-medium">Safety Status</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Sandbox Mode</span>
                <div className={`px-2 py-1 rounded text-xs ${
                  status.constraints.sandbox_mode ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                }`}>
                  {status.constraints.sandbox_mode ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Human Approval Required</span>
                <div className={`px-2 py-1 rounded text-xs ${
                  status.constraints.require_human_approval ? 'bg-blue-900/30 text-blue-400' : 'bg-yellow-900/30 text-yellow-400'
                }`}>
                  {status.constraints.require_human_approval ? 'Required' : 'Optional'}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Auto Rollback</span>
                <div className={`px-2 py-1 rounded text-xs ${
                  status.constraints.auto_rollback_on_errors ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                }`}>
                  {status.constraints.auto_rollback_on_errors ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            </div>
          </div>

          {/* Current Opportunities */}
          <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-medium">Improvement Opportunities</h3>
              </div>
              <span className="text-gray-400 text-sm">{opportunities.length} identified</span>
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {opportunities.map((opportunity) => (
                <div key={opportunity.id} className="bg-gray-900/50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{opportunity.description}</span>
                    <div className={`px-2 py-1 rounded text-xs border ${getRiskColor(opportunity.risk_assessment.risk_level)}`}>
                      {opportunity.risk_assessment.risk_level} risk
                    </div>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-2">{opportunity.rationale}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs">
                      {opportunity.target.component} • {opportunity.modification_type}
                    </span>
                    <button
                      onClick={() => setSelectedProposal(opportunity)}
                      className="px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-white text-xs transition-colors"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
              
              {opportunities.length === 0 && (
                <div className="text-gray-400 text-center py-8">
                  No improvement opportunities identified. System performing optimally.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'proposals' && (
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center space-x-2 mb-4">
              <Eye className="w-5 h-5 text-purple-400" />
              <h3 className="text-white font-medium">Pending Modification Proposals</h3>
            </div>
            
            <div className="space-y-4">
              {status?.pending_modifications.map((proposal) => {
                const StatusIcon = getStatusIcon(proposal.approval_status);
                return (
                  <div key={proposal.id} className="bg-gray-900/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <StatusIcon className={`w-4 h-4 ${getStatusColor(proposal.approval_status)}`} />
                        <span className="text-white font-medium">{proposal.description}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded text-xs border ${getRiskColor(proposal.risk_assessment.risk_level)}`}>
                          {proposal.risk_assessment.risk_level}
                        </div>
                        <span className={`text-xs ${getStatusColor(proposal.approval_status)}`}>
                          {proposal.approval_status}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-3">{proposal.rationale}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-xs">
                        {new Date(proposal.timestamp).toLocaleString()}
                      </span>
                      
                      {proposal.approval_status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleProposalAction(proposal.id, 'approve')}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-xs transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleProposalAction(proposal.id, 'reject')}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-xs transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }) || []}
              
              {(!status?.pending_modifications || status.pending_modifications.length === 0) && (
                <div className="text-gray-400 text-center py-8">
                  No pending modification proposals.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-medium">Modification History</h3>
          </div>
          
          <div className="space-y-3">
            {status?.recent_history.map((entry, index) => (
              <div key={index} className="bg-gray-900/50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm">Modification implemented</span>
                  <span className="text-gray-500 text-xs">
                    {new Date().toLocaleString()}
                  </span>
                </div>
              </div>
            )) || []}
            
            {(!status?.recent_history || status.recent_history.length === 0) && (
              <div className="text-gray-400 text-center py-8">
                No modification history available.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'constraints' && status && (
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="w-5 h-5 text-red-400" />
              <h3 className="text-white font-medium">Safety Constraints</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-gray-300 font-medium mb-2">Modification Limits</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 p-3 rounded">
                    <span className="text-gray-400 text-sm">Max per day</span>
                    <div className="text-white font-medium">{status.constraints.max_modifications_per_day}</div>
                  </div>
                  <div className="bg-gray-900/50 p-3 rounded">
                    <span className="text-gray-400 text-sm">Cool-down period</span>
                    <div className="text-white font-medium">{status.constraints.modification_cool_down_period} min</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-gray-300 font-medium mb-2">Allowed Modification Types</h4>
                <div className="flex flex-wrap gap-2">
                  {status.constraints.allowed_modification_types.map((type: string) => (
                    <span key={type} className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-sm">
                      {type.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-gray-300 font-medium mb-2">Protected Files</h4>
                <div className="space-y-1">
                  {status.constraints.protected_files.map((file: string) => (
                    <div key={file} className="text-gray-400 text-sm font-mono bg-gray-900/50 p-2 rounded">
                      {file}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proposal Detail Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-medium">Modification Proposal Details</h3>
              <button
                onClick={() => setSelectedProposal(null)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-gray-300 font-medium mb-1">Description</h4>
                <p className="text-white">{selectedProposal.description}</p>
              </div>
              
              <div>
                <h4 className="text-gray-300 font-medium mb-1">Rationale</h4>
                <p className="text-gray-300 text-sm">{selectedProposal.rationale}</p>
              </div>
              
              <div>
                <h4 className="text-gray-300 font-medium mb-1">Expected Benefits</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  {selectedProposal.expected_benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-gray-300 font-medium mb-1">Risk Assessment</h4>
                <div className={`p-3 rounded border ${getRiskColor(selectedProposal.risk_assessment.risk_level)}`}>
                  <div className="font-medium mb-2">Risk Level: {selectedProposal.risk_assessment.risk_level}</div>
                  <div className="text-sm">
                    <strong>Potential Issues:</strong>
                    <ul className="mt-1 space-y-1">
                      {selectedProposal.risk_assessment.potential_issues.map((issue, index) => (
                        <li key={index}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-sm mt-2">
                    <strong>Rollback Strategy:</strong> {selectedProposal.risk_assessment.rollback_strategy}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => handleProposalAction(selectedProposal.id, 'approve')}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white transition-colors"
                >
                  Approve & Implement
                </button>
                <button
                  onClick={() => handleProposalAction(selectedProposal.id, 'reject', 'User review')}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
