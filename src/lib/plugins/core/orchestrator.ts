/**
 * Project Aware v2.0 - Plugin System Orchestrator
 * 
 * Central coordination and management of all plugin system components:
 * - Plugin discovery and loading
 * - Registry management
 * - Lifecycle coordination
 * - API provisioning
 * - Security enforcement
 * - Documentation generation
 */

import { EventEmitter } from 'events';
import { Plugin, PluginInput, PluginOutput, PluginBundle } from '@/lib/types/plugins';
import { pluginLoader } from './loader';
import { pluginRegistry } from './registry';
import { pluginLifecycleManager } from './lifecycle';
import { pluginAPIManager } from './api';
import { pluginSandboxManager } from './sandbox';
import { pluginDocGenerator } from './docs';
import { logger } from '@/lib/core/logger';

/**
 * Plugin system configuration
 */
export interface PluginSystemConfig {
  autoDiscovery: boolean;
  enableSandboxing: boolean;
  enableMetrics: boolean;
  enableDocGeneration: boolean;
  maxConcurrentPlugins: number;
  defaultResourceLimits: {
    maxMemoryMB: number;
    maxCpuPercent: number;
    maxStorageMB: number;
    maxNetworkRequests: number;
    timeoutMs: number;
  };
}

/**
 * Plugin system statistics
 */
export interface PluginSystemStats {
  totalPlugins: number;
  enabledPlugins: number;
  disabledPlugins: number;
  runningPlugins: number;
  categories: string[];
  totalExecutions: number;
  totalErrors: number;
  averageExecutionTime: number;
  memoryUsage: number;
  uptime: number;
}

/**
 * Plugin System Orchestrator
 * 
 * Coordinates all plugin system components and provides unified API
 */
export class PluginSystemOrchestrator extends EventEmitter {
  private config: PluginSystemConfig;
  private isInitialized = false;
  private startTime = Date.now();
  private totalExecutions = 0;
  private totalErrors = 0;
  private totalExecutionTime = 0;

  constructor(config?: Partial<PluginSystemConfig>) {
    super();
    
    this.config = {
      autoDiscovery: true,
      enableSandboxing: true,
      enableMetrics: true,
      enableDocGeneration: true,
      maxConcurrentPlugins: 50,
      defaultResourceLimits: {
        maxMemoryMB: 512,
        maxCpuPercent: 25,
        maxStorageMB: 100,
        maxNetworkRequests: 100,
        timeoutMs: 30000
      },
      ...config
    };

    this.setupEventHandlers();
  }

  /**
   * Initialize the plugin system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Plugin system already initialized');
      return;
    }

    logger.info('Initializing plugin system orchestrator');

    try {
      // Initialize all components
      await this.initializeComponents();

      // Auto-discover plugins if enabled
      if (this.config.autoDiscovery) {
        await this.discoverPlugins();
      }

      // Generate documentation if enabled
      if (this.config.enableDocGeneration) {
        await this.generateDocumentation();
      }

      this.isInitialized = true;
      this.emit('system:initialized');
      
      logger.info('Plugin system orchestrator initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize plugin system', error as Error);
      throw error;
    }
  }

  /**
   * Shutdown the plugin system
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    logger.info('Shutting down plugin system orchestrator');

    try {
      // Disable all enabled plugins
      const allPlugins = pluginRegistry.getAllPlugins();
      for (const [pluginId, entry] of allPlugins) {
        if (entry.status === 'enabled') {
          await this.disablePlugin(pluginId);
        }
      }

      // Clean up components
      await this.cleanupComponents();

      this.isInitialized = false;
      this.emit('system:shutdown');

      logger.info('Plugin system orchestrator shut down successfully');
    } catch (error) {
      logger.error('Error during plugin system shutdown', error as Error);
      throw error;
    }
  }

  /**
   * Install a plugin
   */
  async installPlugin(pluginId: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Plugin system not initialized');
    }

    try {
      logger.info(`Installing plugin: ${pluginId}`);
      
      const result = await pluginLifecycleManager.installPlugin(pluginId);
      
      if (result) {
        this.emit('plugin:installed', { pluginId });
        logger.info(`Plugin ${pluginId} installed successfully`);
      } else {
        logger.error(`Failed to install plugin ${pluginId}`);
      }

      return result;
    } catch (error) {
      logger.error(`Error installing plugin ${pluginId}`, error as Error);
      this.emit('plugin:install-error', { pluginId, error });
      return false;
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Plugin system not initialized');
    }

    try {
      logger.info(`Uninstalling plugin: ${pluginId}`);
      
      const result = await pluginLifecycleManager.uninstallPlugin(pluginId);
      
      if (result) {
        this.emit('plugin:uninstalled', { pluginId });
        logger.info(`Plugin ${pluginId} uninstalled successfully`);
      } else {
        logger.error(`Failed to uninstall plugin ${pluginId}`);
      }

      return result;
    } catch (error) {
      logger.error(`Error uninstalling plugin ${pluginId}`, error as Error);
      this.emit('plugin:uninstall-error', { pluginId, error });
      return false;
    }
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(pluginId: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Plugin system not initialized');
    }

    try {
      logger.info(`Enabling plugin: ${pluginId}`);
      
      const result = await pluginLifecycleManager.enablePlugin(pluginId);
      
      if (result) {
        this.emit('plugin:enabled', { pluginId });
        logger.info(`Plugin ${pluginId} enabled successfully`);
      } else {
        logger.error(`Failed to enable plugin ${pluginId}`);
      }

      return result;
    } catch (error) {
      logger.error(`Error enabling plugin ${pluginId}`, error as Error);
      this.emit('plugin:enable-error', { pluginId, error });
      return false;
    }
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(pluginId: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Plugin system not initialized');
    }

    try {
      logger.info(`Disabling plugin: ${pluginId}`);
      
      const result = await pluginLifecycleManager.disablePlugin(pluginId);
      
      if (result) {
        this.emit('plugin:disabled', { pluginId });
        logger.info(`Plugin ${pluginId} disabled successfully`);
      } else {
        logger.error(`Failed to disable plugin ${pluginId}`);
      }

      return result;
    } catch (error) {
      logger.error(`Error disabling plugin ${pluginId}`, error as Error);
      this.emit('plugin:disable-error', { pluginId, error });
      return false;
    }
  }

  /**
   * Execute a plugin
   */
  async executePlugin(pluginId: string, input: PluginInput): Promise<PluginOutput> {
    if (!this.isInitialized) {
      throw new Error('Plugin system not initialized');
    }

    const startTime = Date.now();
    
    try {
      logger.debug(`Executing plugin: ${pluginId}`, { input });

      // Check if plugin is enabled
      const entry = pluginRegistry.getPlugin(pluginId);
      if (!entry || entry.status !== 'enabled') {
        throw new Error(`Plugin ${pluginId} is not enabled`);
      }

      // Check sandbox permissions if enabled
      if (this.config.enableSandboxing) {
        const canExecute = pluginSandboxManager.checkAPIAccess(pluginId, 'execute');
        if (!canExecute) {
          throw new Error(`Plugin ${pluginId} execution blocked by sandbox`);
        }
      }

      // Load the plugin
      const loadResult = await pluginLoader.loadPlugin(pluginId);
      if (!loadResult.success || !loadResult.plugin) {
        throw new Error(`Failed to load plugin ${pluginId}`);
      }

      // Start sandbox monitoring if enabled  
      if (this.config.enableSandboxing) {
        // Monitor execution (simplified call)
        pluginSandboxManager.checkAPIAccess(pluginId, 'system.execute');
      }

      const result = await loadResult.plugin.execute(input);

      // Update metrics
      if (this.config.enableMetrics) {
        const executionTime = Date.now() - startTime;
        this.updateExecutionMetrics(pluginId, executionTime, true);
      }

      this.emit('plugin:executed', { pluginId, input, result });
      logger.debug(`Plugin ${pluginId} executed successfully`, { result });

      return result;
    } catch (error) {
      // Update error metrics
      if (this.config.enableMetrics) {
        const executionTime = Date.now() - startTime;
        this.updateExecutionMetrics(pluginId, executionTime, false);
      }

      logger.error(`Error executing plugin ${pluginId}`, error as Error);
      this.emit('plugin:execution-error', { pluginId, input, error });
      
      throw error;
    }
  }

  /**
   * List all plugins
   */
  listPlugins(): string[] {
    return Array.from(pluginRegistry.getAllPlugins().keys());
  }

  /**
   * Get plugin information
   */
  getPluginInfo(pluginId: string) {
    const registryEntry = pluginRegistry.getPlugin(pluginId);
    
    return {
      registry: registryEntry,
      plugin: registryEntry ? {
        id: pluginId,
        name: registryEntry.metadata.name,
        version: registryEntry.metadata.version,
        description: registryEntry.metadata.description,
        category: registryEntry.metadata.category,
        enabled: registryEntry.status === 'enabled',
        status: registryEntry.status
      } : null
    };
  }

  /**
   * Install a plugin bundle
   */
  async installBundle(bundleId: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Plugin system not initialized');
    }

    try {
      logger.info(`Installing bundle: ${bundleId}`);
      
      const result = await pluginLifecycleManager.installBundle(bundleId);
      
      if (result) {
        this.emit('bundle:installed', { bundleId });
        logger.info(`Bundle ${bundleId} installed successfully`);
      } else {
        logger.error(`Failed to install bundle ${bundleId}`);
      }

      return result;
    } catch (error) {
      logger.error(`Error installing bundle ${bundleId}`, error as Error);
      this.emit('bundle:install-error', { bundleId, error });
      return false;
    }
  }

  /**
   * Get system statistics
   */
  getSystemStats(): PluginSystemStats {
    const plugins = pluginRegistry.getAllPlugins();
    const categories = new Set<string>();
    let enabledCount = 0;

    for (const [, entry] of plugins) {
      if (entry.metadata.category) {
        categories.add(entry.metadata.category);
      }
      if (entry.status === 'enabled') {
        enabledCount++;
      }
    }

    return {
      totalPlugins: plugins.size,
      enabledPlugins: enabledCount,
      disabledPlugins: plugins.size - enabledCount,
      runningPlugins: 0, // Would track actual running plugins
      categories: Array.from(categories),
      totalExecutions: this.totalExecutions,
      totalErrors: this.totalErrors,
      averageExecutionTime: this.totalExecutions > 0 ? this.totalExecutionTime / this.totalExecutions : 0,
      memoryUsage: process.memoryUsage().heapUsed,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Generate documentation for all plugins
   */
  async generateDocumentation(): Promise<string[]> {
    if (!this.config.enableDocGeneration) {
      logger.debug('Documentation generation disabled');
      return [];
    }

    try {
      logger.info('Generating plugin documentation');
      const files = await pluginDocGenerator.generateAllDocs();
      logger.info(`Generated ${files.length} documentation files`);
      return files;
    } catch (error) {
      logger.error('Error generating plugin documentation', error as Error);
      return [];
    }
  }

  /**
   * Get system configuration
   */
  getConfiguration(): PluginSystemConfig {
    return { ...this.config };
  }

  /**
   * Update system configuration
   */
  updateConfiguration(config: Partial<PluginSystemConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('system:config-updated', { config: this.config });
    logger.info('Plugin system configuration updated', { config });
  }

  /**
   * Check if system is initialized
   */
  isSystemInitialized(): boolean {
    return this.isInitialized;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Initialize all plugin system components
   */
  private async initializeComponents(): Promise<void> {
    // Registry is already initialized as singleton
    // Loader is already initialized as singleton
    // Lifecycle manager is already initialized as singleton
    // API manager is already initialized as singleton
    // Sandbox manager is already initialized as singleton
    // Doc generator is already initialized as singleton
    
    logger.debug('All plugin system components initialized');
  }

  /**
   * Clean up all plugin system components
   */
  private async cleanupComponents(): Promise<void> {
    // Clean up API manager
    pluginAPIManager.removeAllListeners();
    
    // Clean up registry
    pluginRegistry.removeAllListeners();
    
    logger.debug('All plugin system components cleaned up');
  }

  /**
   * Discover plugins automatically
   */
  private async discoverPlugins(): Promise<void> {
    try {
      logger.info('Starting plugin discovery');
      const discoveredPlugins = await pluginLoader.discoverPlugins();
      const count = discoveredPlugins.totalFound || 0;
      logger.info(`Discovered ${count} plugins`);
      
      this.emit('system:discovery-complete', { count });
    } catch (error) {
      logger.error('Error during plugin discovery', error as Error);
      this.emit('system:discovery-error', { error });
    }
  }

  /**
   * Set up event handlers for component coordination
   */
  private setupEventHandlers(): void {
    // Registry events
    pluginRegistry.on('plugin:registered', (data) => {
      this.emit('plugin:registered', data);
    });

    pluginRegistry.on('plugin:unregistered', (data) => {
      this.emit('plugin:unregistered', data);
    });

    // Lifecycle events
    pluginLifecycleManager.on('plugin:install:start', (data) => {
      this.emit('plugin:install-start', data);
    });

    pluginLifecycleManager.on('plugin:install:complete', (data) => {
      this.emit('plugin:install-complete', data);
    });

    pluginLifecycleManager.on('plugin:install:error', (data) => {
      this.emit('plugin:install-error', data);
    });

    // API manager events
    pluginAPIManager.on('plugin:api:created', (data) => {
      this.emit('plugin:api-created', data);
    });

    // Sandbox events
    pluginSandboxManager.on('violation:detected', (data) => {
      this.emit('security:violation', data);
      logger.warn('Security violation detected', data);
    });
  }

  /**
   * Update execution metrics
   */
  private updateExecutionMetrics(pluginId: string, executionTime: number, success: boolean): void {
    this.totalExecutions++;
    this.totalExecutionTime += executionTime;
    
    if (!success) {
      this.totalErrors++;
    }

    // You could also update per-plugin metrics here
    logger.debug(`Updated metrics for ${pluginId}`, {
      executionTime,
      success,
      totalExecutions: this.totalExecutions,
      totalErrors: this.totalErrors
    });
  }
}

// Singleton instance
export const pluginSystem = new PluginSystemOrchestrator();
export default pluginSystem;
