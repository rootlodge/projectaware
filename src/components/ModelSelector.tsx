'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Zap, Brain, Check, Plus, X } from 'lucide-react';

interface ModelPreference {
  id?: number;
  model_name: string;
  description: string;
  speed_rating: number;
  intelligence_rating: number;
  is_default: boolean;
  created_at: string;
  last_used: string;
}

interface ModelSelectorProps {
  onModelChange?: (model: string) => void;
}

export default function ModelSelector({ onModelChange }: ModelSelectorProps) {
  const [models, setModels] = useState<ModelPreference[]>([]);
  const [currentModel, setCurrentModel] = useState<ModelPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModel, setShowAddModel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for adding new models
  const [newModel, setNewModel] = useState({
    model_name: '',
    description: '',
    speed_rating: 3,
    intelligence_rating: 3
  });

  useEffect(() => {
    fetchModels();
    fetchCurrentModel();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/models');
      const data = await response.json();
      
      if (data.success) {
        setModels(data.models);
      } else {
        setError('Failed to fetch models');
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      setError('Failed to fetch models');
    }
  };

  const fetchCurrentModel = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/models/default');
      const data = await response.json();
      
      if (data.success) {
        setCurrentModel(data.currentModel);
      }
    } catch (error) {
      console.error('Failed to fetch current model:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setDefaultModel = async (modelName: string) => {
    try {
      const response = await fetch('/api/models/default', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model_name: modelName }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchCurrentModel();
        await fetchModels();
        onModelChange?.(modelName);
        setError(null);
      } else {
        setError(data.message || 'Failed to set default model');
      }
    } catch (error) {
      console.error('Failed to set default model:', error);
      setError('Failed to set default model');
    }
  };

  const addNewModel = async () => {
    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newModel),
      });

      const data = await response.json();
      
      if (data.success) {
        setNewModel({
          model_name: '',
          description: '',
          speed_rating: 3,
          intelligence_rating: 3
        });
        setShowAddModel(false);
        await fetchModels();
        setError(null);
      } else {
        setError(data.message || 'Failed to add model');
      }
    } catch (error) {
      console.error('Failed to add model:', error);
      setError('Failed to add model');
    }
  };

  const renderStars = (rating: number, maxRating: number = 5) => {
    return Array.from({ length: maxRating }, (_, i) => (
      <span
        key={i}
        className={`text-sm ${i < rating ? 'text-yellow-400' : 'text-gray-600'}`}
      >
        ★
      </span>
    ));
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Model Selection</h3>
        </div>
        <div className="text-center text-gray-400">Loading models...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Model Selection</h3>
        </div>
        <button
          onClick={() => setShowAddModel(!showAddModel)}
          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          {showAddModel ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700/50 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Current Model Display */}
      {currentModel && (
        <div className="mb-6 p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium">Current Model</span>
          </div>
          <div className="text-white font-medium">{currentModel.model_name}</div>
          {currentModel.description && (
            <div className="text-gray-400 text-sm mt-1">{currentModel.description}</div>
          )}
        </div>
      )}

      {/* Add New Model Form */}
      {showAddModel && (
        <div className="mb-6 p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
          <h4 className="text-white font-medium mb-4">Add New Model</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Model Name</label>
              <input
                type="text"
                value={newModel.model_name}
                onChange={(e) => setNewModel({ ...newModel, model_name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="e.g., gemma3:latest"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <input
                type="text"
                value={newModel.description}
                onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="Brief description of the model"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Speed Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={newModel.speed_rating}
                  onChange={(e) => setNewModel({ ...newModel, speed_rating: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Intelligence Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={newModel.intelligence_rating}
                  onChange={(e) => setNewModel({ ...newModel, intelligence_rating: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
            </div>
            <button
              onClick={addNewModel}
              disabled={!newModel.model_name.trim()}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
            >
              Add Model
            </button>
          </div>
        </div>
      )}

      {/* Available Models */}
      <div className="space-y-3">
        <h4 className="text-white font-medium">Available Models</h4>
        {models.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No models configured. Add a model to get started.
          </div>
        ) : (
          models.map((model) => (
            <div
              key={model.id}
              className={`p-4 rounded-lg border transition-all cursor-pointer ${
                model.is_default
                  ? 'bg-blue-900/30 border-blue-700/50'
                  : 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50'
              }`}
              onClick={() => setDefaultModel(model.model_name)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h5 className="text-white font-medium">{model.model_name}</h5>
                    {model.is_default && (
                      <Check className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  {model.description && (
                    <p className="text-gray-400 text-sm mt-1">{model.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-yellow-400" />
                      <span className="text-xs text-gray-400">Speed:</span>
                      {renderStars(model.speed_rating)}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Brain className="w-3 h-3 text-purple-400" />
                      <span className="text-xs text-gray-400">Intelligence:</span>
                      {renderStars(model.intelligence_rating)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
