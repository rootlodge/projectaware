'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  AlertTriangle,
  Settings as SettingsIcon, 
  Brain, 
  Cpu, 
  Zap, 
  Save, 
  RotateCcw, 
  Info,
  Activity,
  Gauge,
  Clock,
  Sliders
} from 'lucide-react';

interface OllamaStatus {
  ollama_running: boolean;
  available_models: {
    name: string;
    size: number;
    modified_at: string;
    details: any;
  }[];
  model_count: number;
  message: string;
  is_connection_error?: boolean;
}

interface ThoughtThrottlingSettings {
  enabled: boolean;
  max_thoughts_per_minute: number;
  unlimited: boolean;
  adaptive_throttling: boolean;
  performance_threshold: number;
}

interface SystemSettings {
  thought_throttling: ThoughtThrottlingSettings;
  llm_settings: {
    temperature: number;
    top_p: number;
    repeat_penalty: number;
    max_tokens: number;
  };
  memory_settings: {
    max_context_messages: number;
    min_message_length: number;
    filter_repetitive: boolean;
  };
  hallucination_detection: {
    enabled: boolean;
  };
}

export default function MainSettings() {
  // Ollama status states
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [isLoadingOllama, setIsLoadingOllama] = useState(false);
  const [testMessage, setTestMessage] = useState('Hello, can you respond?');
  const [testModel, setTestModel] = useState('gemma3:latest');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  // System settings states
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    checkOllamaStatus();
    loadSettings();
  }, []);

  // Ollama functions
  const checkOllamaStatus = async () => {
    setIsLoadingOllama(true);
    try {
      const response = await fetch('/api/test/ollama');
      const data = await response.json();
      setOllamaStatus(data);
    } catch (error) {
      console.error('Failed to check Ollama status:', error);
      setOllamaStatus({
        ollama_running: false,
        available_models: [],
        model_count: 0,
        message: 'Failed to check Ollama status'
      });
    } finally {
      setIsLoadingOllama(false);
    }
  };

  // Settings functions
  const loadSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const response = await fetch('/api/system/settings');
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
      } else {
        console.error('Failed to load settings:', data.error);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    try {
      setIsSaving(true);
      setSaveStatus('idle');
      
      const response = await fetch('/api/system/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSaveStatus('success');
        setHasChanges(false);
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        console.error('Failed to save settings:', data.error);
      }
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (!settings) return;
    
    const defaultSettings: SystemSettings = {
      ...settings,
      thought_throttling: {
        enabled: true,
        max_thoughts_per_minute: 12,
        unlimited: false,
        adaptive_throttling: true,
        performance_threshold: 0.8
      }
    };
    
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  const updateThrottlingSettings = (key: keyof ThoughtThrottlingSettings, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      thought_throttling: {
        ...settings.thought_throttling,
        [key]: value
      }
    });
    setHasChanges(true);
  };

  const getThoughtsPerSecond = () => {
    if (!settings?.thought_throttling.enabled || settings.thought_throttling.unlimited) {
      return "Unlimited";
    }
    return (settings.thought_throttling.max_thoughts_per_minute / 60).toFixed(1);
  };

  const getPerformanceImpact = () => {
    if (!settings?.thought_throttling.enabled || settings.thought_throttling.unlimited) {
      return { level: 'high', color: 'text-red-400', description: 'High CPU usage' };
    }
    
    const thoughtsPerMinute = settings.thought_throttling.max_thoughts_per_minute;
    
    if (thoughtsPerMinute <= 6) {
      return { level: 'low', color: 'text-green-400', description: 'Low CPU usage' };
    } else if (thoughtsPerMinute <= 20) {
      return { level: 'medium', color: 'text-yellow-400', description: 'Medium CPU usage' };
    } else {
      return { level: 'high', color: 'text-orange-400', description: 'High CPU usage' };
    }
  };

  const testOllamaGeneration = async () => {
    if (!testMessage.trim()) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/test/ollama', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testMessage,
          model: testModel
        }),
      });
      
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult({
        success: false,
        error: 'Failed to test Ollama'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30">
              <SettingsIcon className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">System Settings</h1>
              <p className="text-purple-300">
                Configure system performance, AI behavior, and Ollama integration
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {saveStatus === 'success' && (
              <div className="flex items-center space-x-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Saved</span>
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center space-x-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm">Error</span>
              </div>
            )}
            
            <button
              onClick={resetToDefaults}
              className="px-4 py-2 bg-white/5 text-purple-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
            
            <button
              onClick={saveSettings}
              disabled={!hasChanges || isSaving}
              className={`px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                hasChanges && !isSaving
                  ? 'bg-purple-500/30 text-white border border-purple-400/50 hover:bg-purple-500/40'
                  : 'bg-white/5 text-purple-400 border border-white/10 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <Activity className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ollama Integration Section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Ollama Integration</h2>
          </div>
          <button
            onClick={checkOllamaStatus}
            disabled={isLoadingOllama}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors"
          >
            {isLoadingOllama ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Status Display */}
        {ollamaStatus && (
          <div className="mb-6">
            <div className={`p-4 rounded-lg border ${
              ollamaStatus.ollama_running 
                ? 'bg-green-900/20 border-green-700/50' 
                : 'bg-red-900/20 border-red-700/50'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                {ollamaStatus.ollama_running ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className={`font-medium ${
                  ollamaStatus.ollama_running ? 'text-green-400' : 'text-red-400'
                }`}>
                  {ollamaStatus.ollama_running ? 'Ollama Running' : 'Ollama Not Running'}
                </span>
              </div>
              <p className="text-gray-300 text-sm">{ollamaStatus.message}</p>
              
              {ollamaStatus.available_models.length > 0 && (
                <div className="mt-3">
                  <p className="text-gray-400 text-sm mb-2">Available Models:</p>
                  <div className="flex flex-wrap gap-2">
                    {ollamaStatus.available_models.map((model) => (
                      <span
                        key={model.name}
                        className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                      >
                        {model.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}        {/* Test Generation */}
        {ollamaStatus?.ollama_running && (
          <div className="space-y-4">
            <h4 className="text-white font-medium">Test Generation</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Test Message</label>
                <input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="Enter test message"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Model</label>
                <select
                  value={testModel}
                  onChange={(e) => setTestModel(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="gemma3:latest">gemma3:latest</option>
                  <option value="llama3.2:latest">llama3.2:latest</option>
                  <option value="deepseek-r1:latest">deepseek-r1:latest</option>
                  {ollamaStatus.available_models
                    .filter(model => !['gemma3:latest', 'llama3.2:latest', 'deepseek-r1:latest'].includes(model.name))
                    .map((model) => (
                      <option key={model.name} value={model.name}>{model.name}</option>
                    ))}
                </select>
              </div>
            </div>
            
            <button
              onClick={testOllamaGeneration}
              disabled={isTesting || !testMessage.trim()}
              className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white transition-colors flex items-center justify-center space-x-2"
            >
              {isTesting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <PlayCircle className="w-4 h-4" />
              )}
              <span>{isTesting ? 'Testing...' : 'Test Generation'}</span>
            </button>
            
            {/* Test Result */}
            {testResult && (
              <div className={`p-4 rounded-lg border ${
                testResult.success 
                  ? 'bg-green-900/20 border-green-700/50' 
                  : 'bg-red-900/20 border-red-700/50'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`font-medium ${
                    testResult.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {testResult.success ? 'Test Successful' : 'Test Failed'}
                  </span>
                </div>
                
                {testResult.success ? (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">
                      Model: {testResult.model_used}
                    </p>
                    <div className="bg-gray-800 p-3 rounded border">
                      <p className="text-white text-sm">{testResult.response}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-red-400 text-sm">{testResult.error}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!ollamaStatus?.ollama_running && (
          <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-medium">Setup Required</span>
            </div>
            <div className="text-gray-300 text-sm space-y-2">
              <p>To use the AI brain interface, you need to:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Install Ollama from <code className="bg-gray-700 px-1 rounded">https://ollama.ai</code></li>
                <li>Start Ollama service</li>
                <li>Pull required models: <code className="bg-gray-700 px-1 rounded">ollama pull gemma3:latest</code></li>
                <li>Pull fast model: <code className="bg-gray-700 px-1 rounded">ollama pull llama3.2:latest</code></li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* System Performance Settings */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <div className="flex items-center space-x-2 mb-4">
          <Cpu className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-medium">System Performance</h3>
        </div>

        {/* Thought Throttling Controls */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-gray-300 font-medium">Thought Frequency</label>
              <span className="text-gray-400 text-sm">
                {settings?.thought_throttling.enabled 
                  ? `${settings.thought_throttling.max_thoughts_per_minute} thoughts/min` 
                  : 'Unlimited'
                }
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings?.thought_throttling.enabled || false}
                  onChange={(e) => updateThrottlingSettings('enabled', e.target.checked)}
                  className="w-4 h-4 bg-gray-700 border-gray-600 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-300">Enable thought throttling</span>
              </div>
              
              {settings?.thought_throttling.enabled && (
                <div className="ml-7">
                  <input
                    type="range"
                    min="1"
                    max="120"
                    value={settings.thought_throttling.max_thoughts_per_minute || 30}
                    onChange={(e) => updateThrottlingSettings('max_thoughts_per_minute', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1/min</span>
                    <span>60/min</span>
                    <span>120/min</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Performance Impact Indicator */}
          {settings?.thought_throttling.enabled && (
            <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-600">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 font-medium text-sm">Performance Impact</span>
              </div>
              <p className="text-gray-400 text-xs">
                {(settings.thought_throttling.max_thoughts_per_minute || 30) <= 30 
                  ? "🟢 Low impact - Suitable for older hardware"
                  : (settings.thought_throttling.max_thoughts_per_minute || 30) <= 60
                  ? "🟡 Medium impact - Good for most systems"
                  : "🔴 High impact - Requires powerful hardware"
                }
              </p>
            </div>
          )}

          {/* Settings Actions */}
          <div className="flex space-x-3 pt-4 border-t border-gray-700">
            <button
              onClick={saveSettings}
              disabled={isLoadingSettings}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white transition-colors flex items-center justify-center space-x-2"
            >
              {isLoadingSettings ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isLoadingSettings ? 'Saving...' : 'Save Settings'}</span>
            </button>
            
            <button
              onClick={resetToDefaults}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}