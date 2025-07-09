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
