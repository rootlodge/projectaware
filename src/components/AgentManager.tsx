'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Play, Pause, Edit, Trash2, Eye, Settings } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'error';
  description: string;
  lastActivity: string;
  tasksCompleted: number;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'paused' | 'completed' | 'error';
  progress: number;
  agents: string[];
  createdAt: string;
  lastRun: string;
}

const AgentManager: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeTab, setActiveTab] = useState<'agents' | 'workflows'>('agents');
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadAgents();
    loadWorkflows();
  }, []);

  const loadAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/agents/workflows');
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.workflows || []);
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch('/api/agents/workflows/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workflowId }),
      });

      if (response.ok) {
        await loadWorkflows(); // Refresh workflows
      }
    } catch (error) {
      console.error('Failed to execute workflow:', error);
    }
  };

  const pauseWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/agents/workflows/${workflowId}/pause`, {
        method: 'POST',
      });

      if (response.ok) {
        await loadWorkflows();
      }
    } catch (error) {
      console.error('Failed to pause workflow:', error);
    }
  };

  const deleteWorkflow = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      const response = await fetch(`/api/agents/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadWorkflows();
        setSelectedWorkflow(null);
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'running':
        return 'text-green-500';
      case 'paused':
      case 'idle':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      case 'completed':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Agent Manager</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Agent Manager
        </h3>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('agents')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'agents'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Agents ({agents.length})
        </button>
        <button
          onClick={() => setActiveTab('workflows')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'workflows'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Workflows ({workflows.length})
        </button>
      </div>

      {/* Agents Tab */}
      {activeTab === 'agents' && (
        <div className="space-y-4">
          {agents.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No agents available</p>
              <p className="text-sm mt-2">Create your first agent to get started</p>
            </div>
          ) : (
            agents.map((agent) => (
              <div
                key={agent.id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h4 className="font-medium text-lg">{agent.name}</h4>
                      <span className={`ml-3 px-2 py-1 text-xs rounded ${getStatusColor(agent.status)}`}>
                        {agent.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {agent.description}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-500 space-x-4">
                      <span>Type: {agent.type}</span>
                      <span>Tasks: {agent.tasksCompleted}</span>
                      <span>Last: {formatDate(agent.lastActivity)}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedAgent(agent)}
                      className="p-2 text-gray-500 hover:text-blue-500"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-gray-500 hover:text-yellow-500"
                      title="Edit Agent"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-gray-500 hover:text-gray-700"
                      title="Agent Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Workflows Tab */}
      {activeTab === 'workflows' && (
        <div className="space-y-4">
          {workflows.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No workflows available</p>
              <p className="text-sm mt-2">Create your first workflow to automate tasks</p>
            </div>
          ) : (
            workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h4 className="font-medium text-lg">{workflow.name}</h4>
                      <span className={`ml-3 px-2 py-1 text-xs rounded ${getStatusColor(workflow.status)}`}>
                        {workflow.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {workflow.description}
                    </p>
                    
                    {/* Progress Bar */}
                    {workflow.status === 'running' && (
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{workflow.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${workflow.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-500 space-x-4">
                      <span>Agents: {workflow.agents.length}</span>
                      <span>Created: {formatDate(workflow.createdAt)}</span>
                      {workflow.lastRun && <span>Last Run: {formatDate(workflow.lastRun)}</span>}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {workflow.status === 'running' ? (
                      <button
                        onClick={() => pauseWorkflow(workflow.id)}
                        className="p-2 text-gray-500 hover:text-yellow-500"
                        title="Pause Workflow"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => executeWorkflow(workflow.id)}
                        className="p-2 text-gray-500 hover:text-green-500"
                        title="Execute Workflow"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedWorkflow(workflow)}
                      className="p-2 text-gray-500 hover:text-blue-500"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-gray-500 hover:text-yellow-500"
                      title="Edit Workflow"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteWorkflow(workflow.id)}
                      className="p-2 text-gray-500 hover:text-red-500"
                      title="Delete Workflow"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h4 className="text-lg font-semibold mb-4">{selectedAgent.name}</h4>
            <div className="space-y-3 text-sm">
              <div><strong>Type:</strong> {selectedAgent.type}</div>
              <div><strong>Status:</strong> <span className={getStatusColor(selectedAgent.status)}>{selectedAgent.status}</span></div>
              <div><strong>Description:</strong> {selectedAgent.description}</div>
              <div><strong>Tasks Completed:</strong> {selectedAgent.tasksCompleted}</div>
              <div><strong>Last Activity:</strong> {formatDate(selectedAgent.lastActivity)}</div>
            </div>
            <button
              onClick={() => setSelectedAgent(null)}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Workflow Detail Modal */}
      {selectedWorkflow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full mx-4">
            <h4 className="text-lg font-semibold mb-4">{selectedWorkflow.name}</h4>
            <div className="space-y-3 text-sm">
              <div><strong>Status:</strong> <span className={getStatusColor(selectedWorkflow.status)}>{selectedWorkflow.status}</span></div>
              <div><strong>Description:</strong> {selectedWorkflow.description}</div>
              <div><strong>Progress:</strong> {selectedWorkflow.progress}%</div>
              <div><strong>Agents:</strong> {selectedWorkflow.agents.join(', ')}</div>
              <div><strong>Created:</strong> {formatDate(selectedWorkflow.createdAt)}</div>
              {selectedWorkflow.lastRun && <div><strong>Last Run:</strong> {formatDate(selectedWorkflow.lastRun)}</div>}
            </div>
            <button
              onClick={() => setSelectedWorkflow(null)}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentManager;
