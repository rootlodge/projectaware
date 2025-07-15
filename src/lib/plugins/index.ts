/**
 * Project Aware v2.0 - Plugin System Exports
 * 
 * Central export point for the complete plugin system:
 * - Core plugin types and interfaces
 * - Plugin loader and registry
 * - Lifecycle management
 * - API management and sandboxing
 * - Documentation generation
 * - System orchestration
 */

// Core Types
export * from '@/lib/types/plugins';

// Core Components
export { pluginLoader, PluginLoader } from './core/loader';
export { pluginRegistry, PluginRegistry } from './core/registry';
export { pluginLifecycleManager, PluginLifecycleManager } from './core/lifecycle';
export { pluginAPIManager, PluginAPIManager } from './core/api';
export { pluginSandboxManager, PluginSandboxManager } from './core/sandbox';
export { pluginDocGenerator, PluginDocumentationGenerator } from './core/docs';

// Main Orchestrator
export { pluginSystem, PluginSystemOrchestrator } from './core/orchestrator';

// Mock Plugin for Testing
export { MockPlugin } from './core/mock-plugin';

// Import instances for internal use
import { pluginSystem } from './core/orchestrator';
import { pluginLoader } from './core/loader';
import { pluginRegistry } from './core/registry';
import { pluginLifecycleManager } from './core/lifecycle';
import { pluginAPIManager } from './core/api';
import { pluginSandboxManager } from './core/sandbox';
import { pluginDocGenerator } from './core/docs';

// Re-export commonly used types
export type {
  Plugin,
  PluginBundle,
  PluginInput,
  PluginOutput,
  PluginMetadata,
  BundleMetadata,
  PluginRegistryEntry,
  BundleRegistryEntry,
  PluginConfiguration,
  PluginState,
  PluginHealthStatus,
  PluginMetrics,
  PluginSecurityConfig,
  PluginResourceLimits
} from '@/lib/types/plugins';

// Main plugin system interface for easy usage
export const PluginSystem = {
  // Core system
  orchestrator: pluginSystem,
  loader: pluginLoader,
  registry: pluginRegistry,
  lifecycle: pluginLifecycleManager,
  api: pluginAPIManager,
  sandbox: pluginSandboxManager,
  docs: pluginDocGenerator,

  // Convenience methods
  async initialize() {
    return pluginSystem.initialize();
  },

  async shutdown() {
    return pluginSystem.shutdown();
  },

  async installPlugin(pluginId: string) {
    return pluginSystem.installPlugin(pluginId);
  },

  async enablePlugin(pluginId: string) {
    return pluginSystem.enablePlugin(pluginId);
  },

  async disablePlugin(pluginId: string) {
    return pluginSystem.disablePlugin(pluginId);
  },

  async executePlugin(pluginId: string, input: any) {
    return pluginSystem.executePlugin(pluginId, input);
  },

  listPlugins() {
    return pluginSystem.listPlugins();
  },

  getStats() {
    return pluginSystem.getSystemStats();
  },

  getPluginInfo(pluginId: string) {
    return pluginSystem.getPluginInfo(pluginId);
  },

  async generateDocs() {
    return pluginDocGenerator.generateAllDocs();
  }
};

// Default export
export default PluginSystem;
