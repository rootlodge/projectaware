const fs = require('fs-extra');
const path = require('path');
const logger = require('../logger');

class ModelManager {
  constructor() {
    this.configPath = './config/models.json';
    this.config = null;
    this.currentModel = null;
    this.performanceStats = new Map();
    this.loadConfig();
  }

  loadConfig() {
    try {
      this.config = fs.readJsonSync(this.configPath);
      logger.info('[ModelManager] Loaded model configuration');
    } catch (error) {
      logger.error('[ModelManager] Failed to load model config:', error.message);
      this.createDefaultConfig();
    }
  }

  createDefaultConfig() {
    const defaultConfig = {
      models: {
        primary: {
          name: "gemma3:latest",
          capabilities: ["text-to-text", "multimodal"],
          useCases: ["analysis", "creative", "multimodal"]
        },
        fast: {
          name: "llama3.2:latest", 
          capabilities: ["text-to-text", "tool-usage"],
          useCases: ["conversation", "immediate", "tool-usage"]
        }
      },
      selection: {
        strategy: "automatic",
        rules: {
          immediate_response: "fast",
          analysis: "primary",
          refinement: "primary"
        }
      }
    };
    
    fs.writeJsonSync(this.configPath, defaultConfig, { spaces: 2 });
    this.config = defaultConfig;
  }

  /**
   * Select the best model for a given use case
   */
  selectModel(useCase = 'conversation', options = {}) {
    if (!this.config) {
      return 'gemma3:latest'; // fallback
    }

    // Check manual override
    if (options.forceModel) {
      return options.forceModel;
    }

    // Get model from rules
    const rule = this.config.selection.rules[useCase];
    if (rule && this.config.models[rule]) {
      const selectedModel = this.config.models[rule].name;
      this.currentModel = selectedModel;
      return selectedModel;
    }

    // Default to fast model for immediate responses
    const defaultModel = this.config.models.fast?.name || 'gemma3:latest';
    this.currentModel = defaultModel;
    return defaultModel;
  }

  /**
   * Get temperature for model and use case
   */
  getTemperature(useCase = 'default', modelName = null) {
    const model = this.findModelByName(modelName || this.currentModel);
    if (!model?.temperature) {
      return 0.7; // default
    }

    return model.temperature[useCase] || model.temperature.default || 0.7;
  }

  /**
   * Get model capabilities
   */
  getCapabilities(modelName = null) {
    const model = this.findModelByName(modelName || this.currentModel);
    return model?.capabilities || ['text-to-text'];
  }

  /**
   * Check if model supports a capability
   */
  supportsCapability(capability, modelName = null) {
    const capabilities = this.getCapabilities(modelName);
    return capabilities.includes(capability);
  }

  /**
   * Find model config by name
   */
  findModelByName(modelName) {
    if (!this.config?.models) return null;
    
    for (const [key, model] of Object.entries(this.config.models)) {
      if (model.name === modelName) {
        return model;
      }
    }
    return null;
  }

  /**
   * Record performance metrics
   */
  recordPerformance(modelName, useCase, responseTime, success) {
    const key = `${modelName}_${useCase}`;
    if (!this.performanceStats.has(key)) {
      this.performanceStats.set(key, {
        totalRequests: 0,
        successfulRequests: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        successRate: 0
      });
    }

    const stats = this.performanceStats.get(key);
    stats.totalRequests++;
    stats.totalResponseTime += responseTime;
    stats.averageResponseTime = stats.totalResponseTime / stats.totalRequests;

    if (success) {
      stats.successfulRequests++;
    }
    stats.successRate = stats.successfulRequests / stats.totalRequests;

    logger.debug(`[ModelManager] Performance: ${key} - ${responseTime}ms, Success: ${success}`);
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    const stats = {};
    for (const [key, data] of this.performanceStats) {
      stats[key] = { ...data };
    }
    return stats;
  }

  /**
   * Auto-select model based on performance
   */
  autoSelectBestModel(useCase) {
    const rules = this.config?.selection?.rules || {};
    const primaryChoice = rules[useCase];
    
    if (!primaryChoice) {
      return this.selectModel(useCase);
    }

    // Check performance of primary choice
    const primaryModel = this.config.models[primaryChoice]?.name;
    const performanceKey = `${primaryModel}_${useCase}`;
    const stats = this.performanceStats.get(performanceKey);

    // If primary model has good performance, use it
    if (!stats || stats.successRate > 0.8) {
      return this.selectModel(useCase);
    }

    // Otherwise, try fallback
    logger.warn(`[ModelManager] Primary model ${primaryModel} has low success rate (${stats.successRate}), using fallback`);
    return this.config.models.fallback?.name || 'llama3.1:latest';
  }

  /**
   * Get model info for display
   */
  getModelInfo(modelName = null) {
    const model = this.findModelByName(modelName || this.currentModel);
    if (!model) {
      return {
        name: modelName || 'unknown',
        description: 'Unknown model',
        capabilities: [],
        contextLimit: 'unknown'
      };
    }

    return {
      name: model.name,
      description: model.description || 'No description',
      capabilities: model.capabilities || [],
      contextLimit: model.contextLimit || 'unknown',
      useCases: model.useCases || []
    };
  }

  /**
   * Update model configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    fs.writeJsonSync(this.configPath, this.config, { spaces: 2 });
    logger.info('[ModelManager] Configuration updated');
  }
}

module.exports = ModelManager;
