/**
 * Project Aware v2.0 - Plugin Registry Implementation
 * 
 * Central registry for plugin and bundle management supporting:
 * - Plugin registration and discovery
 * - Bundle coordination
 * - Dependency resolution
 * - Version management
 * - Status tracking
 */

import { EventEmitter } from 'events';
import { 
  PluginRegistryEntry, 
  BundleRegistryEntry, 
  PluginMetadata, 
  BundleMetadata,
  PluginSearchFilters,
  PluginSearchResult,
  Plugin,
  PluginBundle
} from '@/lib/types/plugins';
import { logger } from '@/lib/core/logger';

/**
 * Plugin Registry Implementation
 */
export class PluginRegistry extends EventEmitter {
  private plugins: Map<string, PluginRegistryEntry> = new Map();
  private bundles: Map<string, BundleRegistryEntry> = new Map();
  private dependencyGraph: Map<string, Set<string>> = new Map();
  private reverseDependencyGraph: Map<string, Set<string>> = new Map();

  constructor() {
    super();
    this.initializeRegistry();
  }

  /**
   * Initialize the registry
   */
  private async initializeRegistry(): Promise<void> {
    logger.info('Plugin registry initialized');
  }

  /**
   * Register a plugin
   */
  async registerPlugin(metadata: PluginMetadata, plugin?: Plugin): Promise<void> {
    try {
      const entry: PluginRegistryEntry = {
        metadata,
        status: plugin ? 'installed' : 'available',
        installDate: plugin ? new Date() : undefined,
        lastUpdated: new Date(),
        errors: [],
        warnings: [],
        downloadCount: 0,
        rating: 0,
        reviews: []
      };

      this.plugins.set(metadata.id, entry);
      
      // Update dependency graph
      this.updateDependencyGraph(metadata.id, metadata.dependencies);
      
      this.emit('plugin-registered', { pluginId: metadata.id, entry });
      logger.info(`Plugin registered: ${metadata.id}`);
      
    } catch (error) {
      logger.error(`Failed to register plugin: ${metadata.id}`, error as Error);
      throw error;
    }
  }

  /**
   * Register a bundle
   */
  async registerBundle(metadata: BundleMetadata, bundle?: PluginBundle): Promise<void> {
    try {
      // Get plugin entries for this bundle
      const pluginEntries: PluginRegistryEntry[] = [];
      for (const pluginId of metadata.plugins) {
        const pluginEntry = this.plugins.get(pluginId);
        if (pluginEntry) {
          pluginEntries.push(pluginEntry);
        }
      }

      const entry: BundleRegistryEntry = {
        metadata,
        status: bundle ? 'installed' : 'available',
        plugins: pluginEntries,
        installDate: bundle ? new Date() : undefined,
        lastUpdated: new Date(),
        errors: [],
        warnings: [],
        downloadCount: 0,
        rating: 0,
        reviews: []
      };

      this.bundles.set(metadata.id, entry);
      
      this.emit('bundle-registered', { bundleId: metadata.id, entry });
      logger.info(`Bundle registered: ${metadata.id}`);
      
    } catch (error) {
      logger.error(`Failed to register bundle: ${metadata.id}`, error as Error);
      throw error;
    }
  }

  /**
   * Unregister a plugin
   */
  async unregisterPlugin(pluginId: string): Promise<boolean> {
    try {
      const entry = this.plugins.get(pluginId);
      if (!entry) {
        logger.warn(`Attempted to unregister non-existent plugin: ${pluginId}`);
        return false;
      }

      // Check for dependents
      const dependents = this.reverseDependencyGraph.get(pluginId);
      if (dependents && dependents.size > 0) {
        const dependentList = Array.from(dependents);
        logger.warn(`Cannot unregister plugin with dependents: ${pluginId}`, { dependents: dependentList });
        return false;
      }

      this.plugins.delete(pluginId);
      this.removeDependencyGraph(pluginId);
      
      this.emit('plugin-unregistered', { pluginId });
      logger.info(`Plugin unregistered: ${pluginId}`);
      
      return true;
    } catch (error) {
      logger.error(`Failed to unregister plugin: ${pluginId}`, error as Error);
      return false;
    }
  }

  /**
   * Unregister a bundle
   */
  async unregisterBundle(bundleId: string): Promise<boolean> {
    try {
      const entry = this.bundles.get(bundleId);
      if (!entry) {
        logger.warn(`Attempted to unregister non-existent bundle: ${bundleId}`);
        return false;
      }

      this.bundles.delete(bundleId);
      
      this.emit('bundle-unregistered', { bundleId });
      logger.info(`Bundle unregistered: ${bundleId}`);
      
      return true;
    } catch (error) {
      logger.error(`Failed to unregister bundle: ${bundleId}`, error as Error);
      return false;
    }
  }

  /**
   * Get plugin registry entry
   */
  getPlugin(pluginId: string): PluginRegistryEntry | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get bundle registry entry
   */
  getBundle(bundleId: string): BundleRegistryEntry | undefined {
    return this.bundles.get(bundleId);
  }

  /**
   * Get all plugins
   */
  getAllPlugins(): Map<string, PluginRegistryEntry> {
    return new Map(this.plugins);
  }

  /**
   * Get all bundles
   */
  getAllBundles(): Map<string, BundleRegistryEntry> {
    return new Map(this.bundles);
  }

  /**
   * Update plugin status
   */
  updatePluginStatus(pluginId: string, status: PluginRegistryEntry['status'], error?: string): void {
    const entry = this.plugins.get(pluginId);
    if (entry) {
      entry.status = status;
      entry.lastUpdated = new Date();
      
      if (error) {
        entry.errors = entry.errors || [];
        entry.errors.push(error);
      }
      
      this.emit('plugin-status-updated', { pluginId, status, error });
      logger.debug(`Plugin status updated: ${pluginId} -> ${status}`);
    }
  }

  /**
   * Update bundle status
   */
  updateBundleStatus(bundleId: string, status: BundleRegistryEntry['status'], error?: string): void {
    const entry = this.bundles.get(bundleId);
    if (entry) {
      entry.status = status;
      entry.lastUpdated = new Date();
      
      if (error) {
        entry.errors = entry.errors || [];
        entry.errors.push(error);
      }
      
      this.emit('bundle-status-updated', { bundleId, status, error });
      logger.debug(`Bundle status updated: ${bundleId} -> ${status}`);
    }
  }

  /**
   * Search plugins
   */
  searchPlugins(filters: PluginSearchFilters): PluginSearchResult {
    const allPlugins = Array.from(this.plugins.values());
    const allBundles = Array.from(this.bundles.values());
    
    let filteredPlugins = allPlugins;
    let filteredBundles = allBundles;

    // Apply filters
    if (filters.category) {
      filteredPlugins = filteredPlugins.filter(p => p.metadata.category === filters.category);
    }

    if (filters.type) {
      filteredPlugins = filteredPlugins.filter(p => p.metadata.type === filters.type);
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredPlugins = filteredPlugins.filter(p => 
        filters.tags!.some(tag => p.metadata.tags?.includes(tag))
      );
    }

    if (filters.author) {
      filteredPlugins = filteredPlugins.filter(p => 
        p.metadata.author.toLowerCase().includes(filters.author!.toLowerCase())
      );
    }

    if (filters.minRating) {
      filteredPlugins = filteredPlugins.filter(p => (p.rating || 0) >= filters.minRating!);
    }

    if (filters.license) {
      filteredPlugins = filteredPlugins.filter(p => p.metadata.license === filters.license);
    }

    if (filters.securityLevel) {
      filteredPlugins = filteredPlugins.filter(p => 
        p.metadata.security?.level === filters.securityLevel
      );
    }

    if (filters.status) {
      filteredPlugins = filteredPlugins.filter(p => p.status === filters.status);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filteredPlugins = filteredPlugins.filter(p => 
        p.metadata.name.toLowerCase().includes(term) ||
        p.metadata.description.toLowerCase().includes(term) ||
        p.metadata.id.toLowerCase().includes(term)
      );
      
      filteredBundles = filteredBundles.filter(b =>
        b.metadata.name.toLowerCase().includes(term) ||
        b.metadata.description.toLowerCase().includes(term) ||
        b.metadata.id.toLowerCase().includes(term)
      );
    }

    // Sort results
    if (filters.sortBy) {
      filteredPlugins.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (filters.sortBy) {
          case 'name':
            aValue = a.metadata.name;
            bValue = b.metadata.name;
            break;
          case 'rating':
            aValue = a.rating || 0;
            bValue = b.rating || 0;
            break;
          case 'downloads':
            aValue = a.downloadCount || 0;
            bValue = b.downloadCount || 0;
            break;
          case 'updated':
            aValue = a.lastUpdated;
            bValue = b.lastUpdated;
            break;
          default:
            return 0;
        }
        
        if (filters.sortOrder === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
      });
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedPlugins = filteredPlugins.slice(startIndex, endIndex);
    const paginatedBundles = filteredBundles.slice(startIndex, endIndex);

    return {
      plugins: paginatedPlugins,
      bundles: paginatedBundles,
      totalCount: filteredPlugins.length + filteredBundles.length,
      page,
      limit,
      hasMore: endIndex < (filteredPlugins.length + filteredBundles.length),
      filters
    };
  }

  /**
   * Resolve plugin dependencies
   */
  resolveDependencies(pluginId: string): { resolved: string[], missing: string[] } {
    const resolved: string[] = [];
    const missing: string[] = [];
    const visited = new Set<string>();
    
    const resolveDeps = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      
      const plugin = this.plugins.get(id);
      if (!plugin) {
        missing.push(id);
        return;
      }
      
      resolved.push(id);
      
      for (const depId of plugin.metadata.dependencies) {
        resolveDeps(depId);
      }
    };
    
    resolveDeps(pluginId);
    
    return { resolved, missing };
  }

  /**
   * Check for circular dependencies
   */
  hasCircularDependency(pluginId: string): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (id: string): boolean => {
      if (recursionStack.has(id)) return true;
      if (visited.has(id)) return false;
      
      visited.add(id);
      recursionStack.add(id);
      
      const dependencies = this.dependencyGraph.get(id);
      if (dependencies) {
        for (const depId of dependencies) {
          if (hasCycle(depId)) return true;
        }
      }
      
      recursionStack.delete(id);
      return false;
    };
    
    return hasCycle(pluginId);
  }

  /**
   * Get plugin dependents
   */
  getDependents(pluginId: string): string[] {
    const dependents = this.reverseDependencyGraph.get(pluginId);
    return dependents ? Array.from(dependents) : [];
  }

  /**
   * Get installation order for dependencies
   */
  getInstallationOrder(pluginIds: string[]): string[] {
    const visited = new Set<string>();
    const order: string[] = [];
    
    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      
      const dependencies = this.dependencyGraph.get(id);
      if (dependencies) {
        for (const depId of dependencies) {
          visit(depId);
        }
      }
      
      order.push(id);
    };
    
    for (const id of pluginIds) {
      visit(id);
    }
    
    return order;
  }

  /**
   * Update dependency graph
   */
  private updateDependencyGraph(pluginId: string, dependencies: string[]): void {
    this.dependencyGraph.set(pluginId, new Set(dependencies));
    
    // Update reverse dependency graph
    for (const depId of dependencies) {
      if (!this.reverseDependencyGraph.has(depId)) {
        this.reverseDependencyGraph.set(depId, new Set());
      }
      this.reverseDependencyGraph.get(depId)!.add(pluginId);
    }
  }

  /**
   * Remove from dependency graph
   */
  private removeDependencyGraph(pluginId: string): void {
    // Remove dependencies
    const dependencies = this.dependencyGraph.get(pluginId);
    if (dependencies) {
      for (const depId of dependencies) {
        const reverseDeps = this.reverseDependencyGraph.get(depId);
        if (reverseDeps) {
          reverseDeps.delete(pluginId);
          if (reverseDeps.size === 0) {
            this.reverseDependencyGraph.delete(depId);
          }
        }
      }
    }
    
    this.dependencyGraph.delete(pluginId);
    
    // Remove reverse dependencies
    this.reverseDependencyGraph.delete(pluginId);
  }

  /**
   * Get registry statistics
   */
  getStatistics() {
    const pluginsByCategory = new Map<string, number>();
    const pluginsByStatus = new Map<string, number>();
    const bundlesByType = new Map<string, number>();
    
    for (const entry of this.plugins.values()) {
      const category = entry.metadata.category;
      pluginsByCategory.set(category, (pluginsByCategory.get(category) || 0) + 1);
      
      const status = entry.status;
      pluginsByStatus.set(status, (pluginsByStatus.get(status) || 0) + 1);
    }
    
    for (const entry of this.bundles.values()) {
      const type = entry.metadata.type;
      bundlesByType.set(type, (bundlesByType.get(type) || 0) + 1);
    }
    
    return {
      totalPlugins: this.plugins.size,
      totalBundles: this.bundles.size,
      pluginsByCategory: Object.fromEntries(pluginsByCategory),
      pluginsByStatus: Object.fromEntries(pluginsByStatus),
      bundlesByType: Object.fromEntries(bundlesByType),
      dependencyNodes: this.dependencyGraph.size
    };
  }
}

// Singleton instance
export const pluginRegistry = new PluginRegistry();
export default pluginRegistry;
