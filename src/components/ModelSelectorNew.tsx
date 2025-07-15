'use client';

import React, { useState, useEffect } from 'react';
import { Check, Zap, Brain, Download, RefreshCw, AlertCircle, Server } from 'lucide-react';

interface InstalledModel {
  name: string;
  model: string;
  size_bytes: number;
  size_formatted: string;
  modified_at: string;
  parameter_size: string;
  family: string;
  format: string;
  quantization: string;
  speed_rating: number;
  intelligence_rating: number;
  description: string;
}

interface ModelSelectorProps {
  onModelChange: (model: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ onModelChange }) => {
  const [installedModels, setInstalledModels] = useState<InstalledModel[]>([]);
  const [currentModel, setCurrentModel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadInstalledModels();
    loadCurrentModel();
  }, []);

  const loadInstalledModels = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/models/installed');
      const data = await response.json();
      
      if (data.success) {
        setInstalledModels(data.models);
      } else {
        setError(data.error || 'Failed to load installed models');
      }
    } catch (error) {
      console.error('Failed to load installed models:', error);
      setError('Failed to connect to Ollama service');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentModel = async () => {
    try {
      const response = await fetch('/api/models/default');
      const data = await response.json();
      
      if (data.success && data.currentModel) {
        setCurrentModel(data.currentModel.model_name || '');
      }
    } catch (error) {
      console.error('Failed to load current model:', error);
    }
  };

  const setDefaultModel = async (modelName: string) => {
    setIsChanging(true);
    
    try {
      const response = await fetch('/api/models/default', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model_name: modelName }),
      });
      
      if (response.ok) {
        setCurrentModel(modelName);
        onModelChange(modelName);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to set default model');
      }
    } catch (error) {
      console.error('Failed to set default model:', error);
      setError('Failed to update model preference');
    } finally {
      setIsChanging(false);
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <div
        key={i}
        className={`w-3 h-3 rounded-full ${
          i < rating ? 'bg-yellow-400' : 'bg-gray-600'
        }`}
      />
    ));
  };

  const formatModifiedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
          <span className="text-white">Loading installed models...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400 font-medium">Error</span>
        </div>
        <p className="text-gray-300 mb-4">{error}</p>
        <button
          onClick={loadInstalledModels}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Server className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Model Selection</h3>
        </div>
        <button
          onClick={loadInstalledModels}
          disabled={isLoading}
          className="p-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {installedModels.length === 0 ? (
        <div className="text-center py-8">
          <Download className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No models installed</p>
          <p className="text-gray-500 text-sm">
            Install models with: <code className="bg-gray-700 px-2 py-1 rounded">ollama pull model-name</code>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm mb-4">
            {installedModels.length} model{installedModels.length !== 1 ? 's' : ''} installed
          </p>
          
          {installedModels.map((model) => (
            <div
              key={model.name}
              className={`p-4 rounded-lg border transition-all cursor-pointer ${
                currentModel === model.name
                  ? 'bg-blue-900/30 border-blue-500/50'
                  : 'bg-gray-800/50 border-gray-600/50 hover:bg-gray-700/50'
              }`}
              onClick={() => setDefaultModel(model.name)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-white">{model.name}</h4>
                    {currentModel === model.name && (
                      <div className="flex items-center space-x-1 text-green-400">
                        <Check className="w-4 h-4" />
                        <span className="text-sm">Active</span>
                      </div>
                    )}
                    {isChanging && currentModel !== model.name && (
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                    )}
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-3">{model.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-gray-400 text-sm">Speed</span>
                      </div>
                      <div className="flex space-x-1">
                        {getRatingStars(model.speed_rating)}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Brain className="w-4 h-4 text-purple-400" />
                        <span className="text-gray-400 text-sm">Intelligence</span>
                      </div>
                      <div className="flex space-x-1">
                        {getRatingStars(model.intelligence_rating)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{model.parameter_size} • {model.family}</span>
                    <span>{model.size_formatted} • {formatModifiedDate(model.modified_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {installedModels.length > 0 && (
        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
          <h4 className="text-white font-medium mb-2">Quick Setup</h4>
          <div className="text-sm text-gray-400 space-y-1">
            <p>• <strong>llama3.2:latest</strong> - Fast responses, good for chat</p>
            <p>• <strong>deepseek-r1:latest</strong> - Advanced reasoning capabilities</p>
            <p>Install with: <code className="bg-gray-700 px-2 py-1 rounded">ollama pull model-name</code></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
