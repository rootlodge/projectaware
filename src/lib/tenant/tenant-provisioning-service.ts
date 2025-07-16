import DatabaseManager from '../database/manager';
import { v4 as uuidv4 } from 'uuid';

export interface TenantProvisioningRequest {
  name: string;
  owner_email: string;
  plan: 'free' | 'pro' | 'enterprise';
  settings?: Record<string, any>;
}

export interface TenantProvisioningResult {
  tenant_id: string;
  success: boolean;
  error?: string;
  provisioning_steps: Array<{
    step: string;
    success: boolean;
    message?: string;
  }>;
}

export class TenantProvisioningService {
  private db: DatabaseManager;

  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  async provisionTenant(request: TenantProvisioningRequest): Promise<TenantProvisioningResult> {
    const tenant_id = uuidv4();
    const steps: Array<{ step: string; success: boolean; message?: string }> = [];
    
    try {
      // Step 1: Create tenant record
      steps.push(await this.createTenantRecord(tenant_id, request));
      
      // Step 2: Create default settings
      steps.push(await this.createDefaultSettings(tenant_id, request.plan));
      
      // Step 3: Set up resource limits
      steps.push(await this.setResourceLimits(tenant_id, request.plan));
      
      // Step 4: Create billing subscription
      steps.push(await this.createBillingSubscription(tenant_id, request.plan));
      
      // Step 5: Send welcome notification
      steps.push(await this.sendWelcomeNotification(tenant_id, request.owner_email));
      
      const allSuccessful = steps.every(step => step.success);
      
      if (!allSuccessful) {
        // Cleanup on failure
        await this.cleanupFailedProvisioning(tenant_id);
        throw new Error('Tenant provisioning failed');
      }
      
      return {
        tenant_id,
        success: true,
        provisioning_steps: steps
      };
      
    } catch (error) {
      console.error('Tenant provisioning failed:', error);
      
      return {
        tenant_id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provisioning_steps: steps
      };
    }
  }

  private async createTenantRecord(tenant_id: string, request: TenantProvisioningRequest) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO tenants (id, name, status, plan, created_at, updated_at)
        VALUES (?, ?, 'active', ?, datetime('now'), datetime('now'))
      `);
      
      stmt.run(tenant_id, request.name, request.plan);
      
      return { step: 'create_tenant', success: true, message: 'Tenant record created' };
    } catch (error) {
      return { 
        step: 'create_tenant', 
        success: false, 
        message: `Failed to create tenant: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private async createDefaultSettings(tenant_id: string, plan: string) {
    try {
      const defaultSettings = this.getDefaultSettingsForPlan(plan);
      
      for (const [key, value] of Object.entries(defaultSettings)) {
        const stmt = this.db.prepare(`
          INSERT INTO tenant_settings (tenant_id, setting_key, setting_value, created_at, updated_at)
          VALUES (?, ?, ?, datetime('now'), datetime('now'))
        `);
        
        stmt.run(tenant_id, key, JSON.stringify(value));
      }
      
      return { step: 'default_settings', success: true, message: 'Default settings created' };
    } catch (error) {
      return { 
        step: 'default_settings', 
        success: false, 
        message: `Failed to create settings: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private async setResourceLimits(tenant_id: string, plan: string) {
    try {
      const limits = this.getResourceLimitsForPlan(plan);
      
      const stmt = this.db.prepare(`
        INSERT INTO tenant_settings (tenant_id, setting_key, setting_value, created_at, updated_at)
        VALUES (?, 'resource_limits', ?, datetime('now'), datetime('now'))
      `);
      
      stmt.run(tenant_id, JSON.stringify(limits));
      
      return { step: 'resource_limits', success: true, message: 'Resource limits set' };
    } catch (error) {
      return { 
        step: 'resource_limits', 
        success: false, 
        message: `Failed to set limits: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private async createBillingSubscription(tenant_id: string, plan: string) {
    try {
      if (plan === 'free') {
        return { step: 'billing_subscription', success: true, message: 'Free plan - no billing required' };
      }
      
      const stmt = this.db.prepare(`
        INSERT INTO billing_subscriptions (
          id, tenant_id, plan_name, status, 
          current_period_start, current_period_end,
          created_at, updated_at
        )
        VALUES (?, ?, ?, 'active', date('now'), date('now', '+1 month'), datetime('now'), datetime('now'))
      `);
      
      stmt.run(uuidv4(), tenant_id, plan);
      
      return { step: 'billing_subscription', success: true, message: 'Billing subscription created' };
    } catch (error) {
      return { 
        step: 'billing_subscription', 
        success: false, 
        message: `Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private async sendWelcomeNotification(tenant_id: string, owner_email: string) {
    try {
      // This would integrate with the notification service
      // For now, we'll just log it
      console.log(`Welcome notification sent to ${owner_email} for tenant ${tenant_id}`);
      
      return { step: 'welcome_notification', success: true, message: 'Welcome notification sent' };
    } catch (error) {
      return { 
        step: 'welcome_notification', 
        success: false, 
        message: `Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private async cleanupFailedProvisioning(tenant_id: string) {
    try {
      // Clean up tenant records
      this.db.prepare('DELETE FROM tenant_settings WHERE tenant_id = ?').run(tenant_id);
      this.db.prepare('DELETE FROM billing_subscriptions WHERE tenant_id = ?').run(tenant_id);
      this.db.prepare('DELETE FROM tenants WHERE id = ?').run(tenant_id);
      
      console.log(`Cleaned up failed provisioning for tenant ${tenant_id}`);
    } catch (error) {
      console.error('Failed to cleanup failed provisioning:', error);
    }
  }

  private getDefaultSettingsForPlan(plan: string): Record<string, any> {
    const baseSettings = {
      features: {
        ai_chat: true,
        file_upload: true,
        conversation_history: true,
      },
      ui: {
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
      },
      security: {
        two_factor_required: false,
        session_timeout: 3600,
        password_policy: 'standard',
      },
    };

    switch (plan) {
      case 'free':
        return {
          ...baseSettings,
          limits: {
            max_users: 5,
            max_conversations_per_month: 100,
            max_file_size_mb: 10,
            storage_limit_gb: 1,
          },
        };
      
      case 'pro':
        return {
          ...baseSettings,
          features: {
            ...baseSettings.features,
            advanced_analytics: true,
            custom_models: true,
            priority_support: true,
          },
          limits: {
            max_users: 50,
            max_conversations_per_month: 10000,
            max_file_size_mb: 100,
            storage_limit_gb: 50,
          },
        };
      
      case 'enterprise':
        return {
          ...baseSettings,
          features: {
            ...baseSettings.features,
            advanced_analytics: true,
            custom_models: true,
            priority_support: true,
            sso: true,
            advanced_security: true,
            custom_branding: true,
          },
          limits: {
            max_users: -1, // unlimited
            max_conversations_per_month: -1,
            max_file_size_mb: 1000,
            storage_limit_gb: 1000,
          },
        };
      
      default:
        return baseSettings;
    }
  }

  private getResourceLimitsForPlan(plan: string) {
    switch (plan) {
      case 'free':
        return {
          cpu_cores: 1,
          memory_gb: 2,
          storage_gb: 5,
          api_calls_per_hour: 100,
          concurrent_connections: 5,
        };
      
      case 'pro':
        return {
          cpu_cores: 4,
          memory_gb: 8,
          storage_gb: 100,
          api_calls_per_hour: 5000,
          concurrent_connections: 50,
        };
      
      case 'enterprise':
        return {
          cpu_cores: 16,
          memory_gb: 32,
          storage_gb: 1000,
          api_calls_per_hour: 50000,
          concurrent_connections: 1000,
        };
      
      default:
        return {
          cpu_cores: 1,
          memory_gb: 1,
          storage_gb: 1,
          api_calls_per_hour: 10,
          concurrent_connections: 1,
        };
    }
  }

  async getTenantProvisioningStatus(tenant_id: string) {
    try {
      const tenant = this.db.prepare(`
        SELECT * FROM tenants WHERE id = ?
      `).get(tenant_id);
      
      if (!tenant) {
        return { status: 'not_found' };
      }
      
      const settings = this.db.prepare(`
        SELECT setting_key, setting_value FROM tenant_settings WHERE tenant_id = ?
      `).all(tenant_id);
      
      const subscription = this.db.prepare(`
        SELECT * FROM billing_subscriptions WHERE tenant_id = ?
      `).get(tenant_id);
      
      return {
        status: 'provisioned',
        tenant,
        settings: settings.reduce((acc: any, setting: any) => {
          acc[setting.setting_key] = JSON.parse(setting.setting_value);
          return acc;
        }, {}),
        subscription,
      };
    } catch (error) {
      console.error('Failed to get tenant status:', error);
      return { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const tenantProvisioningService = new TenantProvisioningService();
