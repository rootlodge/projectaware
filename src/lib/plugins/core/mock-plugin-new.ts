/**
 * Project Aware v2.0 - Mock Plugin Implementation
 * 
 * Mock plugin for testing and development purposes
 */

import { EventEmitter } from 'events';
import { 
  Plugin, 
  PluginMetadata, 
  PluginState, 
  PluginInput, 
  PluginOutput, 
  PluginHealthStatus, 
  PluginMetrics,
  PluginSecurityConfig,
  PluginCategory,
  PluginType,
  PluginStatus,
  PluginConfiguration,
  BundleConfiguration
} from '@/lib/types/plugins';
import { logger } from '@/lib/core/logger';

/**
 * Plugin lifecycle states
 */
export type PluginLifecycleState = 
  | 'stopped' 
  | 'initializing' 
  | 'initialized' 
  | 'running' 
  | 'stopping' 
  | 'error';

/**
 * Mock Plugin Implementation
 */
export class MockPlugin extends EventEmitter implements Plugin {
  public readonly id: string;
  public readonly name: string;
  public readonly version: string;
  public readonly description: string;
  public readonly author: string;
  public readonly license: string;
  public readonly category: PluginCategory;
  public readonly type: PluginType;
  public readonly bundleId?: string;
  public readonly dependencies: string[];
  public readonly security: PluginSecurityConfig;
  
  public enabled = false;
  public status: PluginStatus = 'inactive';

  private lifecycleState: PluginLifecycleState = 'stopped';
  private pluginState: PluginState;
  private configuration: PluginConfiguration;
  private metrics: PluginMetrics = {
    executionCount: 0,
    averageExecutionTime: 0,
    errorCount: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    lastExecution: new Date().toISOString(),
    performanceHistory: []
  };

  constructor(metadata: PluginMetadata) {
    super();
    
    this.id = metadata.id;
    this.name = metadata.name;
    this.version = metadata.version;
    this.description = metadata.description;
    this.author = metadata.author;
    this.license = metadata.license;
    this.category = metadata.category;
    this.type = metadata.type;
    this.bundleId = metadata.bundleId;
    this.dependencies = metadata.dependencies;
    
    // Create proper security config
    this.security = metadata.security || {
      level: 'standard',
      permissions: [],
      sandbox: {
        enabled: true,
        allowFileSystem: false,
        allowNetwork: false,
        allowDatabase: false
      },
      resourceLimits: {
        maxMemoryMB: 100,
        maxCpuPercent: 10,
        maxExecutionTimeMs: 5000
      },
      allowedAPIs: [],
      trustedOrigins: []
    };

    // Initialize plugin configuration
    this.configuration = {
      enabled: metadata.security?.defaultEnabled ?? true,
      settings: {},
      userOverrides: {}
    };

    // Initialize plugin state
    this.pluginState = {
      enabled: this.configuration.enabled,
      configuration: this.configuration,
      internalState: {},
      persistentData: {},
      temporaryData: {},
      lastUpdate: new Date().toISOString(),
      version: metadata.version
    };

    logger.debug(`Mock plugin created: ${this.id}`);
  }

  /**
   * Initialize the plugin
   */
  async initialize(): Promise<void> {
    try {
      this.lifecycleState = 'initializing';
      this.status = 'loading';
      this.emit('state-change', { from: 'stopped', to: 'initializing' });

      // Simulate initialization work
      await this.simulateAsyncWork(100);

      this.lifecycleState = 'initialized';
      this.status = 'active';
      this.emit('state-change', { from: 'initializing', to: 'initialized' });
      this.emit('initialized');

      logger.info(`Mock plugin initialized: ${this.id}`);
    } catch (error) {
      this.lifecycleState = 'error';
      this.status = 'error';
      this.emit('state-change', { from: 'initializing', to: 'error' });
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Execute plugin functionality
   */
  async execute(input: PluginInput): Promise<PluginOutput> {
    const startTime = Date.now();
    
    try {
      if (this.lifecycleState !== 'running' && this.lifecycleState !== 'initialized') {
        throw new Error(`Plugin not ready for execution. Current state: ${this.lifecycleState}`);
      }

      this.lifecycleState = 'running';
      this.emit('execution-start', { input });

      // Simulate plugin work based on category
      const result = await this.simulatePluginWork(input);
      
      // Update metrics
      const executionTime = Date.now() - startTime;
      this.updateMetrics(executionTime, input, result);

      this.lifecycleState = 'initialized';
      this.emit('execution-complete', { input, output: result, executionTime });

      return result;

    } catch (error) {
      this.metrics.errorCount++;
      this.lifecycleState = 'error';
      this.status = 'error';
      this.emit('execution-error', { input, error });
      throw error;
    }
  }

  /**
   * Cleanup plugin resources
   */
  async cleanup(): Promise<void> {
    try {
      this.lifecycleState = 'stopping';
      this.emit('state-change', { from: this.lifecycleState, to: 'stopping' });

      // Simulate cleanup work
      await this.simulateAsyncWork(50);

      // Clear internal state
      this.pluginState.internalState = {};
      this.pluginState.temporaryData = {};
      this.enabled = false;
      this.status = 'inactive';

      this.lifecycleState = 'stopped';
      this.emit('state-change', { from: 'stopping', to: 'stopped' });
      this.emit('cleanup-complete');

      logger.info(`Mock plugin cleaned up: ${this.id}`);
    } catch (error) {
      this.lifecycleState = 'error';
      this.status = 'error';
      this.emit('cleanup-error', error);
      throw error;
    }
  }

  /**
   * Get plugin state
   */
  getState(): PluginState {
    return { ...this.pluginState };
  }

  /**
   * Set plugin state
   */
  async setState(newState: Partial<PluginState>): Promise<void> {
    const oldState = { ...this.pluginState };
    this.pluginState = { ...this.pluginState, ...newState };
    this.pluginState.lastUpdate = new Date().toISOString();
    this.emit('state-change', { from: oldState, to: this.pluginState });
    logger.debug(`Plugin state changed: ${this.id}`);
  }

  /**
   * Get plugin health status
   */
  getHealth(): PluginHealthStatus {
    const status = this.lifecycleState === 'error' ? 'unhealthy' : 
                  this.lifecycleState === 'running' || this.lifecycleState === 'initialized' ? 'healthy' : 'unknown';

    return {
      status,
      uptime: Date.now() - new Date(this.metrics.lastExecution).getTime(),
      lastChecked: new Date().toISOString(),
      checks: [
        {
          name: 'lifecycle-state',
          status: this.lifecycleState === 'error' ? 'fail' : 'pass',
          message: `Plugin lifecycle state: ${this.lifecycleState}`
        },
        {
          name: 'error-rate',
          status: this.metrics.errorCount > 0 ? 'warn' : 'pass',
          message: `Error count: ${this.metrics.errorCount}`
        }
      ]
    };
  }

  /**
   * Get plugin metrics
   */
  getMetrics(): PluginMetrics {
    return { ...this.metrics };
  }

  /**
   * Configure plugin
   */
  async configure(config: PluginConfiguration): Promise<void> {
    const oldConfig = { ...this.configuration };
    this.configuration = { ...this.configuration, ...config };
    this.pluginState.configuration = this.configuration;
    this.emit('config-updated', { oldConfig, newConfig: this.configuration });
    logger.debug(`Plugin configuration updated: ${this.id}`);
  }

  /**
   * Get plugin configuration
   */
  getConfiguration(): PluginConfiguration {
    return { ...this.configuration };
  }

  /**
   * Validate plugin configuration
   */
  validateConfiguration(config: PluginConfiguration): boolean {
    // Basic validation - check required fields
    return typeof config.enabled === 'boolean' && 
           typeof config.settings === 'object' &&
           typeof config.userOverrides === 'object';
  }

  /**
   * Bundle lifecycle methods (optional)
   */
  async onBundleEnable?(): Promise<void> {
    this.emit('bundle-enabled');
    logger.debug(`Plugin bundle enabled: ${this.id}`);
  }

  async onBundleDisable?(): Promise<void> {
    this.emit('bundle-disabled'); 
    logger.debug(`Plugin bundle disabled: ${this.id}`);
  }

  async onBundleConfigChange?(config: BundleConfiguration): Promise<void> {
    this.emit('bundle-config-changed', config);
    logger.debug(`Plugin bundle config changed: ${this.id}`);
  }

  /**
   * Simulate plugin work based on category
   */
  private async simulatePluginWork(input: PluginInput): Promise<PluginOutput> {
    // Simulate processing time
    await this.simulateAsyncWork(10 + Math.random() * 100);

    const baseOutput: PluginOutput = {
      pluginId: this.id,
      timestamp: new Date().toISOString(),
      success: true,
      data: {},
      metadata: {
        executionTime: 0,
        resourcesUsed: ['cpu', 'memory'],
        version: this.version
      }
    };

    // Category-specific simulation
    switch (this.category) {
      case 'consciousness':
        return {
          ...baseOutput,
          data: {
            awarenessLevel: Math.random() * 100,
            introspectionDepth: Math.random() * 10,
            selfReflection: `Mock consciousness response to: ${JSON.stringify(input.data).substring(0, 50)}...`
          }
        };

      case 'emotion':
        return {
          ...baseOutput,
          data: {
            emotionType: this.id.includes('joy') ? 'joy' : this.id.includes('curiosity') ? 'curiosity' : 'neutral',
            intensity: Math.random() * 100,
            triggers: input.data ? [Object.keys(input.data)[0]] : [],
            emotionalResponse: `Mock emotional processing of input`
          }
        };

      case 'memory':
        return {
          ...baseOutput,
          data: {
            memoryType: this.id.includes('short-term') ? 'short-term' : 'core',
            stored: true,
            retrievedItems: Math.floor(Math.random() * 5),
            associations: Math.floor(Math.random() * 10)
          }
        };

      case 'goal':
        return {
          ...baseOutput,
          data: {
            goalType: 'user-defined',
            priority: Math.floor(Math.random() * 5) + 1,
            progress: Math.random() * 100,
            nextSteps: ['Analyze input', 'Generate response', 'Execute action']
          }
        };

      case 'identity':
        return {
          ...baseOutput,
          data: {
            identityAspect: 'personality-trait',
            stability: Math.random() * 100,
            confidence: Math.random() * 100,
            warnings: this.security.level === 'critical' ? ['Identity modification request detected'] : []
          }
        };

      default:
        return {
          ...baseOutput,
          data: {
            processedInput: input.data,
            mockResponse: `Mock plugin ${this.id} processed the input`
          }
        };
    }
  }

  /**
   * Update plugin metrics
   */
  private updateMetrics(executionTime: number, input: PluginInput, output: PluginOutput): void {
    this.metrics.executionCount++;
    this.metrics.lastExecution = new Date().toISOString();
    
    // Calculate average execution time
    this.metrics.averageExecutionTime = 
      (this.metrics.averageExecutionTime * (this.metrics.executionCount - 1) + executionTime) / 
      this.metrics.executionCount;

    // Simulate resource usage
    this.metrics.memoryUsage = Math.random() * 100;
    this.metrics.cpuUsage = Math.random() * 50;

    // Add to performance history with input/output sizes
    const inputSize = JSON.stringify(input).length;
    const outputSize = JSON.stringify(output).length;
    
    this.metrics.performanceHistory.push({
      timestamp: new Date().toISOString(),
      executionTime,
      memoryUsage: this.metrics.memoryUsage,
      cpuUsage: this.metrics.cpuUsage,
      inputSize,
      outputSize
    });

    // Keep only last 100 performance entries
    if (this.metrics.performanceHistory.length > 100) {
      this.metrics.performanceHistory = this.metrics.performanceHistory.slice(-100);
    }
  }

  /**
   * Simulate asynchronous work
   */
  private async simulateAsyncWork(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default MockPlugin;
