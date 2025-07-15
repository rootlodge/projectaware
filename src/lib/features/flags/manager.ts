/**
 * Project Aware v2.0 - Feature Flag System Implementation
 * 
 * Comprehensive feature flag management supporting:
 * - Environment-specific configurations
 * - User-level overrides
 * - Plugin-specific feature gates
 * - A/B testing capabilities
 * - Gradual rollout mechanisms
 * - Real-time flag updates
 */

import { EventEmitter } from 'events';
import { logger } from '@/lib/core/logger';
import { configManager } from '@/lib/config';

/**
 * Feature Flag Interfaces
 */
export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  type: 'boolean' | 'string' | 'number' | 'json';
  defaultValue: boolean | string | number | object;
  enabled: boolean;
  environments: Record<string, boolean | string | number | object>;
  userOverrides: Record<string, boolean | string | number | object>;
  pluginOverrides: Record<string, boolean | string | number | object>;
  rolloutPercentage: number;
  conditions: FeatureFlagCondition[];
  metadata: {
    category: string;
    tags: string[];
    owner: string;
    createdAt: string;
    lastModified: string;
    version: string;
  };
}

export interface FeatureFlagCondition {
  type: 'user_id' | 'environment' | 'plugin_category' | 'system_version' | 'custom';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'contains';
  value: any;
  description: string;
}

export interface FeatureFlagContext {
  userId?: string;
  environment: string;
  pluginId?: string;
  pluginCategory?: string;
  systemVersion: string;
  customAttributes?: Record<string, any>;
}

export interface FeatureFlagEvaluationResult {
  flag: string;
  value: any;
  reason: string;
  source: 'default' | 'environment' | 'user_override' | 'plugin_override' | 'condition' | 'rollout';
  metadata: {
    evaluatedAt: string;
    context: FeatureFlagContext;
    conditionsEvaluated: number;
    rolloutBucket?: number;
  };
}

export interface FeatureFlagManager {
  // Flag Management
  registerFlag(flag: FeatureFlag): void;
  unregisterFlag(key: string): void;
  updateFlag(key: string, updates: Partial<FeatureFlag>): void;
  
  // Flag Evaluation
  isEnabled(key: string, context?: FeatureFlagContext): boolean;
  getValue(key: string, context?: FeatureFlagContext): any;
  evaluate(key: string, context?: FeatureFlagContext): FeatureFlagEvaluationResult;
  
  // Batch Operations
  evaluateMultiple(keys: string[], context?: FeatureFlagContext): Record<string, FeatureFlagEvaluationResult>;
  getEnabledFlags(context?: FeatureFlagContext): string[];
  
  // Configuration
  setUserOverride(userId: string, flagKey: string, value: any): void;
  removeUserOverride(userId: string, flagKey: string): void;
  setPluginOverride(pluginId: string, flagKey: string, value: any): void;
  removePluginOverride(pluginId: string, flagKey: string): void;
  
  // Monitoring and Analytics
  getUsageMetrics(flagKey?: string): FeatureFlagMetrics;
  getEvaluationHistory(flagKey: string, limit?: number): FeatureFlagEvaluationResult[];
  
  // Administrative
  getAllFlags(): FeatureFlag[];
  getFlag(key: string): FeatureFlag | null;
  validateFlag(flag: FeatureFlag): FeatureFlagValidation;
  exportConfiguration(): string;
  importConfiguration(config: string): void;
}

export interface FeatureFlagMetrics {
  totalEvaluations: number;
  uniqueUsers: number;
  enabledCount: number;
  disabledCount: number;
  evaluationsBySource: Record<string, number>;
  evaluationsByEnvironment: Record<string, number>;
  lastEvaluated: string;
  averageEvaluationTime: number;
}

export interface FeatureFlagValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Core Feature Flag Manager Implementation
 */
export class CoreFeatureFlagManager extends EventEmitter implements FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private evaluationHistory: Map<string, FeatureFlagEvaluationResult[]> = new Map();
  private metrics: Map<string, FeatureFlagMetrics> = new Map();
  private userOverrides: Map<string, Record<string, any>> = new Map();
  private pluginOverrides: Map<string, Record<string, any>> = new Map();
  
  constructor() {
    super();
    this.initializeFeatureFlags();
  }
  
  private async initializeFeatureFlags(): Promise<void> {
    logger.info('Initializing feature flag system');
    
    try {
      // Load default feature flags
      await this.loadDefaultFlags();
      
      // Load environment-specific overrides
      await this.loadEnvironmentOverrides();
      
      // Load user and plugin overrides
      await this.loadOverrides();
      
      logger.info(`Feature flag system initialized with ${this.flags.size} flags`);
    } catch (error) {
      logger.error('Failed to initialize feature flag system', error as Error);
      throw error;
    }
  }
  
  private async loadDefaultFlags(): Promise<void> {
    // Core system feature flags
    const defaultFlags: FeatureFlag[] = [
      {
        key: 'plugins.enabled',
        name: 'Plugin System Enabled',
        description: 'Enable or disable the entire plugin system',
        type: 'boolean',
        defaultValue: true,
        enabled: true,
        environments: {
          development: true,
          staging: true,
          production: true
        },
        userOverrides: {},
        pluginOverrides: {},
        rolloutPercentage: 100,
        conditions: [],
        metadata: {
          category: 'core',
          tags: ['plugins', 'system'],
          owner: 'platform-team',
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          version: '1.0.0'
        }
      },
      {
        key: 'bundles.enabled',
        name: 'Bundle System Enabled',
        description: 'Enable or disable the bundle management system',
        type: 'boolean',
        defaultValue: true,
        enabled: true,
        environments: {
          development: true,
          staging: true,
          production: true
        },
        userOverrides: {},
        pluginOverrides: {},
        rolloutPercentage: 100,
        conditions: [],
        metadata: {
          category: 'core',
          tags: ['bundles', 'system'],
          owner: 'platform-team',
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          version: '1.0.0'
        }
      },
      {
        key: 'consciousness.advanced_introspection',
        name: 'Advanced Consciousness Introspection',
        description: 'Enable advanced self-reflection and introspection capabilities',
        type: 'boolean',
        defaultValue: false,
        enabled: true,
        environments: {
          development: true,
          staging: true,
          production: false
        },
        userOverrides: {},
        pluginOverrides: {},
        rolloutPercentage: 25,
        conditions: [
          {
            type: 'plugin_category',
            operator: 'equals',
            value: 'consciousness',
            description: 'Only enable for consciousness plugins'
          }
        ],
        metadata: {
          category: 'consciousness',
          tags: ['consciousness', 'introspection', 'experimental'],
          owner: 'consciousness-team',
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          version: '1.0.0'
        }
      },
      {
        key: 'emotions.empathy_simulation',
        name: 'Empathy Simulation',
        description: 'Enable empathetic response simulation in emotional processing',
        type: 'boolean',
        defaultValue: false,
        enabled: true,
        environments: {
          development: true,
          staging: false,
          production: false
        },
        userOverrides: {},
        pluginOverrides: {},
        rolloutPercentage: 10,
        conditions: [
          {
            type: 'plugin_category',
            operator: 'equals',
            value: 'emotion',
            description: 'Only enable for emotion plugins'
          }
        ],
        metadata: {
          category: 'emotions',
          tags: ['emotions', 'empathy', 'experimental'],
          owner: 'emotion-team',
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          version: '1.0.0'
        }
      },
      {
        key: 'memory.enhanced_recall',
        name: 'Enhanced Memory Recall',
        description: 'Enable enhanced memory recall algorithms',
        type: 'boolean',
        defaultValue: true,
        enabled: true,
        environments: {
          development: true,
          staging: true,
          production: true
        },
        userOverrides: {},
        pluginOverrides: {},
        rolloutPercentage: 100,
        conditions: [],
        metadata: {
          category: 'memory',
          tags: ['memory', 'recall', 'performance'],
          owner: 'memory-team',
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          version: '1.0.0'
        }
      },
      {
        key: 'goals.autonomous_planning',
        name: 'Autonomous Goal Planning',
        description: 'Enable autonomous goal creation and planning capabilities',
        type: 'boolean',
        defaultValue: false,
        enabled: true,
        environments: {
          development: true,
          staging: false,
          production: false
        },
        userOverrides: {},
        pluginOverrides: {},
        rolloutPercentage: 5,
        conditions: [
          {
            type: 'plugin_category',
            operator: 'equals',
            value: 'goal',
            description: 'Only enable for goal plugins'
          },
          {
            type: 'system_version',
            operator: 'greater_than',
            value: '2.0.0',
            description: 'Requires system version 2.0.0 or higher'
          }
        ],
        metadata: {
          category: 'goals',
          tags: ['goals', 'planning', 'autonomous', 'experimental'],
          owner: 'goals-team',
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          version: '1.0.0'
        }
      },
      {
        key: 'identity.trait_evolution',
        name: 'Identity Trait Evolution',
        description: 'Enable dynamic personality trait evolution based on experiences',
        type: 'boolean',
        defaultValue: false,
        enabled: true,
        environments: {
          development: true,
          staging: false,
          production: false
        },
        userOverrides: {},
        pluginOverrides: {},
        rolloutPercentage: 15,
        conditions: [
          {
            type: 'plugin_category',
            operator: 'equals',
            value: 'identity',
            description: 'Only enable for identity plugins'
          }
        ],
        metadata: {
          category: 'identity',
          tags: ['identity', 'personality', 'evolution', 'experimental'],
          owner: 'identity-team',
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          version: '1.0.0'
        }
      },
      {
        key: 'security.enhanced_sandbox',
        name: 'Enhanced Plugin Sandboxing',
        description: 'Enable enhanced security sandboxing for plugins',
        type: 'boolean',
        defaultValue: true,
        enabled: true,
        environments: {
          development: false,
          staging: true,
          production: true
        },
        userOverrides: {},
        pluginOverrides: {},
        rolloutPercentage: 100,
        conditions: [],
        metadata: {
          category: 'security',
          tags: ['security', 'sandbox', 'protection'],
          owner: 'security-team',
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          version: '1.0.0'
        }
      },
      {
        key: 'logging.verbose_mode',
        name: 'Verbose Logging Mode',
        description: 'Enable verbose logging for debugging and development',
        type: 'boolean',
        defaultValue: false,
        enabled: true,
        environments: {
          development: true,
          staging: false,
          production: false
        },
        userOverrides: {},
        pluginOverrides: {},
        rolloutPercentage: 100,
        conditions: [
          {
            type: 'environment',
            operator: 'equals',
            value: 'development',
            description: 'Only enable in development environment'
          }
        ],
        metadata: {
          category: 'system',
          tags: ['logging', 'debugging', 'development'],
          owner: 'platform-team',
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          version: '1.0.0'
        }
      }
    ];
    
    for (const flag of defaultFlags) {
      this.registerFlag(flag);
    }
  }
  
  private async loadEnvironmentOverrides(): Promise<void> {
    // Load environment-specific overrides from configuration
    const config = configManager.get('features') as { environmentOverrides?: Record<string, Record<string, boolean>> };
    if (config && config.environmentOverrides) {
      const currentEnv = configManager.get('environment.name') as string || 'development';
      const overrides = config.environmentOverrides[currentEnv];
      
      if (overrides) {
        for (const [flagKey, value] of Object.entries(overrides)) {
          const flag = this.flags.get(flagKey);
          if (flag) {
            flag.environments[currentEnv] = value;
            logger.debug(`Applied environment override for flag: ${flagKey}`, { value, environment: currentEnv });
          }
        }
      }
    }
  }
  
  private async loadOverrides(): Promise<void> {
    // In a real implementation, this would load from persistent storage
    logger.debug('Loading user and plugin overrides from storage');
  }
  
  /**
   * Flag Management
   */
  registerFlag(flag: FeatureFlag): void {
    logger.debug(`Registering feature flag: ${flag.key}`, { 
      type: flag.type, 
      enabled: flag.enabled, 
      category: flag.metadata.category 
    });
    
    // Validate flag
    const validation = this.validateFlag(flag);
    if (!validation.valid) {
      throw new Error(`Feature flag validation failed: ${validation.errors.join(', ')}`);
    }
    
    this.flags.set(flag.key, flag);
    
    // Initialize metrics
    this.metrics.set(flag.key, {
      totalEvaluations: 0,
      uniqueUsers: 0,
      enabledCount: 0,
      disabledCount: 0,
      evaluationsBySource: {},
      evaluationsByEnvironment: {},
      lastEvaluated: '',
      averageEvaluationTime: 0
    });
    
    this.emit('flag:registered', { flag });
  }
  
  unregisterFlag(key: string): void {
    logger.debug(`Unregistering feature flag: ${key}`);
    
    this.flags.delete(key);
    this.metrics.delete(key);
    this.evaluationHistory.delete(key);
    
    this.emit('flag:unregistered', { key });
  }
  
  updateFlag(key: string, updates: Partial<FeatureFlag>): void {
    const flag = this.flags.get(key);
    if (!flag) {
      throw new Error(`Feature flag not found: ${key}`);
    }
    
    logger.debug(`Updating feature flag: ${key}`, { updates });
    
    const updatedFlag: FeatureFlag = {
      ...flag,
      ...updates,
      metadata: {
        ...flag.metadata,
        lastModified: new Date().toISOString(),
        ...(updates.metadata || {})
      }
    };
    
    // Validate updated flag
    const validation = this.validateFlag(updatedFlag);
    if (!validation.valid) {
      throw new Error(`Feature flag validation failed: ${validation.errors.join(', ')}`);
    }
    
    this.flags.set(key, updatedFlag);
    this.emit('flag:updated', { key, flag: updatedFlag, updates });
  }
  
  /**
   * Flag Evaluation
   */
  isEnabled(key: string, context?: FeatureFlagContext): boolean {
    const result = this.evaluate(key, context);
    return Boolean(result.value);
  }
  
  getValue(key: string, context?: FeatureFlagContext): any {
    const result = this.evaluate(key, context);
    return result.value;
  }
  
  evaluate(key: string, context?: FeatureFlagContext): FeatureFlagEvaluationResult {
    const startTime = performance.now();
    
    const flag = this.flags.get(key);
    if (!flag) {
      logger.warn(`Feature flag not found: ${key}`);
      return {
        flag: key,
        value: false,
        reason: 'Flag not found',
        source: 'default',
        metadata: {
          evaluatedAt: new Date().toISOString(),
          context: context || this.getDefaultContext(),
          conditionsEvaluated: 0
        }
      };
    }
    
    const evalContext = context || this.getDefaultContext();
    let value = flag.defaultValue;
    let source: FeatureFlagEvaluationResult['source'] = 'default';
    let reason = 'Using default value';
    let conditionsEvaluated = 0;
    
    try {
      // Check if flag is globally enabled
      if (!flag.enabled) {
        reason = 'Flag is globally disabled';
        value = false;
      } else {
        // Check user overrides first
        if (evalContext.userId && this.userOverrides.has(evalContext.userId)) {
          const userOverrides = this.userOverrides.get(evalContext.userId)!;
          if (key in userOverrides) {
            value = userOverrides[key];
            source = 'user_override';
            reason = 'User-specific override';
          }
        }
        
        // Check plugin overrides
        if (source === 'default' && evalContext.pluginId && this.pluginOverrides.has(evalContext.pluginId)) {
          const pluginOverrides = this.pluginOverrides.get(evalContext.pluginId)!;
          if (key in pluginOverrides) {
            value = pluginOverrides[key];
            source = 'plugin_override';
            reason = 'Plugin-specific override';
          }
        }
        
        // Check environment-specific value
        if (source === 'default' && flag.environments[evalContext.environment] !== undefined) {
          value = flag.environments[evalContext.environment];
          source = 'environment';
          reason = `Environment-specific value for ${evalContext.environment}`;
        }
        
        // Evaluate conditions
        if (source === 'default' || source === 'environment') {
          for (const condition of flag.conditions) {
            conditionsEvaluated++;
            
            if (this.evaluateCondition(condition, evalContext)) {
              // For boolean flags, conditions act as gates
              if (flag.type === 'boolean' && !value) {
                value = false;
                source = 'condition';
                reason = `Condition blocked: ${condition.description}`;
                break;
              }
            } else if (flag.type === 'boolean') {
              // If any condition fails for boolean flags, disable
              value = false;
              source = 'condition';
              reason = `Condition failed: ${condition.description}`;
              break;
            }
          }
        }
        
        // Apply rollout percentage (for boolean flags)
        if (flag.type === 'boolean' && value === true && flag.rolloutPercentage < 100) {
          const rolloutBucket = this.calculateRolloutBucket(key, evalContext);
          if (rolloutBucket > flag.rolloutPercentage) {
            value = false;
            source = 'rollout';
            reason = `Rollout percentage (${flag.rolloutPercentage}%) not met`;
          }
        }
      }
      
      const endTime = performance.now();
      const evaluationTime = endTime - startTime;
      
      const result: FeatureFlagEvaluationResult = {
        flag: key,
        value,
        reason,
        source,
        metadata: {
          evaluatedAt: new Date().toISOString(),
          context: evalContext,
          conditionsEvaluated,
          rolloutBucket: flag.type === 'boolean' ? this.calculateRolloutBucket(key, evalContext) : undefined
        }
      };
      
      // Update metrics
      this.updateMetrics(key, result, evaluationTime);
      
      // Store evaluation history
      this.storeEvaluationHistory(key, result);
      
      this.emit('flag:evaluated', { result });
      
      return result;
      
    } catch (error) {
      logger.error(`Error evaluating feature flag: ${key}`, error as Error);
      
      return {
        flag: key,
        value: flag.defaultValue,
        reason: `Evaluation error: ${(error as Error).message}`,
        source: 'default',
        metadata: {
          evaluatedAt: new Date().toISOString(),
          context: evalContext,
          conditionsEvaluated
        }
      };
    }
  }
  
  /**
   * Batch Operations
   */
  evaluateMultiple(keys: string[], context?: FeatureFlagContext): Record<string, FeatureFlagEvaluationResult> {
    const results: Record<string, FeatureFlagEvaluationResult> = {};
    
    for (const key of keys) {
      results[key] = this.evaluate(key, context);
    }
    
    return results;
  }
  
  getEnabledFlags(context?: FeatureFlagContext): string[] {
    const enabledFlags: string[] = [];
    
    for (const flag of this.flags.values()) {
      if (this.isEnabled(flag.key, context)) {
        enabledFlags.push(flag.key);
      }
    }
    
    return enabledFlags;
  }
  
  /**
   * Configuration Management
   */
  setUserOverride(userId: string, flagKey: string, value: any): void {
    logger.debug(`Setting user override for flag: ${flagKey}`, { userId, value });
    
    if (!this.userOverrides.has(userId)) {
      this.userOverrides.set(userId, {});
    }
    
    const userOverrides = this.userOverrides.get(userId)!;
    userOverrides[flagKey] = value;
    
    // Update the flag's user overrides
    const flag = this.flags.get(flagKey);
    if (flag) {
      flag.userOverrides[userId] = value;
    }
    
    this.emit('user_override:set', { userId, flagKey, value });
  }
  
  removeUserOverride(userId: string, flagKey: string): void {
    logger.debug(`Removing user override for flag: ${flagKey}`, { userId });
    
    const userOverrides = this.userOverrides.get(userId);
    if (userOverrides && flagKey in userOverrides) {
      delete userOverrides[flagKey];
      
      // Update the flag's user overrides
      const flag = this.flags.get(flagKey);
      if (flag && userId in flag.userOverrides) {
        delete flag.userOverrides[userId];
      }
      
      this.emit('user_override:removed', { userId, flagKey });
    }
  }
  
  setPluginOverride(pluginId: string, flagKey: string, value: any): void {
    logger.debug(`Setting plugin override for flag: ${flagKey}`, { pluginId, value });
    
    if (!this.pluginOverrides.has(pluginId)) {
      this.pluginOverrides.set(pluginId, {});
    }
    
    const pluginOverrides = this.pluginOverrides.get(pluginId)!;
    pluginOverrides[flagKey] = value;
    
    // Update the flag's plugin overrides
    const flag = this.flags.get(flagKey);
    if (flag) {
      flag.pluginOverrides[pluginId] = value;
    }
    
    this.emit('plugin_override:set', { pluginId, flagKey, value });
  }
  
  removePluginOverride(pluginId: string, flagKey: string): void {
    logger.debug(`Removing plugin override for flag: ${flagKey}`, { pluginId });
    
    const pluginOverrides = this.pluginOverrides.get(pluginId);
    if (pluginOverrides && flagKey in pluginOverrides) {
      delete pluginOverrides[flagKey];
      
      // Update the flag's plugin overrides
      const flag = this.flags.get(flagKey);
      if (flag && pluginId in flag.pluginOverrides) {
        delete flag.pluginOverrides[pluginId];
      }
      
      this.emit('plugin_override:removed', { pluginId, flagKey });
    }
  }
  
  /**
   * Monitoring and Analytics
   */
  getUsageMetrics(flagKey?: string): FeatureFlagMetrics {
    if (flagKey) {
      return this.metrics.get(flagKey) || {
        totalEvaluations: 0,
        uniqueUsers: 0,
        enabledCount: 0,
        disabledCount: 0,
        evaluationsBySource: {},
        evaluationsByEnvironment: {},
        lastEvaluated: '',
        averageEvaluationTime: 0
      };
    }
    
    // Aggregate metrics across all flags
    const aggregated: FeatureFlagMetrics = {
      totalEvaluations: 0,
      uniqueUsers: 0,
      enabledCount: 0,
      disabledCount: 0,
      evaluationsBySource: {},
      evaluationsByEnvironment: {},
      lastEvaluated: '',
      averageEvaluationTime: 0
    };
    
    for (const metrics of this.metrics.values()) {
      aggregated.totalEvaluations += metrics.totalEvaluations;
      aggregated.uniqueUsers += metrics.uniqueUsers;
      aggregated.enabledCount += metrics.enabledCount;
      aggregated.disabledCount += metrics.disabledCount;
      
      // Merge source and environment counts
      for (const [source, count] of Object.entries(metrics.evaluationsBySource)) {
        aggregated.evaluationsBySource[source] = (aggregated.evaluationsBySource[source] || 0) + count;
      }
      
      for (const [env, count] of Object.entries(metrics.evaluationsByEnvironment)) {
        aggregated.evaluationsByEnvironment[env] = (aggregated.evaluationsByEnvironment[env] || 0) + count;
      }
      
      // Update last evaluated if this is more recent
      if (metrics.lastEvaluated > aggregated.lastEvaluated) {
        aggregated.lastEvaluated = metrics.lastEvaluated;
      }
    }
    
    // Calculate average evaluation time
    if (this.metrics.size > 0) {
      aggregated.averageEvaluationTime = Array.from(this.metrics.values())
        .reduce((sum, m) => sum + m.averageEvaluationTime, 0) / this.metrics.size;
    }
    
    return aggregated;
  }
  
  getEvaluationHistory(flagKey: string, limit = 100): FeatureFlagEvaluationResult[] {
    const history = this.evaluationHistory.get(flagKey) || [];
    return history.slice(-limit);
  }
  
  /**
   * Administrative Functions
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }
  
  getFlag(key: string): FeatureFlag | null {
    return this.flags.get(key) || null;
  }
  
  validateFlag(flag: FeatureFlag): FeatureFlagValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Basic validation
    if (!flag.key) errors.push('Flag key is required');
    if (!flag.name) errors.push('Flag name is required');
    if (!flag.type) errors.push('Flag type is required');
    if (!['boolean', 'string', 'number', 'json'].includes(flag.type)) {
      errors.push('Flag type must be boolean, string, number, or json');
    }
    
    // Rollout percentage validation
    if (flag.rolloutPercentage < 0 || flag.rolloutPercentage > 100) {
      errors.push('Rollout percentage must be between 0 and 100');
    }
    
    // Condition validation
    for (const condition of flag.conditions) {
      if (!condition.type) errors.push('Condition type is required');
      if (!condition.operator) errors.push('Condition operator is required');
      if (condition.value === undefined) errors.push('Condition value is required');
    }
    
    // Type-specific validation
    if (flag.type === 'boolean' && typeof flag.defaultValue !== 'boolean') {
      warnings.push('Default value type does not match flag type');
    }
    
    // Security warnings for sensitive flags
    if (flag.key.includes('autonomous') && flag.rolloutPercentage > 50) {
      warnings.push('High rollout percentage for potentially sensitive autonomous feature');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  exportConfiguration(): string {
    const config = {
      flags: Array.from(this.flags.values()),
      userOverrides: Object.fromEntries(this.userOverrides),
      pluginOverrides: Object.fromEntries(this.pluginOverrides),
      exportedAt: new Date().toISOString()
    };
    
    return JSON.stringify(config, null, 2);
  }
  
  importConfiguration(config: string): void {
    try {
      const parsed = JSON.parse(config);
      
      logger.info('Importing feature flag configuration', { 
        flagCount: parsed.flags?.length || 0,
        userOverrideCount: Object.keys(parsed.userOverrides || {}).length,
        pluginOverrideCount: Object.keys(parsed.pluginOverrides || {}).length
      });
      
      // Import flags
      if (parsed.flags) {
        for (const flag of parsed.flags) {
          this.registerFlag(flag);
        }
      }
      
      // Import overrides
      if (parsed.userOverrides) {
        this.userOverrides.clear();
        for (const [userId, overrides] of Object.entries(parsed.userOverrides)) {
          this.userOverrides.set(userId, overrides as Record<string, any>);
        }
      }
      
      if (parsed.pluginOverrides) {
        this.pluginOverrides.clear();
        for (const [pluginId, overrides] of Object.entries(parsed.pluginOverrides)) {
          this.pluginOverrides.set(pluginId, overrides as Record<string, any>);
        }
      }
      
      this.emit('configuration:imported', { importedAt: new Date().toISOString() });
      
    } catch (error) {
      logger.error('Failed to import feature flag configuration', error as Error);
      throw new Error(`Configuration import failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Private Utility Methods
   */
  private getDefaultContext(): FeatureFlagContext {
    return {
      environment: configManager.get('environment.name') || 'development',
      systemVersion: '2.0.0' // Would be loaded from package.json or config
    };
  }
  
  private evaluateCondition(condition: FeatureFlagCondition, context: FeatureFlagContext): boolean {
    let contextValue: any;
    
    switch (condition.type) {
      case 'user_id':
        contextValue = context.userId;
        break;
      case 'environment':
        contextValue = context.environment;
        break;
      case 'plugin_category':
        contextValue = context.pluginCategory;
        break;
      case 'system_version':
        contextValue = context.systemVersion;
        break;
      case 'custom':
        contextValue = context.customAttributes?.[condition.value];
        break;
      default:
        return false;
    }
    
    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value;
      case 'not_equals':
        return contextValue !== condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(contextValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(contextValue);
      case 'greater_than':
        return contextValue > condition.value;
      case 'less_than':
        return contextValue < condition.value;
      case 'contains':
        return typeof contextValue === 'string' && contextValue.includes(condition.value);
      default:
        return false;
    }
  }
  
  private calculateRolloutBucket(flagKey: string, context: FeatureFlagContext): number {
    // Simple hash-based bucketing for consistent rollout
    const hashInput = `${flagKey}:${context.userId || context.pluginId || 'anonymous'}`;
    let hash = 0;
    
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash) % 100;
  }
  
  private updateMetrics(flagKey: string, result: FeatureFlagEvaluationResult, evaluationTime: number): void {
    const metrics = this.metrics.get(flagKey);
    if (!metrics) return;
    
    metrics.totalEvaluations++;
    metrics.lastEvaluated = result.metadata.evaluatedAt;
    
    // Update source counts
    metrics.evaluationsBySource[result.source] = (metrics.evaluationsBySource[result.source] || 0) + 1;
    
    // Update environment counts
    metrics.evaluationsByEnvironment[result.metadata.context.environment] = 
      (metrics.evaluationsByEnvironment[result.metadata.context.environment] || 0) + 1;
    
    // Update enabled/disabled counts
    if (result.value) {
      metrics.enabledCount++;
    } else {
      metrics.disabledCount++;
    }
    
    // Update average evaluation time
    metrics.averageEvaluationTime = 
      (metrics.averageEvaluationTime * (metrics.totalEvaluations - 1) + evaluationTime) / metrics.totalEvaluations;
    
    // Track unique users
    if (result.metadata.context.userId) {
      // In a real implementation, would track unique users more efficiently
      metrics.uniqueUsers = Math.max(metrics.uniqueUsers, 1);
    }
  }
  
  private storeEvaluationHistory(flagKey: string, result: FeatureFlagEvaluationResult): void {
    if (!this.evaluationHistory.has(flagKey)) {
      this.evaluationHistory.set(flagKey, []);
    }
    
    const history = this.evaluationHistory.get(flagKey)!;
    history.push(result);
    
    // Keep only last 1000 evaluations per flag
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
  }
}

// Singleton instance
export const featureFlagManager = new CoreFeatureFlagManager();
export default featureFlagManager;
