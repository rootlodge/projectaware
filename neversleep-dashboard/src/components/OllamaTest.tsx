'use client';

import React, { useState, useEffect } from 'react';
import { PlayCircle, CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';

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

export default function OllamaTest() {
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('Hello, can you respond?');
  const [testModel, setTestModel] = useState('gemma3:latest');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    checkOllamaStatus();
  }, []);

  const checkOllamaStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test/ollama');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to check Ollama status:', error);
      setStatus({
        ollama_running: false,
        available_models: [],
        model_count: 0,
        message: 'Failed to check Ollama status'
      });
    } finally {
      setIsLoading(false);
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
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Ollama Integration Test</h3>
        <button
          onClick={checkOllamaStatus}
          disabled={isLoading}
          className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Status Display */}
      {status && (
        <div className="mb-6">
          <div className={`p-4 rounded-lg border ${
            status.ollama_running 
              ? 'bg-green-900/20 border-green-700/50' 
              : 'bg-red-900/20 border-red-700/50'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {status.ollama_running ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
              <span className={`font-medium ${
                status.ollama_running ? 'text-green-400' : 'text-red-400'
              }`}>
                {status.ollama_running ? 'Ollama Running' : 'Ollama Not Running'}
              </span>
            </div>
            <p className="text-gray-300 text-sm">{status.message}</p>
            
            {status.available_models.length > 0 && (
              <div className="mt-3">
                <p className="text-gray-400 text-sm mb-2">Available Models:</p>
                <div className="flex flex-wrap gap-2">
                  {status.available_models.map((model) => (
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
      )}

      {/* Test Generation */}
      {status?.ollama_running && (
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
                {status.available_models
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
      {!status?.ollama_running && (
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
  );
}
