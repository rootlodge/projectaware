/**
 * Project Aware v2.0 - Plugin Loader Implementation
 * 
 * Core plugin loading and registration system supporting:
 * - Dynamic plugin discovery
 * - Safe plugin loading with validation
 * - Plugin dependency resolution
 * - Bundle coordination
 * - Security validation
 */

import { EventEmitter } from 'events';
import { Plugin, PluginMetadata, PluginBundle, BundleMetadata } from '@/lib/types/plugins';
import { logger } from '@/lib/core/logger';
import { configManager } from '@/lib/config';

export interface PluginLoadResult {
  success: boolean;
  plugin?: Plugin;
  errors: string[];
  warnings: string[];
}

export interface PluginDiscoveryResult {
  plugins: PluginMetadata[];
  bundles: BundleMetadata[];
  totalFound: number;
  validPlugins: number;
  invalidPlugins: number;
}

/**
 * Plugin Loader Implementation
 */
export class PluginLoader extends EventEmitter {
  private loadedPlugins: Map<string, Plugin> = new Map();
  private discoveredPlugins: Map<string, PluginMetadata> = new Map();
  private discoveredBundles: Map<string, BundleMetadata> = new Map();
  private pluginPaths: string[] = [];

  constructor() {
    super();
    this.initializeLoader();
  }

  /**
   * Initialize the plugin loader
   */
  private async initializeLoader(): Promise<void> {
    try {
      const config = configManager.get('plugins') as any || {};
      this.pluginPaths = Array.isArray(config.pluginPaths) ? config.pluginPaths : ['./src/lib/plugins'];
      
      logger.info('Plugin loader initialized', {
        pluginPaths: this.pluginPaths,
        sandboxing: config.sandboxing || false
      });
    } catch (error) {
      // Fallback to default config if configManager fails
      this.pluginPaths = ['./src/lib/plugins'];
      logger.warn('Plugin loader using default config due to error', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Discover available plugins and bundles
   */
  async discoverPlugins(): Promise<PluginDiscoveryResult> {
    logger.info('Starting plugin discovery', { paths: this.pluginPaths });
    
    const result: PluginDiscoveryResult = {
      plugins: [],
      bundles: [],
      totalFound: 0,
      validPlugins: 0,
      invalidPlugins: 0
    };

    try {
      // Discover built-in plugins first
      await this.discoverBuiltinPlugins(result);
      
      // Discover plugins from configured paths
      for (const path of this.pluginPaths) {
        await this.discoverPluginsInPath(path, result);
      }

      logger.info('Plugin discovery completed', {
        totalFound: result.totalFound,
        validPlugins: result.validPlugins,
        invalidPlugins: result.invalidPlugins,
        bundles: result.bundles.length
      });

      this.emit('discovery-complete', result);
      return result;
      
    } catch (error) {
      logger.error('Plugin discovery failed', error as Error);
      throw error;
    }
  }

  /**
   * Discover built-in plugins
   */
  private async discoverBuiltinPlugins(result: PluginDiscoveryResult): Promise<void> {
    const builtinPlugins = [
      // Consciousness plugins
      {
        id: 'consciousness-core',
        name: 'Consciousness Core',
        version: '1.0.0',
        description: 'Base consciousness simulation engine',
        category: 'consciousness' as const,
        type: 'core' as const,
        bundleId: 'consciousness-bundle',
        dependencies: [],
        path: './consciousness/core',
        author: 'Project Aware Team',
        license: 'MIT'
      },
      {
        id: 'consciousness-introspection',
        name: 'Introspection Plugin',
        version: '1.0.0',
        description: 'Self-reflection and metacognition capabilities',
        category: 'consciousness' as const,
        type: 'individual' as const,
        dependencies: ['consciousness-core'],
        path: './consciousness/introspection',
        author: 'Project Aware Team',
        license: 'MIT'
      },
      
      // Emotion plugins
      {
        id: 'emotion-core',
        name: 'Emotion Core',
        version: '1.0.0',
        description: 'Base emotion processing engine',
        category: 'emotion' as const,
        type: 'core' as const,
        bundleId: 'emotion-core-bundle',
        dependencies: [],
        path: './emotions/core',
        author: 'Project Aware Team',
        license: 'MIT'
      },
      {
        id: 'emotion-joy',
        name: 'Joy Emotion',
        version: '1.0.0',
        description: 'Joy and happiness emotion processing',
        category: 'emotion' as const,
        type: 'individual' as const,
        dependencies: ['emotion-core'],
        path: './emotions/joy',
        author: 'Project Aware Team',
        license: 'MIT'
      },
      {
        id: 'emotion-curiosity',
        name: 'Curiosity Emotion',
        version: '1.0.0',
        description: 'Curiosity and interest emotion processing',
        category: 'emotion' as const,
        type: 'individual' as const,
        dependencies: ['emotion-core'],
        path: './emotions/curiosity',
        author: 'Project Aware Team',
        license: 'MIT'
      },

      // Memory plugins
      {
        id: 'memory-core',
        name: 'Memory Core',
        version: '1.0.0',
        description: 'Base memory management system',
        category: 'memory' as const,
        type: 'core' as const,
        bundleId: 'memory-core-bundle',
        dependencies: [],
        path: './memory/core',
        author: 'Project Aware Team',
        license: 'MIT'
      },
      {
        id: 'memory-short-term',
        name: 'Short-term Memory',
        version: '1.0.0',
        description: 'Working memory and immediate context',
        category: 'memory' as const,
        type: 'bundled' as const,
        bundleId: 'memory-core-bundle',
        dependencies: ['memory-core'],
        path: './memory/short-term',
        author: 'Project Aware Team',
        license: 'MIT'
      },

      // Goal plugins
      {
        id: 'goal-core',
        name: 'Goal Core',
        version: '1.0.0',
        description: 'Base goal management system',
        category: 'goal' as const,
        type: 'core' as const,
        bundleId: 'goal-management-bundle',
        dependencies: [],
        path: './goals/core',
        author: 'Project Aware Team',
        license: 'MIT'
      },
      {
        id: 'goal-user-input',
        name: 'User Goal Input',
        version: '1.0.0',
        description: 'Interface for user goal setting',
        category: 'goal' as const,
        type: 'individual' as const,
        dependencies: ['goal-core'],
        path: './goals/user-input',
        author: 'Project Aware Team',
        license: 'MIT'
      },

      // Identity plugins (HIGH SECURITY - OFF by default)
      {
        id: 'identity-core',
        name: 'Identity Core',
        version: '1.0.0',
        description: 'Core identity management system',
        category: 'identity' as const,
        type: 'core' as const,
        bundleId: 'identity-bundle',
        dependencies: [],
        path: './identity/core',
        author: 'Project Aware Team',
        license: 'MIT',
        security: { level: 'critical' as const, defaultEnabled: false }
      }
    ];

    // Add built-in plugin bundles
    const builtinBundles = [
      {
        id: 'consciousness-bundle',
        name: 'Consciousness Bundle',
        version: '1.0.0',
        description: 'Complete consciousness simulation system',
        type: 'required' as const,
        plugins: ['consciousness-core'],
        dependencies: [],
        installBehavior: 'atomic' as const,
        author: 'Project Aware Team',
        license: 'MIT'
      },
      {
        id: 'emotion-core-bundle',
        name: 'Emotion Core Bundle',
        version: '1.0.0',
        description: 'Essential emotion processing system',
        type: 'required' as const,
        plugins: ['emotion-core'],
        dependencies: [],
        installBehavior: 'atomic' as const,
        author: 'Project Aware Team',
        license: 'MIT'
      },
      {
        id: 'memory-core-bundle',
        name: 'Memory Core Bundle',
        version: '1.0.0',
        description: 'Essential memory management system',
        type: 'required' as const,
        plugins: ['memory-core', 'memory-short-term'],
        dependencies: [],
        installBehavior: 'atomic' as const,
        author: 'Project Aware Team',
        license: 'MIT'
      },
      {
        id: 'goal-management-bundle',
        name: 'Goal Management Bundle',
        version: '1.0.0',
        description: 'Complete goal setting and tracking system',
        type: 'optional' as const,
        plugins: ['goal-core'],
        dependencies: [],
        installBehavior: 'atomic' as const,
        author: 'Project Aware Team',
        license: 'MIT'
      },
      {
        id: 'identity-bundle',
        name: 'Identity Bundle',
        version: '1.0.0',
        description: 'Identity and personality management (HIGH SECURITY)',
        type: 'optional' as const,
        plugins: ['identity-core'],
        dependencies: [],
        installBehavior: 'atomic' as const,
        author: 'Project Aware Team',
        license: 'MIT',
        security: { level: 'critical' as const, defaultEnabled: false }
      }
    ];

    // Process built-in plugins
    for (const pluginMeta of builtinPlugins) {
      try {
        if (this.validatePluginMetadata(pluginMeta)) {
          this.discoveredPlugins.set(pluginMeta.id, pluginMeta);
          result.plugins.push(pluginMeta);
          result.validPlugins++;
        } else {
          result.invalidPlugins++;
        }
        result.totalFound++;
      } catch (error) {
        logger.warn(`Failed to process built-in plugin: ${pluginMeta.id}`, { error: error instanceof Error ? error.message : String(error) });
        result.invalidPlugins++;
      }
    }

    // Process built-in bundles
    for (const bundleMeta of builtinBundles) {
      try {
        if (this.validateBundleMetadata(bundleMeta)) {
          this.discoveredBundles.set(bundleMeta.id, bundleMeta);
          result.bundles.push(bundleMeta);
        }
      } catch (error) {
        logger.warn(`Failed to process built-in bundle: ${bundleMeta.id}`, { error: error instanceof Error ? error.message : String(error) });
      }
    }

    logger.info(`Discovered ${builtinPlugins.length} built-in plugins and ${builtinBundles.length} bundles`);
  }

  /**
   * Discover plugins in a specific path
   */
  private async discoverPluginsInPath(path: string, result: PluginDiscoveryResult): Promise<void> {
    try {
      logger.debug(`Discovering plugins in path: ${path}`);
      
      // For now, we'll focus on built-in plugins
      // In a full implementation, this would scan the filesystem
      // and dynamically load plugin definitions
      
    } catch (error) {
      logger.warn(`Failed to discover plugins in path: ${path}`, { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Load a specific plugin
   */
  async loadPlugin(pluginId: string): Promise<PluginLoadResult> {
    logger.info(`Loading plugin: ${pluginId}`);
    
    const result: PluginLoadResult = {
      success: false,
      errors: [],
      warnings: []
    };

    try {
      // Check if plugin is already loaded
      if (this.loadedPlugins.has(pluginId)) {
        result.warnings.push('Plugin already loaded');
        result.plugin = this.loadedPlugins.get(pluginId);
        result.success = true;
        return result;
      }

      // Get plugin metadata
      const metadata = this.discoveredPlugins.get(pluginId);
      if (!metadata) {
        result.errors.push('Plugin not found in discovery cache');
        return result;
      }

      // Validate dependencies
      const depValidation = await this.validateDependencies(metadata);
      if (!depValidation.valid) {
        result.errors.push(...depValidation.errors);
        return result;
      }

      // Create mock plugin instance for now
      // In a full implementation, this would dynamically import the plugin
      const plugin = await this.createMockPlugin(metadata);
      
      // Validate plugin
      const validation = await this.validatePlugin(plugin);
      if (!validation.valid) {
        result.errors.push(...validation.errors);
        return result;
      }

      // Initialize plugin
      await plugin.initialize();
      
      // Store loaded plugin
      this.loadedPlugins.set(pluginId, plugin);
      
      result.success = true;
      result.plugin = plugin;

      logger.info(`Plugin loaded successfully: ${pluginId}`);
      this.emit('plugin-loaded', { pluginId, plugin });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Failed to load plugin: ${errorMessage}`);
      logger.error(`Plugin loading failed: ${pluginId}`, new Error(errorMessage));
      return result;
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId: string): Promise<boolean> {
    try {
      const plugin = this.loadedPlugins.get(pluginId);
      if (!plugin) {
        logger.warn(`Attempted to unload non-existent plugin: ${pluginId}`);
        return false;
      }

      await plugin.cleanup();
      this.loadedPlugins.delete(pluginId);

      logger.info(`Plugin unloaded successfully: ${pluginId}`);
      this.emit('plugin-unloaded', { pluginId });
      
      return true;
    } catch (error) {
      logger.error(`Failed to unload plugin: ${pluginId}`, error as Error);
      return false;
    }
  }

  /**
   * Get loaded plugin
   */
  getLoadedPlugin(pluginId: string): Plugin | undefined {
    return this.loadedPlugins.get(pluginId);
  }

  /**
   * Get all loaded plugins
   */
  getLoadedPlugins(): Map<string, Plugin> {
    return new Map(this.loadedPlugins);
  }

  /**
   * Get discovered plugins
   */
  getDiscoveredPlugins(): Map<string, PluginMetadata> {
    return new Map(this.discoveredPlugins);
  }

  /**
   * Get discovered bundles
   */
  getDiscoveredBundles(): Map<string, BundleMetadata> {
    return new Map(this.discoveredBundles);
  }

  /**
   * Validate plugin metadata
   */
  private validatePluginMetadata(metadata: PluginMetadata): boolean {
    const required = ['id', 'name', 'version', 'description', 'category', 'type'];
    for (const field of required) {
      if (!metadata[field as keyof PluginMetadata]) {
        logger.warn(`Plugin metadata missing required field: ${field}`, { pluginId: metadata.id });
        return false;
      }
    }
    return true;
  }

  /**
   * Validate bundle metadata
   */
  private validateBundleMetadata(metadata: BundleMetadata): boolean {
    const required = ['id', 'name', 'version', 'description', 'type', 'plugins'];
    for (const field of required) {
      if (!metadata[field as keyof BundleMetadata]) {
        logger.warn(`Bundle metadata missing required field: ${field}`, { bundleId: metadata.id });
        return false;
      }
    }
    
    if (!Array.isArray(metadata.plugins) || metadata.plugins.length === 0) {
      logger.warn(`Bundle must contain at least one plugin`, { bundleId: metadata.id });
      return false;
    }
    
    return true;
  }

  /**
   * Validate plugin dependencies
   */
  private async validateDependencies(metadata: PluginMetadata): Promise<{ valid: boolean; errors: string[] }> {
    const result = { valid: true, errors: [] as string[] };
    
    for (const depId of metadata.dependencies) {
      if (!this.loadedPlugins.has(depId) && !this.discoveredPlugins.has(depId)) {
        result.valid = false;
        result.errors.push(`Missing dependency: ${depId}`);
      }
    }
    
    return result;
  }

  /**
   * Validate a plugin instance
   */
  private async validatePlugin(plugin: Plugin): Promise<{ valid: boolean; errors: string[] }> {
    const result = { valid: true, errors: [] as string[] };
    
    // Check required methods
    const requiredMethods = ['initialize', 'execute', 'cleanup', 'getState', 'setState', 'getHealth', 'getMetrics'];
    for (const method of requiredMethods) {
      if (typeof plugin[method as keyof Plugin] !== 'function') {
        result.valid = false;
        result.errors.push(`Missing required method: ${method}`);
      }
    }
    
    return result;
  }

  /**
   * Create a mock plugin instance for testing
   */
  private async createMockPlugin(metadata: PluginMetadata): Promise<Plugin> {
    const { MockPlugin } = await import('./mock-plugin');
    return new MockPlugin(metadata);
  }
}

// Singleton instance
export const pluginLoader = new PluginLoader();
export default pluginLoader;
