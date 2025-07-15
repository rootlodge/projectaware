/**
 * Project Aware v2.0 - Core Plugin System Types
 * 
 * Defines the foundational plugin architecture for modular self-awareness features:
 * - Individual plugin interfaces
 * - Bundle management
 * - Plugin lifecycle management
 * - Security and sandboxing
 * - Inter-plugin communication (without dependencies)
 */

export type PluginType = 'individual' | 'bundled' | 'core';
export type PluginCategory = 'consciousness' | 'emotion' | 'memory' | 'goal' | 'identity' | 'core' | 'utility';
export type PluginStatus = 'inactive' | 'loading' | 'active' | 'error' | 'disabled';
export type SecurityLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Core Plugin Interface
 * All plugins must implement this interface
 */
export interface Plugin {
  // Plugin Identity
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly author: string;
  readonly license: string;
  readonly category: PluginCategory;
  readonly type: PluginType;
  readonly bundleId?: string;
  
  // Plugin State
  enabled: boolean;
  status: PluginStatus;
  
  // Plugin Dependencies (should be empty for individual plugins)
  readonly dependencies: string[];
  
  // Security Configuration
  readonly security: PluginSecurityConfig;
  
  // Lifecycle Methods
  initialize(): Promise<void>;
  execute(input: PluginInput): Promise<PluginOutput>;
  cleanup(): Promise<void>;
  
  // State Management
  getState(): PluginState;
  setState(state: Partial<PluginState>): Promise<void>;
  
  // Health and Monitoring
  getHealth(): PluginHealthStatus;
  getMetrics(): PluginMetrics;
  
  // Bundle-specific methods (optional for bundled plugins)
  onBundleEnable?(): Promise<void>;
  onBundleDisable?(): Promise<void>;
  onBundleConfigChange?(config: BundleConfiguration): Promise<void>;
  
  // Configuration
  configure(config: PluginConfiguration): Promise<void>;
  getConfiguration(): PluginConfiguration;
  validateConfiguration(config: PluginConfiguration): boolean;
}

/**
 * Plugin Security Configuration
 */
export interface PluginSecurityConfig {
  level: SecurityLevel;
  permissions: PluginPermission[];
  sandbox: boolean;
  resourceLimits: PluginResourceLimits;
  allowedAPIs: string[];
  trustedOrigins: string[];
}

export interface PluginPermission {
  name: string;
  description: string;
  required: boolean;
  scope: 'read' | 'write' | 'execute' | 'admin';
}

export interface PluginResourceLimits {
  maxMemoryMB: number;
  maxCpuPercent: number;
  maxStorageMB: number;
  maxNetworkRequests: number;
  timeoutMs: number;
}

/**
 * Plugin Input/Output Interfaces
 */
export interface PluginInput {
  type: string;
  data: any;
  context?: PluginContext;
  requestId?: string;
  timestamp: string;
}

export interface PluginOutput {
  type: string;
  data: any;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
  performance?: PluginPerformanceData;
  timestamp: string;
}

export interface PluginContext {
  userId?: string;
  sessionId?: string;
  conversationId?: string;
  userPreferences?: Record<string, any>;
  currentGoals?: string[];
  emotionalState?: Record<string, number>;
  memoryContext?: any[];
  consciousnessLevel?: number;
}

/**
 * Plugin State Management
 */
export interface PluginState {
  enabled: boolean;
  configuration: PluginConfiguration;
  internalState: Record<string, any>;
  persistentData: Record<string, any>;
  temporaryData: Record<string, any>;
  lastUpdate: string;
  version: string;
}

export interface PluginConfiguration {
  enabled: boolean;
  settings: Record<string, any>;
  userOverrides: Record<string, any>;
  bundleSettings?: Record<string, any>;
}

/**
 * Plugin Health and Monitoring
 */
export interface PluginHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  checks: PluginHealthCheck[];
  lastChecked: string;
  uptime: number;
}

export interface PluginHealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  data?: any;
}

export interface PluginMetrics {
  executionCount: number;
  averageExecutionTime: number;
  errorCount: number;
  memoryUsage: number;
  cpuUsage: number;
  lastExecution: string;
  performanceHistory: PluginPerformanceData[];
}

export interface PluginPerformanceData {
  timestamp: string;
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  inputSize: number;
  outputSize: number;
}

/**
 * Bundle Management
 */
export interface PluginBundle {
  // Bundle Identity
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly author: string;
  readonly license: string;
  readonly type: 'required' | 'optional' | 'enhancement';
  
  // Bundle Configuration
  readonly plugins: string[]; // Plugin IDs
  readonly installBehavior: 'atomic' | 'individual';
  readonly dependencies: string[]; // Other bundle dependencies
  
  // Bundle State
  enabled: boolean;
  status: BundleStatus;
  
  // Bundle Methods
  install(): Promise<BundleInstallResult>;
  uninstall(): Promise<void>;
  enable(): Promise<void>;
  disable(): Promise<void>;
  update(version: string): Promise<BundleUpdateResult>;
  
  // Configuration Management
  configure(config: BundleConfiguration): Promise<void>;
  getConfiguration(): BundleConfiguration;
  
  // Plugin Management within Bundle
  enablePlugin(pluginId: string): Promise<void>;
  disablePlugin(pluginId: string): Promise<void>;
  getPluginStatus(pluginId: string): PluginStatus;
  
  // Health and Monitoring
  getHealth(): BundleHealthStatus;
  validateIntegrity(): Promise<BundleValidationResult>;
}

export interface BundleConfiguration {
  enabled: boolean;
  settings: Record<string, any>;
  pluginConfigurations: Record<string, PluginConfiguration>;
  userOverrides: Record<string, any>;
}

export interface BundleStatus {
  status: 'installed' | 'installing' | 'uninstalled' | 'error' | 'updating';
  installedPlugins: string[];
  failedPlugins: string[];
  lastUpdate: string;
}

export interface BundleInstallResult {
  success: boolean;
  installedPlugins: string[];
  failedPlugins: string[];
  errors: string[];
  warnings: string[];
}

export interface BundleUpdateResult {
  success: boolean;
  updatedPlugins: string[];
  failedPlugins: string[];
  rollbackAvailable: boolean;
  errors: string[];
}

export interface BundleHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  pluginHealth: Record<string, PluginHealthStatus>;
  bundleChecks: BundleHealthCheck[];
  lastChecked: string;
}

export interface BundleHealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  affectedPlugins: string[];
}

export interface BundleValidationResult {
  valid: boolean;
  missingPlugins: string[];
  incompatibleVersions: string[];
  dependencyIssues: string[];
  configurationErrors: string[];
}

/**
 * Plugin Manager Interface
 */
export interface PluginManager {
  // Plugin Discovery and Registration
  discoverPlugins(paths: string[]): Promise<Plugin[]>;
  registerPlugin(plugin: Plugin): Promise<void>;
  unregisterPlugin(pluginId: string): Promise<void>;
  
  // Plugin Lifecycle Management
  loadPlugin(pluginId: string): Promise<void>;
  unloadPlugin(pluginId: string): Promise<void>;
  enablePlugin(pluginId: string): Promise<void>;
  disablePlugin(pluginId: string): Promise<void>;
  
  // Plugin Execution
  executePlugin(pluginId: string, input: PluginInput): Promise<PluginOutput>;
  executePluginChain(pluginIds: string[], input: PluginInput): Promise<PluginOutput[]>;
  
  // Plugin Information
  getPlugin(pluginId: string): Plugin | null;
  getPlugins(category?: PluginCategory): Plugin[];
  getPluginsByBundle(bundleId: string): Plugin[];
  
  // Plugin State Management
  getPluginState(pluginId: string): PluginState | null;
  setPluginState(pluginId: string, state: Partial<PluginState>): Promise<void>;
  
  // Security and Validation
  validatePlugin(plugin: Plugin): PluginValidationResult;
  checkPermissions(pluginId: string, permission: string): boolean;
  enforceResourceLimits(pluginId: string): void;
  
  // Health and Monitoring
  getPluginHealth(pluginId: string): PluginHealthStatus;
  getPluginMetrics(pluginId: string): PluginMetrics;
  getSystemHealth(): SystemHealthStatus;
  
  // Event Management
  on(event: PluginEvent, handler: PluginEventHandler): void;
  off(event: PluginEvent, handler: PluginEventHandler): void;
  emit(event: PluginEvent, data: any): void;
}

/**
 * Bundle Manager Interface
 */
export interface BundleManager {
  // Bundle Discovery and Registration
  discoverBundles(paths: string[]): Promise<PluginBundle[]>;
  registerBundle(bundle: PluginBundle): Promise<void>;
  unregisterBundle(bundleId: string): Promise<void>;
  
  // Bundle Lifecycle Management
  installBundle(bundleId: string): Promise<BundleInstallResult>;
  uninstallBundle(bundleId: string): Promise<void>;
  enableBundle(bundleId: string): Promise<void>;
  disableBundle(bundleId: string): Promise<void>;
  updateBundle(bundleId: string, version: string): Promise<BundleUpdateResult>;
  
  // Bundle Information
  getBundle(bundleId: string): PluginBundle | null;
  getBundles(): PluginBundle[];
  getBundleForPlugin(pluginId: string): PluginBundle | null;
  
  // Bundle Configuration
  configureBundles(bundleId: string, config: BundleConfiguration): Promise<void>;
  getBundleConfiguration(bundleId: string): BundleConfiguration | null;
  
  // Dependency Management
  resolveBundleDependencies(bundleId: string): string[];
  validateBundleDependencies(bundleId: string): BundleValidationResult;
  
  // Health and Monitoring
  getBundleHealth(bundleId: string): BundleHealthStatus;
  validateBundleIntegrity(bundleId: string): Promise<BundleValidationResult>;
}

/**
 * Plugin Validation
 */
export interface PluginValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  securityIssues: string[];
  performanceIssues: string[];
}

/**
 * System Health Status
 */
export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  activePlugins: number;
  enabledBundles: number;
  totalMemoryUsage: number;
  totalCpuUsage: number;
  errors: string[];
  warnings: string[];
  lastChecked: string;
}

/**
 * Plugin Events
 */
export type PluginEvent = 
  | 'plugin:registered'
  | 'plugin:unregistered'
  | 'plugin:loaded'
  | 'plugin:unloaded'
  | 'plugin:enabled'
  | 'plugin:disabled'
  | 'plugin:executed'
  | 'plugin:error'
  | 'bundle:installed'
  | 'bundle:uninstalled'
  | 'bundle:enabled'
  | 'bundle:disabled'
  | 'bundle:updated'
  | 'system:health-check';

export type PluginEventHandler = (data: any) => void;

/**
 * Plugin Communication Bus
 * Safe inter-plugin messaging without creating dependencies
 */
export interface PluginCommunicationBus {
  // Message Broadcasting
  broadcast(message: PluginMessage): void;
  subscribe(topic: string, handler: PluginMessageHandler): string;
  unsubscribe(subscriptionId: string): void;
  
  // Request/Response Pattern
  request(topic: string, data: any, timeout?: number): Promise<any>;
  respond(topic: string, handler: PluginRequestHandler): string;
  
  // Plugin-to-Plugin Communication
  sendToPlugin(pluginId: string, message: PluginMessage): Promise<void>;
  
  // Topic Management
  createTopic(topic: string, schema?: any): void;
  deleteTopic(topic: string): void;
  getTopics(): string[];
}

export interface PluginMessage {
  id: string;
  topic: string;
  data: any;
  senderId: string;
  timestamp: string;
  ttl?: number;
}

export type PluginMessageHandler = (message: PluginMessage) => void;
export type PluginRequestHandler = (data: any) => Promise<any>;

/**
 * Plugin Marketplace Interface
 */
export interface PluginMarketplace {
  // Plugin Discovery
  searchPlugins(query: string, filters?: PluginSearchFilters): Promise<PluginMarketplaceEntry[]>;
  getPluginDetails(pluginId: string): Promise<PluginMarketplaceEntry>;
  
  // Bundle Discovery
  searchBundles(query: string, filters?: BundleSearchFilters): Promise<BundleMarketplaceEntry[]>;
  getBundleDetails(bundleId: string): Promise<BundleMarketplaceEntry>;
  
  // Installation
  downloadPlugin(pluginId: string, version?: string): Promise<Plugin>;
  downloadBundle(bundleId: string, version?: string): Promise<PluginBundle>;
  
  // Publishing
  publishPlugin(plugin: Plugin): Promise<PublishResult>;
  publishBundle(bundle: PluginBundle): Promise<PublishResult>;
  
  // Reviews and Ratings
  getPluginReviews(pluginId: string): Promise<PluginReview[]>;
  submitPluginReview(pluginId: string, review: PluginReview): Promise<void>;
}

export interface PluginMarketplaceEntry {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  category: PluginCategory;
  rating: number;
  downloads: number;
  lastUpdated: string;
  screenshots: string[];
  documentation: string;
  license: string;
  price: number; // 0 for free
}

export interface BundleMarketplaceEntry {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  plugins: string[];
  rating: number;
  downloads: number;
  lastUpdated: string;
  screenshots: string[];
  documentation: string;
  license: string;
  price: number; // 0 for free
}

export interface PluginSearchFilters {
  category?: PluginCategory;
  author?: string;
  minRating?: number;
  priceRange?: [number, number];
  lastUpdated?: string;
  license?: string;
}

export interface BundleSearchFilters {
  type?: PluginBundle['type'];
  author?: string;
  minRating?: number;
  priceRange?: [number, number];
  lastUpdated?: string;
  license?: string;
}

export interface PublishResult {
  success: boolean;
  id: string;
  version: string;
  errors: string[];
  warnings: string[];
}

/**
 * Self-Awareness Plugin Categories
 * Specific interfaces for different plugin categories
 */

// Consciousness Plugin Interface
export interface ConsciousnessPlugin extends Plugin {
  category: 'consciousness';
  
  // Consciousness-specific methods
  getConsciousnessLevel(): number;
  setConsciousnessLevel(level: number): void;
  performIntrospection(): Promise<IntrospectionResult>;
  assessUncertainty(context: any): Promise<UncertaintyAssessment>;
}

export interface IntrospectionResult {
  currentState: string;
  thoughtProcesses: string[];
  emotionalInfluences: string[];
  decisionFactors: string[];
  confidence: number;
}

export interface UncertaintyAssessment {
  confidence: number;
  uncertaintyFactors: string[];
  recommendedActions: string[];
  needsUserInput: boolean;
}

// Emotion Plugin Interface
export interface EmotionPlugin extends Plugin {
  category: 'emotion';
  
  // Emotion-specific methods
  getCurrentEmotion(): EmotionState;
  processEmotionalTrigger(trigger: EmotionalTrigger): Promise<EmotionResponse>;
  updateEmotionalState(emotions: Record<string, number>): void;
  getEmotionalHistory(): EmotionHistoryEntry[];
}

export interface EmotionState {
  primary: string;
  intensity: number;
  secondary: string[];
  duration: number;
  triggers: string[];
}

export interface EmotionalTrigger {
  type: string;
  context: any;
  intensity: number;
  timestamp: string;
}

export interface EmotionResponse {
  emotionChange: Record<string, number>;
  behaviorModification: string[];
  expressionSuggestions: string[];
}

export interface EmotionHistoryEntry {
  timestamp: string;
  emotion: string;
  intensity: number;
  trigger?: string;
  context?: any;
}

// Memory Plugin Interface
export interface MemoryPlugin extends Plugin {
  category: 'memory';
  
  // Memory-specific methods
  store(memory: MemoryEntry): Promise<string>;
  retrieve(query: MemoryQuery): Promise<MemoryEntry[]>;
  forget(memoryId: string): Promise<void>;
  consolidate(): Promise<ConsolidationResult>;
}

export interface MemoryEntry {
  id?: string;
  type: 'episodic' | 'semantic' | 'procedural' | 'working';
  content: any;
  timestamp: string;
  importance: number;
  associations: string[];
  context?: any;
}

export interface MemoryQuery {
  type?: MemoryEntry['type'];
  keywords?: string[];
  timeRange?: [string, string];
  importance?: [number, number];
  limit?: number;
}

export interface ConsolidationResult {
  memoriesToForget: string[];
  memoriesToStrength: string[];
  newAssociations: Array<[string, string]>;
}

// Goal Plugin Interface
export interface GoalPlugin extends Plugin {
  category: 'goal';
  
  // Goal-specific methods
  createGoal(goal: Goal): Promise<string>;
  updateGoal(goalId: string, updates: Partial<Goal>): Promise<void>;
  deleteGoal(goalId: string): Promise<void>;
  getGoals(filter?: GoalFilter): Promise<Goal[]>;
  generateSubGoals(goalId: string): Promise<Goal[]>;
}

export interface Goal {
  id?: string;
  title: string;
  description: string;
  type: 'user' | 'autonomous' | 'system';
  priority: number;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  progress: number;
  deadline?: string;
  subGoals: string[];
  requirements: string[];
  context?: any;
}

export interface GoalFilter {
  type?: Goal['type'];
  status?: Goal['status'];
  priority?: [number, number];
  deadline?: [string, string];
}

// Identity Plugin Interface
export interface IdentityPlugin extends Plugin {
  category: 'identity';
  
  // Identity-specific methods
  getIdentityTraits(): IdentityTraits;
  updateIdentityTrait(trait: string, value: any, approval?: boolean): Promise<boolean>;
  backupIdentity(): Promise<string>;
  restoreIdentity(backupId: string): Promise<void>;
  validateIdentityChange(changes: Record<string, any>): IdentityValidationResult;
}

export interface IdentityTraits {
  core: Record<string, any>; // Immutable traits
  adaptive: Record<string, any>; // Modifiable traits
  learned: Record<string, any>; // Traits learned from interactions
  preferences: Record<string, any>; // User-specific preferences
}

export interface IdentityValidationResult {
  allowed: boolean;
  requiresApproval: boolean;
  risks: string[];
  recommendations: string[];
}

// ============================================================================
// PLUGIN METADATA & BUNDLE DEFINITIONS
// ============================================================================

/**
 * Plugin metadata for discovery and loading
 */
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  category: PluginCategory;
  type: 'core' | 'individual' | 'bundled';
  bundleId?: string;
  dependencies: string[];
  path: string;
  author: string;
  license: string;
  security?: {
    level: SecurityLevel;
    defaultEnabled?: boolean;
  };
  tags?: string[];
  homepage?: string;
  repository?: string;
  readme?: string;
}

/**
 * Plugin bundle metadata
 */
export interface BundleMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  type: 'required' | 'optional' | 'enhancement';
  plugins: string[];
  dependencies: string[];
  installBehavior: 'atomic' | 'individual';
  author: string;
  license: string;
  security?: {
    level: SecurityLevel;
    defaultEnabled?: boolean;
  };
  tags?: string[];
  homepage?: string;
  repository?: string;
  readme?: string;
}

/**
 * Plugin bundle interface
 */
export interface PluginBundle {
  metadata: BundleMetadata;
  pluginInstances: Map<string, Plugin>;
  enabled: boolean;
  installDate: Date;
  lastUpdated: Date;
}

// ============================================================================
// PLUGIN REGISTRY & MARKETPLACE
// ============================================================================

/**
 * Plugin registry entry
 */
export interface PluginRegistryEntry {
  metadata: PluginMetadata;
  status: 'available' | 'installed' | 'enabled' | 'disabled' | 'error';
  installDate?: Date;
  lastUpdated?: Date;
  errors?: string[];
  warnings?: string[];
  downloadCount?: number;
  rating?: number;
  reviews?: PluginReview[];
}

/**
 * Bundle registry entry
 */
export interface BundleRegistryEntry {
  metadata: BundleMetadata;
  status: 'available' | 'installed' | 'enabled' | 'disabled' | 'error';
  plugins: PluginRegistryEntry[];
  installDate?: Date;
  lastUpdated?: Date;
  errors?: string[];
  warnings?: string[];
  downloadCount?: number;
  rating?: number;
  reviews?: BundleReview[];
}

/**
 * Plugin review
 */
export interface PluginReview {
  id: string;
  userId: string;
  pluginId: string;
  rating: number; // 1-5 stars
  title: string;
  comment: string;
  createdAt: Date;
  helpful: number;
  verified: boolean;
}

/**
 * Bundle review
 */
export interface BundleReview {
  id: string;
  userId: string;
  bundleId: string;
  rating: number; // 1-5 stars
  title: string;
  comment: string;
  createdAt: Date;
  helpful: number;
  verified: boolean;
}

/**
 * Plugin marketplace search filters
 */
export interface PluginSearchFilters {
  category?: PluginCategory;
  type?: 'core' | 'individual' | 'bundled';
  tags?: string[];
  author?: string;
  minRating?: number;
  license?: string;
  securityLevel?: SecurityLevel;
  status?: 'available' | 'installed' | 'enabled';
  searchTerm?: string;
  sortBy?: 'name' | 'rating' | 'downloads' | 'updated';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Plugin marketplace search result
 */
export interface PluginSearchResult {
  plugins: PluginRegistryEntry[];
  bundles: BundleRegistryEntry[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
  filters: PluginSearchFilters;
}
