-- Migration 004: API Usage Tracking and Additional Features
-- Add API usage tracking, tenant enhancements, and security features

-- API usage tracking table
CREATE TABLE IF NOT EXISTS api_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    user_id TEXT,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    file_size_mb REAL DEFAULT 0,
    response_time_ms INTEGER NOT NULL,
    status_code INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    request_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- Tenant resource monitoring table
CREATE TABLE IF NOT EXISTS tenant_resource_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    cpu_usage_percent REAL NOT NULL,
    memory_usage_mb REAL NOT NULL,
    storage_used_gb REAL NOT NULL,
    api_calls_count INTEGER NOT NULL DEFAULT 0,
    active_users_count INTEGER NOT NULL DEFAULT 0,
    concurrent_requests INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

-- Two-factor authentication table
CREATE TABLE IF NOT EXISTS user_two_factor_auth (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    secret TEXT NOT NULL,
    backup_codes TEXT, -- JSON array of backup codes
    is_enabled BOOLEAN DEFAULT FALSE,
    phone_number TEXT,
    method TEXT DEFAULT 'totp', -- 'totp', 'sms', 'email'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Password reset tokens table  
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tenant backup metadata table
CREATE TABLE IF NOT EXISTS tenant_backups (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    backup_type TEXT NOT NULL, -- 'full', 'incremental', 'manual'
    status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    file_path TEXT,
    file_size_bytes INTEGER,
    backup_metadata TEXT, -- JSON metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

-- API rate limiting table for dynamic limits
CREATE TABLE IF NOT EXISTS api_rate_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    limit_per_hour INTEGER NOT NULL,
    limit_per_day INTEGER NOT NULL,
    limit_per_month INTEGER NOT NULL,
    window_start TEXT NOT NULL,
    current_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
    UNIQUE (tenant_id, endpoint, method)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_usage_tenant_id ON api_usage (tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage (timestamp);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage (endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_status_code ON api_usage (status_code);
CREATE INDEX IF NOT EXISTS idx_api_usage_tenant_timestamp ON api_usage (tenant_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_tenant_resource_usage_tenant_id ON tenant_resource_usage (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_resource_usage_timestamp ON tenant_resource_usage (timestamp);
CREATE INDEX IF NOT EXISTS idx_tenant_resource_usage_tenant_timestamp ON tenant_resource_usage (tenant_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_tenant_id ON api_rate_limits (tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_endpoint ON api_rate_limits (endpoint);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_tenant_endpoint ON api_rate_limits (tenant_id, endpoint, method);

CREATE INDEX IF NOT EXISTS idx_user_two_factor_auth_user_id ON user_two_factor_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_user_two_factor_auth_enabled ON user_two_factor_auth(is_enabled);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires ON email_verification_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_tenant_backups_tenant_id ON tenant_backups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_backups_status ON tenant_backups(status);
CREATE INDEX IF NOT EXISTS idx_tenant_backups_created_at ON tenant_backups(created_at);
