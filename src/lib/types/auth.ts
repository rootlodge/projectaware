// User and Authentication Types

export interface User {
  id: string;
  email: string;
  username?: string;
  password_hash?: string;
  full_name?: string;
  avatar_url?: string;
  email_verified: boolean;
  phone?: string;
  phone_verified: boolean;
  
  // OAuth providers
  google_id?: string;
  github_id?: string;
  microsoft_id?: string;
  
  // User preferences
  theme: 'light' | 'dark' | 'tech';
  language: string;
  timezone: string;
  
  // Status and metadata
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  role: 'user' | 'admin' | 'moderator';
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_login?: string;
  
  // GDPR and privacy
  privacy_consent: boolean;
  marketing_consent: boolean;
  data_retention_days: number;
}

export interface UserSession {
  id: string;
  user_id: string;
  token_hash: string;
  device_info?: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: string;
  created_at: string;
  last_accessed: string;
  is_active: boolean;
}

export interface PasswordResetToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

export interface EmailVerificationToken {
  id: string;
  user_id: string;
  token_hash: string;
  email: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

export interface User2FA {
  id: string;
  user_id: string;
  secret: string;
  enabled: boolean;
  backup_codes?: string; // JSON array
  created_at: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  details?: string; // JSON
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Tenant Types
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  
  // Subscription and billing
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  stripe_customer_id?: string;
  
  // Resource limits
  max_users: number;
  max_api_requests: number;
  max_storage_gb: number;
  
  // Features and settings
  features?: string; // JSON array
  settings?: string; // JSON object
  
  // Status and metadata
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  
  // Timestamps
  created_at: string;
  updated_at: string;
  trial_ends_at?: string;
  subscription_ends_at?: string;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions?: string; // JSON array
  invited_by?: string;
  invited_at?: string;
  joined_at?: string;
  status: 'active' | 'inactive' | 'pending' | 'declined';
  created_at: string;
  updated_at: string;
}

export interface TenantInvitation {
  id: string;
  tenant_id: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  invited_by: string;
  token_hash: string;
  expires_at: string;
  accepted: boolean;
  declined: boolean;
  created_at: string;
  accepted_at?: string;
}

export interface TenantUsage {
  id: string;
  tenant_id: string;
  date: string;
  api_requests: number;
  storage_used_mb: number;
  active_users: number;
  model_requests: number;
  tokens_consumed: number;
  created_at: string;
}

export interface TenantBilling {
  id: string;
  tenant_id: string;
  stripe_invoice_id?: string;
  amount_cents: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  period_start: string;
  period_end: string;
  line_items?: string; // JSON array
  created_at: string;
  paid_at?: string;
}

// Authentication Request/Response Types
export interface SignUpRequest {
  email: string;
  username?: string;
  password: string;
  full_name?: string;
  privacy_consent: boolean;
  marketing_consent?: boolean;
}

export interface SignInRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: Omit<User, 'password_hash'>;
  token?: string;
  refresh_token?: string;
  expires_at?: string;
  error?: string;
  requires_verification?: boolean;
  requires_2fa?: boolean;
}

export interface JWTPayload {
  sub: string; // user_id
  email: string;
  role: string;
  tenant_id?: string;
  tenant_role?: string;
  iat: number;
  exp: number;
}

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  theme: string;
  language: string;
  timezone: string;
  email_verified: boolean;
  phone?: string;
  phone_verified: boolean;
  privacy_consent: boolean;
  marketing_consent: boolean;
  created_at: string;
  last_login?: string;
}

export interface UpdateProfileRequest {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  theme?: 'light' | 'dark' | 'tech';
  language?: string;
  timezone?: string;
  phone?: string;
  marketing_consent?: boolean;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// Role and Permission Types
export type UserRole = 'user' | 'admin' | 'moderator';
export type TenantRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface RolePermissions {
  role: UserRole | TenantRole;
  permissions: Permission[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
