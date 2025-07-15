/**
 * MariaDB Schema Definitions for Project Aware v2.0
 * 
 * Comprehensive database schema supporting:
 * - Multi-tenant architecture for cloud deployment
 * - Plugin system with dynamic configurations
 * - Self-awareness features (consciousness, emotions, memory, goals, identity)
 * - User management and authentication
 * - Configuration and feature flags
 * - Audit logging and monitoring
 */

import { PoolConnection } from 'mariadb';

// ================================
// SCHEMA VERSIONING SYSTEM
// ================================

export interface SchemaVersion {
  version: string;
  description: string;
  applied_at: Date;
  rollback_script?: string;
}

export const CURRENT_SCHEMA_VERSION = '1.0.0';

// ================================
// CORE ENTITY INTERFACES
// ================================

export interface User {
  id: string;
  tenant_id?: string; // For multi-tenant cloud deployment
  email: string;
  username: string;
  display_name?: string;
  preferred_name?: string; // For AI name recognition
  password_hash: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  role: 'admin' | 'user' | 'guest';
  subscription_tier?: 'free' | 'basic' | 'premium' | 'enterprise';
  api_quota_remaining: number;
  api_quota_reset_at: Date;
  preferences: JSON; // MariaDB JSON column
  metadata: JSON; // Additional user data
  created_at: Date;
  updated_at: Date;
  last_active_at?: Date;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'startup' | 'business' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled';
  settings: JSON;
  usage_limits: JSON;
  created_at: Date;
  updated_at: Date;
}

// ================================
// PLUGIN SYSTEM SCHEMA
// ================================

export interface Plugin {
  id: string;
  name: string;
  category: 'consciousness' | 'emotion' | 'memory' | 'goal' | 'identity' | 'agent' | 'api' | 'ui' | 'analytics' | 'security';
  type: 'core' | 'enhancement' | 'community' | 'custom';
  version: string;
  description: string;
  author: string;
  repository_url?: string;
  documentation_url?: string;
  icon_url?: string;
  license: string;
  dependencies: JSON; // Array of plugin IDs
  configuration_schema: JSON; // JSON Schema for plugin config
  safety_level: 'low' | 'medium' | 'high' | 'critical';
  is_bundled: boolean;
  bundle_id?: string;
  status: 'active' | 'deprecated' | 'disabled';
  download_count: number;
  rating: number;
  created_at: Date;
  updated_at: Date;
}

export interface PluginBundle {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  install_behavior: 'atomic' | 'individual';
  plugins: JSON; // Array of plugin IDs with requirements
  dependencies: JSON; // Bundle dependencies
  configuration_schema: JSON;
  created_at: Date;
  updated_at: Date;
}

export interface UserPlugin {
  id: string;
  user_id: string;
  plugin_id: string;
  bundle_id?: string;
  is_enabled: boolean;
  configuration: JSON; // Plugin-specific settings
  installation_date: Date;
  last_used_at?: Date;
  usage_count: number;
  error_count: number;
  performance_metrics: JSON;
  created_at: Date;
  updated_at: Date;
}

// ================================
// SELF-AWARENESS FEATURES SCHEMA
// ================================

export interface ConsciousnessState {
  id: string;
  user_id: string;
  session_id: string;
  awareness_level: number; // 0-100
  introspection_depth: number;
  self_monitoring_active: boolean;
  uncertainty_threshold: number;
  metacognition_enabled: boolean;
  state_data: JSON; // Detailed consciousness metrics
  timestamp: Date;
  created_at: Date;
}

export interface EmotionState {
  id: string;
  user_id: string;
  session_id: string;
  emotion_type: 'joy' | 'sadness' | 'curiosity' | 'frustration' | 'excitement' | 'empathy' | 'humor' | 'concern' | 'confusion' | 'satisfaction';
  intensity: number; // 0-100
  trigger_event?: string;
  context: JSON;
  duration_ms: number;
  decay_rate: number;
  influenced_by: JSON; // Other emotions affecting this one
  timestamp: Date;
  created_at: Date;
}

export interface Memory {
  id: string;
  user_id: string;
  type: 'episodic' | 'semantic' | 'working' | 'long_term' | 'associative';
  content: string; // Large text content
  embedding_vector?: Buffer; // Vector embeddings for similarity search
  importance_score: number; // 0-100
  access_count: number;
  last_accessed_at?: Date;
  associations: JSON; // Related memory IDs and weights
  context_tags: JSON; // Searchable context tags
  retention_policy: 'permanent' | 'session' | 'temporary' | 'auto_decay';
  decay_date?: Date;
  is_encrypted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Goal {
  id: string;
  user_id: string;
  type: 'user_set' | 'ai_generated' | 'system_assigned';
  category: 'primary' | 'secondary' | 'sub_goal' | 'task';
  title: string;
  description: string;
  priority: number; // 1-10
  status: 'active' | 'completed' | 'paused' | 'cancelled' | 'failed';
  progress_percentage: number; // 0-100
  target_completion_date?: Date;
  actual_completion_date?: Date;
  parent_goal_id?: string;
  sub_goals: JSON; // Array of sub-goal IDs
  success_criteria: JSON;
  context_requirements: JSON;
  approval_status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  approval_requested_at?: Date;
  approved_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Identity {
  id: string;
  user_id: string;
  trait_name: string;
  trait_category: 'core' | 'adaptive' | 'behavioral' | 'communication' | 'personality';
  trait_value: JSON; // Flexible value storage
  is_mutable: boolean;
  change_history: JSON; // Track changes for rollback
  last_modified_at?: Date;
  modification_source: 'user' | 'ai_adaptation' | 'system' | 'plugin';
  approval_required: boolean;
  backup_snapshots: JSON; // Historical states for recovery
  created_at: Date;
  updated_at: Date;
}

// ================================
// CONVERSATION & CONTEXT SCHEMA
// ================================

export interface Conversation {
  id: string;
  user_id: string;
  title?: string;
  model_used: string;
  is_archived: boolean;
  thread_count: number;
  total_tokens: number;
  total_cost: number; // In cents
  context_window_size: number;
  conversation_type: 'chat' | 'api' | 'plugin' | 'agent';
  metadata: JSON;
  created_at: Date;
  updated_at: Date;
  last_message_at?: Date;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'agent' | 'plugin';
  content: string;
  content_type: 'text' | 'image' | 'audio' | 'video' | 'file' | 'structured';
  model_used?: string;
  token_count: number;
  processing_time_ms: number;
  plugin_data: JSON; // Outputs from enabled plugins
  agent_data: JSON; // Outputs from internal agents
  emotion_data: JSON; // Emotional context at time of message
  consciousness_data: JSON; // Consciousness state data
  goal_context: JSON; // Relevant goals and progress
  memory_retrievals: JSON; // Memories accessed for this message
  timestamp: Date;
  created_at: Date;
}

// ================================
// CONFIGURATION & FEATURE FLAGS
// ================================

export interface Configuration {
  id: string;
  user_id?: string; // NULL for global config
  tenant_id?: string; // For multi-tenant
  category: 'system' | 'user' | 'plugin' | 'security' | 'performance' | 'ui';
  key: string;
  value: JSON;
  value_type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  is_encrypted: boolean;
  is_system_config: boolean;
  description?: string;
  validation_schema?: JSON;
  created_at: Date;
  updated_at: Date;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  flag_type: 'boolean' | 'multivariate' | 'percentage';
  is_enabled: boolean;
  rollout_percentage: number; // 0-100 for gradual rollout
  target_users: JSON; // User IDs or criteria
  environment: 'development' | 'staging' | 'production' | 'all';
  plugin_id?: string; // If flag is plugin-specific
  conditions: JSON; // Complex flag evaluation rules
  metadata: JSON;
  created_at: Date;
  updated_at: Date;
  expires_at?: Date;
}

// ================================
// API & AUTHENTICATION SCHEMA
// ================================

export interface ApiKey {
  id: string;
  user_id: string;
  key_hash: string; // Hashed API key for security
  name: string;
  description?: string;
  scopes: JSON; // Array of allowed operations
  rate_limit: number; // Requests per minute
  quota_limit: number; // Total requests per period
  quota_used: number;
  quota_reset_at: Date;
  is_active: boolean;
  last_used_at?: Date;
  usage_count: number;
  allowed_ips: JSON; // IP whitelist
  plugin_access: JSON; // Which plugins this key can use
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  id: string;
  user_id: string;
  session_token: string;
  ip_address: string;
  user_agent: string;
  is_active: boolean;
  expires_at: Date;
  last_activity_at: Date;
  device_info: JSON;
  location_info: JSON;
  created_at: Date;
}

// ================================
// MONITORING & ANALYTICS SCHEMA
// ================================

export interface AuditLog {
  id: string;
  user_id?: string;
  tenant_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: JSON;
  new_values?: JSON;
  ip_address: string;
  user_agent: string;
  success: boolean;
  error_message?: string;
  session_id?: string;
  api_key_id?: string;
  plugin_id?: string;
  metadata: JSON;
  timestamp: Date;
}

export interface SystemMetrics {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  category: 'performance' | 'usage' | 'error' | 'security' | 'business';
  plugin_id?: string;
  user_id?: string;
  tenant_id?: string;
  tags: JSON;
  timestamp: Date;
  created_at: Date;
}

export interface PluginMetrics {
  id: string;
  plugin_id: string;
  user_id?: string;
  execution_time_ms: number;
  memory_usage_mb: number;
  cpu_usage_percentage: number;
  success: boolean;
  error_message?: string;
  input_size_bytes: number;
  output_size_bytes: number;
  timestamp: Date;
  created_at: Date;
}

// ================================
// SCHEMA UTILITIES
// ================================

export interface SchemaTable {
  name: string;
  definition: string;
  indexes: string[];
  constraints: string[];
}

export const SCHEMA_TABLES: SchemaTable[] = [
  {
    name: 'schema_versions',
    definition: `
      CREATE TABLE schema_versions (
        version VARCHAR(20) PRIMARY KEY,
        description TEXT NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        rollback_script LONGTEXT,
        INDEX idx_applied_at (applied_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
    indexes: ['idx_applied_at'],
    constraints: []
  },
  {
    name: 'tenants',
    definition: `
      CREATE TABLE tenants (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        plan ENUM('startup', 'business', 'enterprise') NOT NULL DEFAULT 'startup',
        status ENUM('active', 'suspended', 'cancelled') NOT NULL DEFAULT 'active',
        settings JSON,
        usage_limits JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_slug (slug),
        INDEX idx_status (status),
        INDEX idx_plan (plan)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
    indexes: ['idx_slug', 'idx_status', 'idx_plan'],
    constraints: ['UNIQUE KEY unique_slug (slug)']
  },
  {
    name: 'users',
    definition: `
      CREATE TABLE users (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        tenant_id CHAR(36),
        email VARCHAR(255) NOT NULL UNIQUE,
        username VARCHAR(100) NOT NULL,
        display_name VARCHAR(255),
        preferred_name VARCHAR(100),
        password_hash VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        role ENUM('admin', 'user', 'guest') NOT NULL DEFAULT 'user',
        subscription_tier ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'free',
        api_quota_remaining INT NOT NULL DEFAULT 1000,
        api_quota_reset_at TIMESTAMP NOT NULL DEFAULT (DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 MONTH)),
        preferences JSON,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_active_at TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL,
        INDEX idx_email (email),
        INDEX idx_username (username),
        INDEX idx_tenant_id (tenant_id),
        INDEX idx_role (role),
        INDEX idx_subscription_tier (subscription_tier),
        INDEX idx_is_active (is_active),
        INDEX idx_last_active (last_active_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
    indexes: ['idx_email', 'idx_username', 'idx_tenant_id', 'idx_role', 'idx_subscription_tier', 'idx_is_active', 'idx_last_active'],
    constraints: ['UNIQUE KEY unique_email (email)', 'FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL']
  }
];

export type DatabaseConnection = PoolConnection;
export type QueryResult = Record<string, unknown>[];
export type InsertResult = { insertId: number; affectedRows: number };
export type UpdateResult = { affectedRows: number; changedRows: number };
export type DeleteResult = { affectedRows: number };
