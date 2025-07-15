/**
 * Project Aware v2.0 - Plugin Sandboxing Manager
 * 
 * Provides security isolation and resource management for plugins:
 * - Memory and CPU limits
 * - File system restrictions
 * - Network access control
 * - API access control
 * - Execution timeouts
 */

import { EventEmitter } from 'events';
import { 
  Plugin,
  PluginSecurityConfig,
  PluginResourceLimits
} from '@/lib/types/plugins';
import { logger } from '@/lib/core/logger';

export interface SandboxContext {
  pluginId: string;
  securityConfig: PluginSecurityConfig;
  startTime: Date;
  memoryUsage: number;
  cpuUsage: number;
  networkRequests: number;
  fileOperations: number;
  executionTime: number;
}

export interface SandboxViolation {
  pluginId: string;
  type: 'memory' | 'cpu' | 'timeout' | 'network' | 'file' | 'api';
  limit: number;
  actual: number;
  timestamp: Date;
  action: 'warn' | 'throttle' | 'terminate';
}

/**
 * Plugin Sandboxing Manager Implementation
 */
export class PluginSandboxManager extends EventEmitter {
  private sandboxes: Map<string, SandboxContext> = new Map();
  private violations: Map<string, SandboxViolation[]> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private enabled = true;

  constructor() {
    super();
    this.initializeSandboxManager();
  }

  /**
   * Initialize the sandbox manager
   */
  private async initializeSandboxManager(): Promise<void> {
    // Start resource monitoring
    this.startResourceMonitoring();
    
    logger.info('Plugin sandbox manager initialized');
  }

  /**
   * Create sandbox for plugin
   */
  createSandbox(plugin: Plugin): SandboxContext {
    const context: SandboxContext = {
      pluginId: plugin.id,
      securityConfig: plugin.security,
      startTime: new Date(),
      memoryUsage: 0,
      cpuUsage: 0,
      networkRequests: 0,
      fileOperations: 0,
      executionTime: 0
    };

    this.sandboxes.set(plugin.id, context);
    this.violations.set(plugin.id, []);

    this.emit('sandbox-created', { pluginId: plugin.id, context });
    logger.debug(`Sandbox created for plugin: ${plugin.id}`);

    return context;
  }

  /**
   * Destroy sandbox for plugin
   */
  destroySandbox(pluginId: string): boolean {
    const context = this.sandboxes.get(pluginId);
    if (!context) {
      return false;
    }

    this.sandboxes.delete(pluginId);
    this.violations.delete(pluginId);

    this.emit('sandbox-destroyed', { pluginId, context });
    logger.debug(`Sandbox destroyed for plugin: ${pluginId}`);

    return true;
  }

  /**
   * Execute plugin in sandbox
   */
  async executeInSandbox<T>(
    plugin: Plugin, 
    executor: () => Promise<T>
  ): Promise<T> {
    if (!this.enabled) {
      return executor();
    }

    const context = this.sandboxes.get(plugin.id);
    if (!context) {
      throw new Error(`No sandbox context for plugin: ${plugin.id}`);
    }

    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      // Set execution timeout
      const timeoutMs = context.securityConfig.resourceLimits.timeoutMs;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          this.recordViolation(plugin.id, {
            type: 'timeout',
            limit: timeoutMs,
            actual: Date.now() - startTime,
            action: 'terminate'
          });
          reject(new Error(`Plugin execution timeout: ${plugin.id}`));
        }, timeoutMs);
      });

      // Execute with timeout
      const result = await Promise.race([
        executor(),
        timeoutPromise
      ]);

      // Update context metrics
      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      
      context.executionTime = endTime - startTime;
      context.memoryUsage = Math.max(0, endMemory - startMemory) / (1024 * 1024); // MB
      
      // Check resource limits
      this.checkResourceLimits(context);

      return result;

    } catch (error) {
      this.emit('sandbox-error', { 
        pluginId: plugin.id, 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Check file system access
   */
  checkFileSystemAccess(pluginId: string, operation: 'read' | 'write', path: string): boolean {
    if (!this.enabled) {
      return true;
    }

    const context = this.sandboxes.get(pluginId);
    if (!context) {
      return false;
    }

    // Increment file operation counter
    context.fileOperations++;

    // Check if file system access is allowed
    if (!context.securityConfig.sandbox) {
      return true; // Sandbox disabled
    }

    // For now, implement basic path restrictions
    const restrictedPaths = [
      '/etc',
      '/sys',
      '/proc',
      'C:\\Windows',
      'C:\\System32'
    ];

    const isRestricted = restrictedPaths.some(restricted => 
      path.toLowerCase().startsWith(restricted.toLowerCase())
    );

    if (isRestricted) {
      this.recordViolation(pluginId, {
        type: 'file',
        limit: 0, // No access allowed
        actual: 1,
        action: 'terminate'
      });
      return false;
    }

    return true;
  }

  /**
   * Check network access
   */
  checkNetworkAccess(pluginId: string, url: string): boolean {
    if (!this.enabled) {
      return true;
    }

    const context = this.sandboxes.get(pluginId);
    if (!context) {
      return false;
    }

    // Increment network request counter
    context.networkRequests++;

    // Check network request limits
    const maxRequests = context.securityConfig.resourceLimits.maxNetworkRequests;
    if (context.networkRequests > maxRequests) {
      this.recordViolation(pluginId, {
        type: 'network',
        limit: maxRequests,
        actual: context.networkRequests,
        action: 'throttle'
      });
      return false;
    }

    // Check trusted origins
    if (context.securityConfig.trustedOrigins.length > 0) {
      const origin = new URL(url).origin;
      if (!context.securityConfig.trustedOrigins.includes(origin)) {
        this.recordViolation(pluginId, {
          type: 'network',
          limit: 0, // Only trusted origins allowed
          actual: 1,
          action: 'terminate'
        });
        return false;
      }
    }

    return true;
  }

  /**
   * Check API access
   */
  checkAPIAccess(pluginId: string, apiName: string): boolean {
    if (!this.enabled) {
      return true;
    }

    const context = this.sandboxes.get(pluginId);
    if (!context) {
      return false;
    }

    // Check if API is in allowed list
    const allowedAPIs = context.securityConfig.allowedAPIs;
    if (allowedAPIs.length > 0 && !allowedAPIs.includes(apiName)) {
      this.recordViolation(pluginId, {
        type: 'api',
        limit: 0, // Only allowed APIs
        actual: 1,
        action: 'terminate'
      });
      return false;
    }

    return true;
  }

  /**
   * Get sandbox context
   */
  getSandboxContext(pluginId: string): SandboxContext | undefined {
    return this.sandboxes.get(pluginId);
  }

  /**
   * Get sandbox violations
   */
  getViolations(pluginId: string): SandboxViolation[] {
    return this.violations.get(pluginId) || [];
  }

  /**
   * Enable/disable sandboxing
   */
  setSandboxingEnabled(enabled: boolean): void {
    this.enabled = enabled;
    logger.info(`Plugin sandboxing ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Is sandboxing enabled
   */
  isSandboxingEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get all sandbox contexts
   */
  getAllSandboxes(): Map<string, SandboxContext> {
    return new Map(this.sandboxes);
  }

  /**
   * Get sandbox statistics
   */
  getSandboxStatistics() {
    const totalViolations = Array.from(this.violations.values())
      .reduce((total, violations) => total + violations.length, 0);
    
    const violationsByType = new Map<string, number>();
    const violationsByAction = new Map<string, number>();
    
    for (const violations of this.violations.values()) {
      for (const violation of violations) {
        violationsByType.set(violation.type, (violationsByType.get(violation.type) || 0) + 1);
        violationsByAction.set(violation.action, (violationsByAction.get(violation.action) || 0) + 1);
      }
    }

    return {
      activeSandboxes: this.sandboxes.size,
      totalViolations,
      violationsByType: Object.fromEntries(violationsByType),
      violationsByAction: Object.fromEntries(violationsByAction),
      enabled: this.enabled
    };
  }

  /**
   * Start resource monitoring
   */
  private startResourceMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.monitorResources();
    }, 1000); // Check every second
  }

  /**
   * Stop resource monitoring
   */
  private stopResourceMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Monitor plugin resources
   */
  private monitorResources(): void {
    for (const context of this.sandboxes.values()) {
      this.checkResourceLimits(context);
    }
  }

  /**
   * Check resource limits for a context
   */
  private checkResourceLimits(context: SandboxContext): void {
    const limits = context.securityConfig.resourceLimits;

    // Check memory usage
    if (context.memoryUsage > limits.maxMemoryMB) {
      this.recordViolation(context.pluginId, {
        type: 'memory',
        limit: limits.maxMemoryMB,
        actual: context.memoryUsage,
        action: 'throttle'
      });
    }

    // Check CPU usage (simulated)
    if (context.cpuUsage > limits.maxCpuPercent) {
      this.recordViolation(context.pluginId, {
        type: 'cpu',
        limit: limits.maxCpuPercent,
        actual: context.cpuUsage,
        action: 'throttle'
      });
    }
  }

  /**
   * Record a sandbox violation
   */
  private recordViolation(pluginId: string, violationData: Omit<SandboxViolation, 'pluginId' | 'timestamp'>): void {
    const violation: SandboxViolation = {
      ...violationData,
      pluginId,
      timestamp: new Date()
    };

    const violations = this.violations.get(pluginId) || [];
    violations.push(violation);
    this.violations.set(pluginId, violations);

    // Keep only last 100 violations per plugin
    if (violations.length > 100) {
      violations.splice(0, violations.length - 100);
    }

    this.emit('violation-recorded', violation);
    logger.warn(`Sandbox violation recorded: ${pluginId}`, {
      type: violation.type,
      limit: violation.limit,
      actual: violation.actual,
      action: violation.action
    });

    // Take action based on violation
    this.handleViolation(violation);
  }

  /**
   * Handle sandbox violation
   */
  private handleViolation(violation: SandboxViolation): void {
    switch (violation.action) {
      case 'warn':
        this.emit('violation-warning', violation);
        break;
      case 'throttle':
        this.emit('violation-throttle', violation);
        break;
      case 'terminate':
        this.emit('violation-terminate', violation);
        break;
    }
  }

  /**
   * Cleanup sandbox manager
   */
  async cleanup(): Promise<void> {
    this.stopResourceMonitoring();
    this.sandboxes.clear();
    this.violations.clear();
    logger.info('Plugin sandbox manager cleaned up');
  }
}

// Singleton instance
export const pluginSandboxManager = new PluginSandboxManager();
export default pluginSandboxManager;
