'use client';

import React, { useState, useEffect } from 'react';
import { Heart, TrendingUp, BarChart3, Clock, Smile, Frown, Meh } from 'lucide-react';

interface EmotionData {
  emotion: string;
  intensity: number;
  timestamp: string;
  trigger?: string;
  context?: string;
}

interface EmotionStats {
  dominantEmotion: string;
  averageIntensity: number;
  emotionCount: { [key: string]: number };
  recentTrend: 'positive' | 'negative' | 'stable';
  lastUpdated: string;
}

const EmotionDisplay: React.FC = () => {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionData | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionData[]>([]);
  const [stats, setStats] = useState<EmotionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [testInput, setTestInput] = useState('');
  const [testEmotion, setTestEmotion] = useState('happy');
  const [testIntensity, setTestIntensity] = useState(0.7);

  useEffect(() => {
    loadEmotionData();
    const interval = setInterval(loadEmotionData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadEmotionData = async () => {
    try {
      const [currentResponse, historyResponse, statsResponse] = await Promise.all([
        fetch('/api/emotions/current'),
        fetch('/api/emotions/history'),
        fetch('/api/emotions/stats')
      ]);

      if (currentResponse.ok) {
        const currentData = await currentResponse.json();
        setCurrentEmotion(currentData);
      }

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setEmotionHistory(historyData.slice(-20)); // Last 20 emotions
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to load emotion data:', error);
    } finally {
      setLoading(false);
    }
  };

  const testUserInput = async () => {
    if (!testInput.trim()) return;
    
    try {
      const response = await fetch('/api/emotions/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: testInput, context: 'test_input' })
      });
      
      if (response.ok) {
        await loadEmotionData();
        setTestInput('');
      }
    } catch (error) {
      console.error('Failed to process test input:', error);
    }
  };

  const manualEmotionOverride = async () => {
    try {
      const response = await fetch('/api/emotions/process', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          emotion: testEmotion, 
          intensity: testIntensity, 
          context: 'manual_test' 
        })
      });
      
      if (response.ok) {
        await loadEmotionData();
      }
    } catch (error) {
      console.error('Failed to override emotion:', error);
    }
  };

  const startDemo = async () => {
    try {
      const response = await fetch('/api/emotions/demo', {
        method: 'POST'
      });
      
      if (response.ok) {
        // Refresh data periodically during demo
        setTimeout(() => loadEmotionData(), 1000);
        setTimeout(() => loadEmotionData(), 3000);
        setTimeout(() => loadEmotionData(), 5000);
        setTimeout(() => loadEmotionData(), 7000);
        setTimeout(() => loadEmotionData(), 9000);
      }
    } catch (error) {
      console.error('Failed to start demo:', error);
    }
  };

  const resetEmotions = async () => {
    try {
      const response = await fetch('/api/emotions/demo', {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadEmotionData();
      }
    } catch (error) {
      console.error('Failed to reset emotions:', error);
    }
  };

  const getEmotionIcon = (emotion: string) => {
    const normalizedEmotion = emotion.toLowerCase();
    
    if (['happy', 'joy', 'excited', 'content', 'cheerful'].includes(normalizedEmotion)) {
      return <Smile className="w-6 h-6 text-green-500" />;
    } else if (['sad', 'disappointed', 'frustrated', 'angry', 'upset'].includes(normalizedEmotion)) {
      return <Frown className="w-6 h-6 text-red-500" />;
    } else {
      return <Meh className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getEmotionColor = (emotion: string) => {
    const normalizedEmotion = emotion.toLowerCase();
    
    if (['happy', 'joy', 'excited', 'content', 'cheerful'].includes(normalizedEmotion)) {
      return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200';
    } else if (['sad', 'disappointed', 'frustrated', 'angry', 'upset'].includes(normalizedEmotion)) {
      return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200';
    } else {
      return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200';
    }
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 0.8) return 'bg-red-500';
    if (intensity >= 0.6) return 'bg-orange-500';
    if (intensity >= 0.4) return 'bg-yellow-500';
    if (intensity >= 0.2) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative':
        return <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Emotion Display</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Heart className="w-5 h-5 mr-2" />
        Emotion Display
      </h3>

      {/* Current Emotion */}
      {currentEmotion ? (
        <div className={`p-4 rounded-lg mb-6 ${getEmotionColor(currentEmotion.emotion)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              {getEmotionIcon(currentEmotion.emotion)}
              <span className="ml-3 text-xl font-bold">{currentEmotion.emotion}</span>
            </div>
            <div className="text-sm opacity-75">
              {formatTimestamp(currentEmotion.timestamp)}
            </div>
          </div>
          
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span>Intensity</span>
              <span>{Math.round(currentEmotion.intensity * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getIntensityColor(currentEmotion.intensity)}`}
                style={{ width: `${currentEmotion.intensity * 100}%` }}
              ></div>
            </div>
          </div>

          {currentEmotion.trigger && (
            <div className="text-sm">
              <strong>Trigger:</strong> {currentEmotion.trigger}
            </div>
          )}
          
          {currentEmotion.context && (
            <div className="text-sm mt-1">
              <strong>Context:</strong> {currentEmotion.context}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No current emotion data available</p>
        </div>
      )}

      {/* Testing Controls */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="font-medium mb-3">Emotion Testing</h4>
        
        {/* Test User Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Test User Input:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter text to analyze emotion..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              onKeyPress={(e) => e.key === 'Enter' && testUserInput()}
            />
            <button
              onClick={testUserInput}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Analyze
            </button>
          </div>
        </div>

        {/* Manual Emotion Override */}
        <div>
          <label className="block text-sm font-medium mb-2">Manual Emotion Override:</label>
          <div className="flex gap-2 items-center">
            <select
              value={testEmotion}
              onChange={(e) => setTestEmotion(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            >
              <option value="happy">Happy</option>
              <option value="sad">Sad</option>
              <option value="excited">Excited</option>
              <option value="calm">Calm</option>
              <option value="curious">Curious</option>
              <option value="frustrated">Frustrated</option>
              <option value="empathetic">Empathetic</option>
              <option value="confident">Confident</option>
            </select>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.1"
              value={testIntensity}
              onChange={(e) => setTestIntensity(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm w-10">{(testIntensity * 100).toFixed(0)}%</span>
            <button
              onClick={manualEmotionOverride}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
            >
              Set
            </button>
          </div>
        </div>

        {/* Demo Controls */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={startDemo}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Start Demo
          </button>
          <button
            onClick={resetEmotions}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Reset to Baseline
          </button>
        </div>
      </div>

      {/* Emotion Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <BarChart3 className="w-4 h-4 mr-2" />
              <span className="font-medium">Dominant Emotion</span>
            </div>
            <div className="text-lg font-bold">{stats.dominantEmotion}</div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <TrendingUp className="w-4 h-4 mr-2" />
              <span className="font-medium">Average Intensity</span>
            </div>
            <div className="text-lg font-bold">{Math.round(stats.averageIntensity * 100)}%</div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              {getTrendIcon(stats.recentTrend)}
              <span className="font-medium ml-2">Recent Trend</span>
            </div>
            <div className="text-lg font-bold capitalize">{stats.recentTrend}</div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Clock className="w-4 h-4 mr-2" />
              <span className="font-medium">Last Updated</span>
            </div>
            <div className="text-sm">{formatDate(stats.lastUpdated)}</div>
          </div>
        </div>
      )}

      {/* Emotion Counts */}
      {stats && Object.keys(stats.emotionCount).length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-3">Emotion Distribution</h4>
          <div className="space-y-2">
            {Object.entries(stats.emotionCount)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([emotion, count]) => (
                <div key={emotion} className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getEmotionIcon(emotion)}
                    <span className="ml-2 capitalize">{emotion}</span>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent Emotion History */}
      {emotionHistory.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Recent Emotions</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {emotionHistory.slice(-10).reverse().map((emotion, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex items-center">
                  {getEmotionIcon(emotion.emotion)}
                  <span className="ml-2 capitalize">{emotion.emotion}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({Math.round(emotion.intensity * 100)}%)
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(emotion.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionDisplay;
