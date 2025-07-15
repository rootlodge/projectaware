'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Brain, Zap, Code, Search, MessageCircle, Target, Activity, Save, RefreshCw } from 'lucide-react';

interface ModelConfig {
  name: string;
  parameters: string;
  supports_tools: boolean;
  performance_tier: 'fast' | 'medium' | 'slow';
  use_cases: string[];
}

interface ModelSettings {
  available_models: ModelConfig[];
  specialized_models: Record<string, string>;
  performance_management: {
    tool_usage_throttling: {
      enabled: boolean;
      max_concurrent_tool_calls: number;
      pause_other_llm_calls: boolean;
      reduced_thinking_rate: number;
      cooldown_period_ms: number;
    };
  };
}

const USE_CASE_ICONS = {
  thinking: Brain,
  chatting: MessageCircle,
  tool_usage: Zap,
  goal_setting: Target,
  code_editing: Code,
  web_browsing: Search,
  complex_analysis: Activity,
  quick_responses: MessageCircle
};

const USE_CASE_LABELS = {
  thinking: 'Autonomous Thinking',
  chatting: 'General Chat',
  tool_usage: 'Tool Usage',
  goal_setting: 'Goal Setting',
  code_editing: 'Code Editing',
  web_browsing: 'Web Browsing',
  complex_analysis: 'Complex Analysis',
  quick_responses: 'Quick Responses'
};

export default function ModelSettingsPage() {
  const [settings, setSettings] = useState<ModelSettings | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
    loadAvailableModels();
  }, []);

  const loadSettings = async () => {
    try {
      // Load current config
      const response = await fetch('/api/system/config');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.model_settings);
      }
    } catch (error) {
      console.error('Error loading model settings:', error);
      showMessage('error', 'Failed to load model settings');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableModels = async () => {
    try {
      // Discover models from Ollama
      const response = await fetch('/api/models/available');
      if (response.ok) {
        const data = await response.json();
        setAvailableModels(data.models || []);
      }
    } catch (error) {
      console.error('Error loading available models:', error);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/system/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_settings: settings })
      });

      if (response.ok) {
        showMessage('success', 'Model settings saved successfully');
        // Reload autonomous thinking config
        await fetch('/api/autonomous/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reload_config' })
        });
      } else {
        showMessage('error', 'Failed to save model settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('error', 'Failed to save model settings');
    } finally {
      setIsSaving(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const updateSpecializedModel = (useCase: string, modelName: string) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      specialized_models: {
        ...settings.specialized_models,
        [useCase]: modelName
      }
    });
  };

  const togglePerformanceSetting = (setting: string) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      performance_management: {
        ...settings.performance_management,
        tool_usage_throttling: {
          ...settings.performance_management.tool_usage_throttling,
          [setting]: !settings.performance_management.tool_usage_throttling[setting as keyof typeof settings.performance_management.tool_usage_throttling]
        }
      }
    });
  };

  const updatePerformanceValue = (setting: string, value: number) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      performance_management: {
        ...settings.performance_management,
        tool_usage_throttling: {
          ...settings.performance_management.tool_usage_throttling,
          [setting]: value
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6 flex items-center justify-center">
        <div className="text-white">Loading model settings...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6 flex items-center justify-center">
        <div className="text-red-400">Failed to load model settings</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <Settings className="w-8 h-8 mr-3" />
            Model & Performance Settings
          </h1>
          <p className="text-purple-300">
            Configure specialized models for different use cases and manage performance during tool usage
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Specialized Models */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              Specialized Model Assignment
            </h2>
            
            <div className="space-y-4">
              {Object.entries(USE_CASE_LABELS).map(([useCase, label]) => {
                const Icon = USE_CASE_ICONS[useCase as keyof typeof USE_CASE_ICONS];
                const currentModel = settings.specialized_models[useCase];
                const modelConfig = settings.available_models.find(m => m.name === currentModel);
                
                return (
                  <div key={useCase} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Icon className="w-4 h-4 text-purple-400 mr-2" />
                        <span className="text-white font-medium">{label}</span>
                      </div>
                      {modelConfig?.supports_tools && (
                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                          Tool Support
                        </span>
                      )}
                    </div>
                    
                    <select
                      value={currentModel || ''}
                      onChange={(e) => updateSpecializedModel(useCase, e.target.value)}
                      className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                    >
                      <option value="">Select Model</option>
                      {availableModels.map(model => {
                        const config = settings.available_models.find(m => m.name === model);
                        return (
                          <option key={model} value={model}>
                            {model} ({config?.parameters || 'unknown'})
                            {config?.supports_tools ? ' - Tools' : ''}
                          </option>
                        );
                      })}
                    </select>
                    
                    {modelConfig && (
                      <div className="mt-2 text-xs text-gray-400">
                        Performance: {modelConfig.performance_tier} | 
                        Parameters: {modelConfig.parameters} |
                        Use cases: {modelConfig.use_cases.join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance Management */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Performance Management
            </h2>
            
            <div className="space-y-6">
              {/* Tool Usage Throttling */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Tool Usage Throttling</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300">Enable Throttling</span>
                    <button
                      onClick={() => togglePerformanceSetting('enabled')}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        settings.performance_management.tool_usage_throttling.enabled 
                          ? 'bg-blue-600' 
                          : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                        settings.performance_management.tool_usage_throttling.enabled 
                          ? 'translate-x-7' 
                          : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-purple-300">Pause Other LLM Calls</span>
                    <button
                      onClick={() => togglePerformanceSetting('pause_other_llm_calls')}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        settings.performance_management.tool_usage_throttling.pause_other_llm_calls 
                          ? 'bg-blue-600' 
                          : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                        settings.performance_management.tool_usage_throttling.pause_other_llm_calls 
                          ? 'translate-x-7' 
                          : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-purple-300 mb-2">
                      Max Concurrent Tool Calls: {settings.performance_management.tool_usage_throttling.max_concurrent_tool_calls}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={settings.performance_management.tool_usage_throttling.max_concurrent_tool_calls}
                      onChange={(e) => updatePerformanceValue('max_concurrent_tool_calls', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 mb-2">
                      Thinking Rate Reduction: {settings.performance_management.tool_usage_throttling.reduced_thinking_rate}x
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={settings.performance_management.tool_usage_throttling.reduced_thinking_rate}
                      onChange={(e) => updatePerformanceValue('reduced_thinking_rate', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 mb-2">
                      Cooldown Period: {settings.performance_management.tool_usage_throttling.cooldown_period_ms / 1000}s
                    </label>
                    <input
                      type="range"
                      min="1000"
                      max="30000"
                      step="1000"
                      value={settings.performance_management.tool_usage_throttling.cooldown_period_ms}
                      onChange={(e) => updatePerformanceValue('cooldown_period_ms', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Models Overview */}
        <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4">Available Models Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {settings.available_models.map(model => (
              <div key={model.name} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-white truncate">{model.name}</h3>
                  {model.supports_tools && (
                    <div title="Supports Tools">
                      <Zap className="w-4 h-4 text-blue-400" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="text-purple-300">
                    Parameters: <span className="text-white">{model.parameters}</span>
                  </div>
                  <div className="text-purple-300">
                    Performance: <span className={`${
                      model.performance_tier === 'fast' ? 'text-green-400' :
                      model.performance_tier === 'medium' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>{model.performance_tier}</span>
                  </div>
                  <div className="text-purple-300">
                    Use cases: <span className="text-gray-300">{model.use_cases.join(', ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={loadSettings}
            disabled={isLoading}
            className="flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload
          </button>
          
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
