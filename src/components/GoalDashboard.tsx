import React, { useState, useEffect } from 'react';
import { Goal, GoalMetrics, GoalPriorityQueueItem } from '@/lib/types/goal-types';

interface GoalEngineStatus {
  initialized: boolean;
  activeGoal: {
    id: string;
    title: string;
    progress: number;
  } | null;
  queueLength: number;
  lastReflection: string;
}

export default function GoalDashboard() {
  const [status, setStatus] = useState<GoalEngineStatus | null>(null);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [metrics, setMetrics] = useState<GoalMetrics | null>(null);
  const [queue, setQueue] = useState<GoalPriorityQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all goal data
      const [statusRes, activeRes, allRes, metricsRes, queueRes] = await Promise.all([
        fetch('/api/goals'),
        fetch('/api/goals/active'),
        fetch('/api/goals/all'),
        fetch('/api/goals/metrics'),
        fetch('/api/goals/queue')
      ]);

      const statusData = await statusRes.json();
      const activeData = await activeRes.json();
      const allData = await allRes.json();
      const metricsData = await metricsRes.json();
      const queueData = await queueRes.json();

      if (statusData.success) setStatus(statusData.data);
      if (activeData.success && activeData.data) {
        console.log('Active goal data:', activeData.data);
        // Ensure activeData.data is a proper object, not a string or other type
        if (typeof activeData.data === 'object' && activeData.data.id) {
          setActiveGoal(activeData.data);
        } else {
          console.warn('Active goal data is not a proper goal object:', activeData.data);
          setActiveGoal(null);
        }
      } else {
        setActiveGoal(null);
      }
      if (allData.success) setAllGoals(Array.isArray(allData.data) ? allData.data : []);
      if (metricsData.success && metricsData.data) setMetrics(metricsData.data);
      if (queueData.success) setQueue(Array.isArray(queueData.data) ? queueData.data : []);
    } catch (error) {
      console.error('Error fetching goal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewGoals = async () => {
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze_and_create' })
      });
      
      const result = await response.json();
      if (result.success) {
        await fetchData(); // Refresh data
        alert(`Created ${result.data.length} new goals!`);
      }
    } catch (error) {
      console.error('Error creating goals:', error);
    }
  };

  const processNextGoal = async () => {
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process_next' })
      });
      
      const result = await response.json();
      if (result.success) {
        await fetchData(); // Refresh data
        if (result.data) {
          alert(`Activated goal: ${result.data.title}`);
        } else {
          alert('No goals in queue to process');
        }
      }
    } catch (error) {
      console.error('Error processing next goal:', error);
    }
  };

  const updateProgress = async (goalId: string, progress: number) => {
    try {
      const response = await fetch('/api/goals/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId, progress })
      });
      
      const result = await response.json();
      if (result.success) {
        await fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-100 rounded-lg">
        <div className="animate-pulse">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Goal Engine Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white p-4 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-100 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Goal Engine Dashboard</h2>
        <div className="flex gap-2">
          <button
            onClick={createNewGoals}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Create Goals
          </button>
          <button
            onClick={processNextGoal}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Process Next
          </button>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Status Overview */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Engine Status</h3>
            <p className={`text-lg font-bold ${status.initialized ? 'text-green-600' : 'text-red-600'}`}>
              {status.initialized ? 'Initialized' : 'Not Initialized'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Queue Length</h3>
            <p className="text-lg font-bold text-blue-600">{status.queueLength}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Last Reflection</h3>
            <p className="text-sm text-gray-700">
              {new Date(status.lastReflection).toLocaleTimeString()}
            </p>
          </div>
          {metrics && (
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Completion Rate</h3>
              <p className="text-lg font-bold text-purple-600">
                {Math.round(metrics.completion_rate * 100)}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Active Goal */}
      {activeGoal && typeof activeGoal === 'object' && activeGoal.id && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Active Goal</h3>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="font-semibold text-gray-700">{activeGoal.title || 'Untitled Goal'}</h4>
              <p className="text-gray-600 text-sm">{activeGoal.description || 'No description available'}</p>
              <div className="flex gap-2 mt-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  (activeGoal.type || 'short_term') === 'short_term' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {(activeGoal.type || 'short_term').replace('_', ' ')}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  (activeGoal.category || 'system_driven') === 'soul_driven' ? 'bg-purple-100 text-purple-800' :
                  (activeGoal.category || 'system_driven') === 'emotion_driven' ? 'bg-pink-100 text-pink-800' :
                  (activeGoal.category || 'system_driven') === 'user_driven' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {(activeGoal.category || 'system_driven').replace('_', ' ')}
                </span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                  Priority: {activeGoal.priority || 0}
                </span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{activeGoal.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${activeGoal.progress || 0}%` }}
              ></div>
            </div>
          </div>

          {/* Progress Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => updateProgress(activeGoal.id, Math.min((activeGoal.progress || 0) + 10, 100))}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              +10%
            </button>
            <button
              onClick={() => updateProgress(activeGoal.id, Math.min((activeGoal.progress || 0) + 25, 100))}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              +25%
            </button>
            {(activeGoal.progress || 0) < 100 && (
              <button
                onClick={() => updateProgress(activeGoal.id, 100)}
                className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
              >
                Complete
              </button>
            )}
          </div>
        </div>
      )}

      {/* Goals Summary */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Goals by Category</h3>
            <div className="space-y-2">
              {Object.entries(metrics.goals_by_category).map(([category, count]) => (
                <div key={category} className="flex justify-between">
                  <span className="text-gray-600 capitalize">{category.replace('_', ' ')}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Goals by Priority</h3>
            <div className="space-y-2">
              {Object.entries(metrics.goals_by_priority).map(([priority, count]) => (
                <div key={priority} className="flex justify-between">
                  <span className="text-gray-600">Priority {priority}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Priority Queue */}
      {queue.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Priority Queue</h3>
          <div className="space-y-2">
            {queue.slice(0, 5).map((item, index) => {
              const goal = allGoals.find(g => g.id === item.goal_id);
              return (
                <div key={item.goal_id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium text-sm">#{index + 1}</span>
                    <span className="ml-2 text-gray-700">{goal?.title || item.goal_id}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-blue-600">
                      Score: {Math.round(item.priority_score)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round(item.estimated_time)}min
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!activeGoal && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-800">No active goal currently. Click "Create Goals" to generate new objectives.</p>
        </div>
      )}
    </div>
  );
}
