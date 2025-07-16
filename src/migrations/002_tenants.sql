-- Multi-tenant architecture for cloud version
-- Supports complete tenant isolation and data segregation

CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
    domain TEXT UNIQUE, -- Custom domain support
    
    -- Subscription and billing
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
    stripe_customer_id TEXT,
    
    -- Resource limits
    max_users INTEGER DEFAULT 5,
    max_api_requests INTEGER DEFAULT 1000,
    max_storage_gb INTEGER DEFAULT 1,
    
    -- Features enabled
    features TEXT, -- JSON array of enabled features
    
    -- Settings
    settings TEXT, -- JSON for tenant-specific settings
    
    -- Status and metadata
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    trial_ends_at DATETIME,
    subscription_ends_at DATETIME
);

-- Tenant users relationship (many-to-many)
CREATE TABLE IF NOT EXISTS tenant_users (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    permissions TEXT, -- JSON array of specific permissions
    invited_by TEXT, -- user_id who invited this user
    invited_at DATETIME,
    joined_at DATETIME,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'declined')),
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users (id) ON DELETE SET NULL,
    
    UNIQUE (tenant_id, user_id)
);

-- Tenant invitations
CREATE TABLE IF NOT EXISTS tenant_invitations (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    invited_by TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    accepted BOOLEAN DEFAULT FALSE,
    declined BOOLEAN DEFAULT FALSE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users (id) ON DELETE CASCADE
);

-- Tenant usage tracking
CREATE TABLE IF NOT EXISTS tenant_usage (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    date DATE NOT NULL,
    
    -- Usage metrics
    api_requests INTEGER DEFAULT 0,
    storage_used_mb INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    
    -- AI specific metrics
    model_requests INTEGER DEFAULT 0,
    tokens_consumed INTEGER DEFAULT 0,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
    UNIQUE (tenant_id, date)
);

-- Tenant billing history
CREATE TABLE IF NOT EXISTS tenant_billing (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    stripe_invoice_id TEXT,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
    
    -- Billing period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Invoice details
    line_items TEXT, -- JSON array of billing line items
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

-- Indexes for tenant tables
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants (slug);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants (domain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants (status);
CREATE INDEX IF NOT EXISTS idx_tenants_plan ON tenants (plan);

CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON tenant_users (user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_role ON tenant_users (role);
CREATE INDEX IF NOT EXISTS idx_tenant_users_status ON tenant_users (status);

CREATE INDEX IF NOT EXISTS idx_tenant_invitations_tenant_id ON tenant_invitations (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_email ON tenant_invitations (email);
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_token_hash ON tenant_invitations (token_hash);

CREATE INDEX IF NOT EXISTS idx_tenant_usage_tenant_id ON tenant_usage (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_date ON tenant_usage (date);

CREATE INDEX IF NOT EXISTS idx_tenant_billing_tenant_id ON tenant_billing (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_billing_period ON tenant_billing (period_start, period_end);
