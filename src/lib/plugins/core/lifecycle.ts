/**
 * Project Aware v2.0 - Plugin Lifecycle Manager
 * 
 * Manages the complete lifecycle of plugins and bundles:
 * - Installation and uninstallation
 * - Enabling and disabling
 * - Version management
 * - Dependency resolution
 * - Health monitoring
 */

import { EventEmitter } from 'events';
import { 
  Plugin,
  PluginBundle,
  PluginMetadata,
  BundleMetadata,
  PluginRegistryEntry,
  BundleRegistryEntry
} from '@/lib/types/plugins';
import { pluginRegistry } from './registry';
import { pluginLoader } from './loader';
import { logger } from '@/lib/core/logger';

export interface LifecycleOperation {
  type: 'install' | 'uninstall' | 'enable' | 'disable' | 'update';
  targetType: 'plugin' | 'bundle';
  targetId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  error?: string;
  progress: number;
}

/**
 * Plugin Lifecycle Manager Implementation
 */
export class PluginLifecycleManager extends EventEmitter {
  private operations: Map<string, LifecycleOperation> = new Map();
  private installedPlugins: Map<string, Plugin> = new Map();
  private installedBundles: Map<string, PluginBundle> = new Map();
  private enabledPlugins: Set<string> = new Set();
  private enabledBundles: Set<string> = new Set();

  constructor() {
    super();
    this.initializeLifecycleManager();
  }

  /**
   * Initialize the lifecycle manager
   */
  private async initializeLifecycleManager(): Promise<void> {
    logger.info('Plugin lifecycle manager initialized');
  }

  /**
   * Install a plugin
   */
  async installPlugin(pluginId: string, force = false): Promise<boolean> {
    const operationId = `install-plugin-${pluginId}-${Date.now()}`;
    
    try {
      const operation: LifecycleOperation = {
        type: 'install',
        targetType: 'plugin',
        targetId: pluginId,
        status: 'pending',
        startTime: new Date(),
        progress: 0
      };
      
      this.operations.set(operationId, operation);
      this.emit('operation-started', operation);

      // Check if already installed
      if (this.installedPlugins.has(pluginId) && !force) {
        operation.status = 'completed';
        operation.endTime = new Date();
        operation.progress = 100;
        this.emit('operation-completed', operation);
        return true;
      }

      operation.status = 'running';
      operation.progress = 10;
      this.emit('operation-progress', operation);

      // Get plugin from registry
      const registryEntry = pluginRegistry.getPlugin(pluginId);
      if (!registryEntry) {
        throw new Error(`Plugin not found in registry: ${pluginId}`);
      }

      operation.progress = 20;
      this.emit('operation-progress', operation);

      // Resolve and install dependencies
      const { resolved, missing } = pluginRegistry.resolveDependencies(pluginId);
      if (missing.length > 0) {
        throw new Error(`Missing dependencies: ${missing.join(', ')}`);
      }

      operation.progress = 40;
      this.emit('operation-progress', operation);

      // Install dependencies first
      for (const depId of resolved) {
        if (depId !== pluginId && !this.installedPlugins.has(depId)) {
          await this.installPlugin(depId, false);
        }
      }

      operation.progress = 60;
      this.emit('operation-progress', operation);

      // Load the plugin
      const loadResult = await pluginLoader.loadPlugin(pluginId);
      if (!loadResult.success || !loadResult.plugin) {
        throw new Error(`Failed to load plugin: ${loadResult.errors.join(', ')}`);
      }

      operation.progress = 80;
      this.emit('operation-progress', operation);

      // Install the plugin
      const plugin = loadResult.plugin;
      await plugin.initialize();
      
      this.installedPlugins.set(pluginId, plugin);
      pluginRegistry.updatePluginStatus(pluginId, 'installed');

      operation.status = 'completed';
      operation.endTime = new Date();
      operation.progress = 100;
      
      this.emit('operation-completed', operation);
      this.emit('plugin-installed', { pluginId, plugin });
      logger.info(`Plugin installed successfully: ${pluginId}`);
      
      return true;

    } catch (error) {
      const operation = this.operations.get(operationId);
      if (operation) {
        operation.status = 'failed';
        operation.endTime = new Date();
        operation.error = error instanceof Error ? error.message : String(error);
        this.emit('operation-failed', operation);
      }
      
      pluginRegistry.updatePluginStatus(pluginId, 'error', 
        error instanceof Error ? error.message : String(error));
      
      logger.error(`Plugin installation failed: ${pluginId}`, error as Error);
      return false;
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId: string, force = false): Promise<boolean> {
    const operationId = `uninstall-plugin-${pluginId}-${Date.now()}`;
    
    try {
      const operation: LifecycleOperation = {
        type: 'uninstall',
        targetType: 'plugin',
        targetId: pluginId,
        status: 'pending',
        startTime: new Date(),
        progress: 0
      };
      
      this.operations.set(operationId, operation);
      this.emit('operation-started', operation);

      // Check if installed
      const plugin = this.installedPlugins.get(pluginId);
      if (!plugin) {
        operation.status = 'completed';
        operation.endTime = new Date();
        operation.progress = 100;
        this.emit('operation-completed', operation);
        return true;
      }

      operation.status = 'running';
      operation.progress = 10;
      this.emit('operation-progress', operation);

      // Check for dependents
      const dependents = pluginRegistry.getDependents(pluginId);
      if (dependents.length > 0 && !force) {
        throw new Error(`Cannot uninstall plugin with dependents: ${dependents.join(', ')}`);
      }

      operation.progress = 30;
      this.emit('operation-progress', operation);

      // Disable if enabled
      if (this.enabledPlugins.has(pluginId)) {
        await this.disablePlugin(pluginId);
      }

      operation.progress = 60;
      this.emit('operation-progress', operation);

      // Cleanup plugin
      await plugin.cleanup();
      
      // Unload plugin
      await pluginLoader.unloadPlugin(pluginId);

      operation.progress = 80;
      this.emit('operation-progress', operation);

      // Remove from installed plugins
      this.installedPlugins.delete(pluginId);
      pluginRegistry.updatePluginStatus(pluginId, 'available');

      operation.status = 'completed';
      operation.endTime = new Date();
      operation.progress = 100;
      
      this.emit('operation-completed', operation);
      this.emit('plugin-uninstalled', { pluginId });
      logger.info(`Plugin uninstalled successfully: ${pluginId}`);
      
      return true;

    } catch (error) {
      const operation = this.operations.get(operationId);
      if (operation) {
        operation.status = 'failed';
        operation.endTime = new Date();
        operation.error = error instanceof Error ? error.message : String(error);
        this.emit('operation-failed', operation);
      }
      
      logger.error(`Plugin uninstallation failed: ${pluginId}`, error as Error);
      return false;
    }
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(pluginId: string): Promise<boolean> {
    try {
      const plugin = this.installedPlugins.get(pluginId);
      if (!plugin) {
        throw new Error(`Plugin not installed: ${pluginId}`);
      }

      if (this.enabledPlugins.has(pluginId)) {
        logger.debug(`Plugin already enabled: ${pluginId}`);
        return true;
      }

      // Enable dependencies first
      const { resolved, missing } = pluginRegistry.resolveDependencies(pluginId);
      if (missing.length > 0) {
        throw new Error(`Missing dependencies: ${missing.join(', ')}`);
      }

      for (const depId of resolved) {
        if (depId !== pluginId && !this.enabledPlugins.has(depId)) {
          await this.enablePlugin(depId);
        }
      }

      // Enable the plugin
      plugin.enabled = true;
      this.enabledPlugins.add(pluginId);
      pluginRegistry.updatePluginStatus(pluginId, 'enabled');

      this.emit('plugin-enabled', { pluginId, plugin });
      logger.info(`Plugin enabled: ${pluginId}`);
      
      return true;

    } catch (error) {
      pluginRegistry.updatePluginStatus(pluginId, 'error', 
        error instanceof Error ? error.message : String(error));
      logger.error(`Plugin enable failed: ${pluginId}`, error as Error);
      return false;
    }
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(pluginId: string): Promise<boolean> {
    try {
      const plugin = this.installedPlugins.get(pluginId);
      if (!plugin) {
        throw new Error(`Plugin not installed: ${pluginId}`);
      }

      if (!this.enabledPlugins.has(pluginId)) {
        logger.debug(`Plugin already disabled: ${pluginId}`);
        return true;
      }

      // Check for enabled dependents
      const dependents = pluginRegistry.getDependents(pluginId);
      const enabledDependents = dependents.filter(depId => this.enabledPlugins.has(depId));
      
      if (enabledDependents.length > 0) {
        // Disable dependents first
        for (const depId of enabledDependents) {
          await this.disablePlugin(depId);
        }
      }

      // Disable the plugin
      plugin.enabled = false;
      this.enabledPlugins.delete(pluginId);
      pluginRegistry.updatePluginStatus(pluginId, 'disabled');

      this.emit('plugin-disabled', { pluginId, plugin });
      logger.info(`Plugin disabled: ${pluginId}`);
      
      return true;

    } catch (error) {
      pluginRegistry.updatePluginStatus(pluginId, 'error', 
        error instanceof Error ? error.message : String(error));
      logger.error(`Plugin disable failed: ${pluginId}`, error as Error);
      return false;
    }
  }

  /**
   * Install a bundle
   */
  async installBundle(bundleId: string, force = false): Promise<boolean> {
    const operationId = `install-bundle-${bundleId}-${Date.now()}`;
    
    try {
      const operation: LifecycleOperation = {
        type: 'install',
        targetType: 'bundle',
        targetId: bundleId,
        status: 'pending',
        startTime: new Date(),
        progress: 0
      };
      
      this.operations.set(operationId, operation);
      this.emit('operation-started', operation);

      // Check if already installed
      if (this.installedBundles.has(bundleId) && !force) {
        operation.status = 'completed';
        operation.endTime = new Date();
        operation.progress = 100;
        this.emit('operation-completed', operation);
        return true;
      }

      operation.status = 'running';
      operation.progress = 10;
      this.emit('operation-progress', operation);

      // Get bundle from registry
      const registryEntry = pluginRegistry.getBundle(bundleId);
      if (!registryEntry) {
        throw new Error(`Bundle not found in registry: ${bundleId}`);
      }

      operation.progress = 20;
      this.emit('operation-progress', operation);

      // Install bundle dependencies
      for (const depId of registryEntry.metadata.dependencies) {
        const depBundle = pluginRegistry.getBundle(depId);
        if (depBundle && !this.installedBundles.has(depId)) {
          await this.installBundle(depId, false);
        }
      }

      operation.progress = 40;
      this.emit('operation-progress', operation);

      // Install plugins in the bundle
      const installedPlugins = new Map<string, Plugin>();
      let pluginProgress = 40;
      const progressPerPlugin = 40 / registryEntry.metadata.plugins.length;

      for (const pluginId of registryEntry.metadata.plugins) {
        await this.installPlugin(pluginId, false);
        const plugin = this.installedPlugins.get(pluginId);
        if (plugin) {
          installedPlugins.set(pluginId, plugin);
        }
        
        pluginProgress += progressPerPlugin;
        operation.progress = Math.round(pluginProgress);
        this.emit('operation-progress', operation);
      }

      operation.progress = 90;
      this.emit('operation-progress', operation);

      // Create bundle instance
      const bundle: PluginBundle = {
        metadata: registryEntry.metadata,
        pluginInstances: installedPlugins,
        enabled: false,
        installDate: new Date(),
        lastUpdated: new Date()
      };

      this.installedBundles.set(bundleId, bundle);
      pluginRegistry.updateBundleStatus(bundleId, 'installed');

      operation.status = 'completed';
      operation.endTime = new Date();
      operation.progress = 100;
      
      this.emit('operation-completed', operation);
      this.emit('bundle-installed', { bundleId, bundle });
      logger.info(`Bundle installed successfully: ${bundleId}`);
      
      return true;

    } catch (error) {
      const operation = this.operations.get(operationId);
      if (operation) {
        operation.status = 'failed';
        operation.endTime = new Date();
        operation.error = error instanceof Error ? error.message : String(error);
        this.emit('operation-failed', operation);
      }
      
      pluginRegistry.updateBundleStatus(bundleId, 'error', 
        error instanceof Error ? error.message : String(error));
      
      logger.error(`Bundle installation failed: ${bundleId}`, error as Error);
      return false;
    }
  }

  /**
   * Enable a bundle
   */
  async enableBundle(bundleId: string): Promise<boolean> {
    try {
      const bundle = this.installedBundles.get(bundleId);
      if (!bundle) {
        throw new Error(`Bundle not installed: ${bundleId}`);
      }

      if (this.enabledBundles.has(bundleId)) {
        logger.debug(`Bundle already enabled: ${bundleId}`);
        return true;
      }

      // Enable all plugins in the bundle
      for (const [pluginId, plugin] of bundle.pluginInstances) {
        await this.enablePlugin(pluginId);
        
        // Call bundle enable hook if available
        if (plugin.onBundleEnable) {
          await plugin.onBundleEnable();
        }
      }

      bundle.enabled = true;
      this.enabledBundles.add(bundleId);
      pluginRegistry.updateBundleStatus(bundleId, 'enabled');

      this.emit('bundle-enabled', { bundleId, bundle });
      logger.info(`Bundle enabled: ${bundleId}`);
      
      return true;

    } catch (error) {
      pluginRegistry.updateBundleStatus(bundleId, 'error', 
        error instanceof Error ? error.message : String(error));
      logger.error(`Bundle enable failed: ${bundleId}`, error as Error);
      return false;
    }
  }

  /**
   * Disable a bundle
   */
  async disableBundle(bundleId: string): Promise<boolean> {
    try {
      const bundle = this.installedBundles.get(bundleId);
      if (!bundle) {
        throw new Error(`Bundle not installed: ${bundleId}`);
      }

      if (!this.enabledBundles.has(bundleId)) {
        logger.debug(`Bundle already disabled: ${bundleId}`);
        return true;
      }

      // Disable all plugins in the bundle
      for (const [pluginId, plugin] of bundle.pluginInstances) {
        // Call bundle disable hook if available
        if (plugin.onBundleDisable) {
          await plugin.onBundleDisable();
        }
        
        await this.disablePlugin(pluginId);
      }

      bundle.enabled = false;
      this.enabledBundles.delete(bundleId);
      pluginRegistry.updateBundleStatus(bundleId, 'disabled');

      this.emit('bundle-disabled', { bundleId, bundle });
      logger.info(`Bundle disabled: ${bundleId}`);
      
      return true;

    } catch (error) {
      pluginRegistry.updateBundleStatus(bundleId, 'error', 
        error instanceof Error ? error.message : String(error));
      logger.error(`Bundle disable failed: ${bundleId}`, error as Error);
      return false;
    }
  }

  /**
   * Get installed plugins
   */
  getInstalledPlugins(): Map<string, Plugin> {
    return new Map(this.installedPlugins);
  }

  /**
   * Get enabled plugins
   */
  getEnabledPlugins(): Set<string> {
    return new Set(this.enabledPlugins);
  }

  /**
   * Get installed bundles
   */
  getInstalledBundles(): Map<string, PluginBundle> {
    return new Map(this.installedBundles);
  }

  /**
   * Get enabled bundles
   */
  getEnabledBundles(): Set<string> {
    return new Set(this.enabledBundles);
  }

  /**
   * Get operation status
   */
  getOperation(operationId: string): LifecycleOperation | undefined {
    return this.operations.get(operationId);
  }

  /**
   * Get all operations
   */
  getAllOperations(): Map<string, LifecycleOperation> {
    return new Map(this.operations);
  }

  /**
   * Check plugin health
   */
  async checkPluginHealth(pluginId: string) {
    const plugin = this.installedPlugins.get(pluginId);
    if (!plugin) {
      return { status: 'not-installed' };
    }

    try {
      const health = plugin.getHealth();
      return {
        status: 'healthy',
        health,
        enabled: this.enabledPlugins.has(pluginId)
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        enabled: this.enabledPlugins.has(pluginId)
      };
    }
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    return {
      installedPlugins: this.installedPlugins.size,
      enabledPlugins: this.enabledPlugins.size,
      installedBundles: this.installedBundles.size,
      enabledBundles: this.enabledBundles.size,
      activeOperations: Array.from(this.operations.values()).filter(op => 
        op.status === 'pending' || op.status === 'running'
      ).length
    };
  }
}

// Singleton instance
export const pluginLifecycleManager = new PluginLifecycleManager();
export default pluginLifecycleManager;
