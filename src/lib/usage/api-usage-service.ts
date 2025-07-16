import DatabaseManager from '../database/manager';
import { StripeService, SubscriptionPlan } from '../billing/stripe-service';

export interface APIUsageRecord {
  tenant_id: string;
  endpoint: string;
  method: string;
  timestamp: Date;
  tokens_used?: number;
  file_size_mb?: number;
  response_time_ms: number;
  status_code: number;
}

export interface UsageLimits {
  max_api_calls_per_hour: number;
  max_api_calls_per_day: number;
  max_api_calls_per_month: number;
  max_tokens_per_month: number;
  max_file_upload_size_mb: number;
  max_storage_gb: number;
  max_concurrent_requests: number;
}

export interface CurrentUsage {
  api_calls_this_hour: number;
  api_calls_this_day: number;
  api_calls_this_month: number;
  tokens_this_month: number;
  storage_used_gb: number;
  concurrent_requests: number;
}

export class APIUsageService {
  private db: DatabaseManager;
  private concurrentRequests: Map<string, number> = new Map();

  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  // Get usage limits based on subscription plan
  getUsageLimits(plan: SubscriptionPlan): UsageLimits {
    const baseLimits = {
      max_file_upload_size_mb: plan.limits.max_file_size_mb,
      max_storage_gb: plan.limits.storage_limit_gb,
    };

    switch (plan.id) {
      case 'free':
        return {
          ...baseLimits,
          max_api_calls_per_hour: 100,
          max_api_calls_per_day: 1000,
          max_api_calls_per_month: 10000,
          max_tokens_per_month: 100000,
          max_concurrent_requests: 5,
        };
      
      case 'pro':
        return {
          ...baseLimits,
          max_api_calls_per_hour: 5000,
          max_api_calls_per_day: 50000,
          max_api_calls_per_month: 1000000,
          max_tokens_per_month: 10000000,
          max_concurrent_requests: 50,
        };
      
      case 'enterprise':
        return {
          ...baseLimits,
          max_api_calls_per_hour: 50000,
          max_api_calls_per_day: 500000,
          max_api_calls_per_month: -1, // unlimited
          max_tokens_per_month: -1, // unlimited
          max_concurrent_requests: 500,
        };
      
      default:
        // Default to free plan limits
        return {
          ...baseLimits,
          max_api_calls_per_hour: 10,
          max_api_calls_per_day: 100,
          max_api_calls_per_month: 1000,
          max_tokens_per_month: 10000,
          max_concurrent_requests: 1,
        };
    }
  }

  // Record API usage
  async recordUsage(usage: APIUsageRecord): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO api_usage (
          tenant_id, endpoint, method, timestamp, 
          tokens_used, file_size_mb, response_time_ms, status_code
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        usage.tenant_id,
        usage.endpoint,
        usage.method,
        usage.timestamp.toISOString(),
        usage.tokens_used || 0,
        usage.file_size_mb || 0,
        usage.response_time_ms,
        usage.status_code
      );
    } catch (error) {
      console.error('Failed to record API usage:', error);
    }
  }

  // Get current usage for a tenant
  async getCurrentUsage(tenant_id: string): Promise<CurrentUsage> {
    try {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // API calls this hour
      const hourlyUsage = this.db.prepare(`
        SELECT COUNT(*) as count FROM api_usage 
        WHERE tenant_id = ? AND timestamp >= ?
      `).get(tenant_id, hourAgo.toISOString()) as { count: number };

      // API calls this day
      const dailyUsage = this.db.prepare(`
        SELECT COUNT(*) as count FROM api_usage 
        WHERE tenant_id = ? AND timestamp >= ?
      `).get(tenant_id, dayAgo.toISOString()) as { count: number };

      // API calls this month
      const monthlyUsage = this.db.prepare(`
        SELECT COUNT(*) as count FROM api_usage 
        WHERE tenant_id = ? AND timestamp >= ?
      `).get(tenant_id, monthAgo.toISOString()) as { count: number };

      // Tokens this month
      const tokenUsage = this.db.prepare(`
        SELECT SUM(tokens_used) as total FROM api_usage 
        WHERE tenant_id = ? AND timestamp >= ?
      `).get(tenant_id, monthAgo.toISOString()) as { total: number };

      // Storage used (you'd calculate this from file uploads)
      const storageUsage = this.db.prepare(`
        SELECT SUM(file_size_mb) / 1024.0 as total_gb FROM api_usage 
        WHERE tenant_id = ? AND file_size_mb > 0
      `).get(tenant_id) as { total_gb: number };

      return {
        api_calls_this_hour: hourlyUsage.count || 0,
        api_calls_this_day: dailyUsage.count || 0,
        api_calls_this_month: monthlyUsage.count || 0,
        tokens_this_month: tokenUsage.total || 0,
        storage_used_gb: storageUsage.total_gb || 0,
        concurrent_requests: this.concurrentRequests.get(tenant_id) || 0,
      };
    } catch (error) {
      console.error('Failed to get current usage:', error);
      return {
        api_calls_this_hour: 0,
        api_calls_this_day: 0,
        api_calls_this_month: 0,
        tokens_this_month: 0,
        storage_used_gb: 0,
        concurrent_requests: 0,
      };
    }
  }

  // Check if tenant can make an API request
  async canMakeRequest(tenant_id: string, stripeService: StripeService): Promise<{
    allowed: boolean;
    reason?: string;
    limits?: UsageLimits;
    current?: CurrentUsage;
  }> {
    try {
      // Get tenant's subscription plan
      const subscription = this.db.prepare(`
        SELECT plan_name FROM billing_subscriptions 
        WHERE tenant_id = ? AND status = 'active'
        ORDER BY created_at DESC LIMIT 1
      `).get(tenant_id) as { plan_name: string } | undefined;

      if (!subscription) {
        return {
          allowed: false,
          reason: 'No active subscription found',
        };
      }

      const plan = stripeService.getPlan(subscription.plan_name);
      if (!plan) {
        return {
          allowed: false,
          reason: 'Invalid subscription plan',
        };
      }

      const limits = this.getUsageLimits(plan);
      const current = await this.getCurrentUsage(tenant_id);

      // Check hourly limit
      if (limits.max_api_calls_per_hour !== -1 && current.api_calls_this_hour >= limits.max_api_calls_per_hour) {
        return {
          allowed: false,
          reason: 'Hourly API call limit exceeded',
          limits,
          current,
        };
      }

      // Check daily limit
      if (limits.max_api_calls_per_day !== -1 && current.api_calls_this_day >= limits.max_api_calls_per_day) {
        return {
          allowed: false,
          reason: 'Daily API call limit exceeded',
          limits,
          current,
        };
      }

      // Check monthly limit
      if (limits.max_api_calls_per_month !== -1 && current.api_calls_this_month >= limits.max_api_calls_per_month) {
        return {
          allowed: false,
          reason: 'Monthly API call limit exceeded',
          limits,
          current,
        };
      }

      // Check token limit
      if (limits.max_tokens_per_month !== -1 && current.tokens_this_month >= limits.max_tokens_per_month) {
        return {
          allowed: false,
          reason: 'Monthly token limit exceeded',
          limits,
          current,
        };
      }

      // Check concurrent requests
      if (current.concurrent_requests >= limits.max_concurrent_requests) {
        return {
          allowed: false,
          reason: 'Concurrent request limit exceeded',
          limits,
          current,
        };
      }

      return {
        allowed: true,
        limits,
        current,
      };
    } catch (error) {
      console.error('Failed to check API limits:', error);
      return {
        allowed: false,
        reason: 'Internal error checking limits',
      };
    }
  }

  // Track concurrent requests
  incrementConcurrentRequests(tenant_id: string): void {
    const current = this.concurrentRequests.get(tenant_id) || 0;
    this.concurrentRequests.set(tenant_id, current + 1);
  }

  decrementConcurrentRequests(tenant_id: string): void {
    const current = this.concurrentRequests.get(tenant_id) || 0;
    if (current > 0) {
      this.concurrentRequests.set(tenant_id, current - 1);
    }
  }

  // Get usage statistics for analytics
  async getUsageStats(tenant_id: string, days: number = 30): Promise<any> {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const stats = this.db.prepare(`
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as api_calls,
          SUM(tokens_used) as tokens_used,
          AVG(response_time_ms) as avg_response_time,
          COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
        FROM api_usage 
        WHERE tenant_id = ? AND timestamp >= ?
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
      `).all(tenant_id, since.toISOString());

      const totalStats = this.db.prepare(`
        SELECT 
          COUNT(*) as total_calls,
          SUM(tokens_used) as total_tokens,
          AVG(response_time_ms) as avg_response_time,
          COUNT(CASE WHEN status_code >= 400 THEN 1 END) as total_errors
        FROM api_usage 
        WHERE tenant_id = ? AND timestamp >= ?
      `).get(tenant_id, since.toISOString());

      return {
        daily_stats: stats,
        totals: totalStats,
        period_days: days,
      };
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      return null;
    }
  }

  // Cleanup old usage records (for performance)
  async cleanupOldRecords(daysToKeep: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      
      const stmt = this.db.prepare(`
        DELETE FROM api_usage WHERE timestamp < ?
      `);
      
      const result = stmt.run(cutoffDate.toISOString());
      console.log(`Cleaned up ${result.changes} old API usage records`);
    } catch (error) {
      console.error('Failed to cleanup old records:', error);
    }
  }
}

export const apiUsageService = new APIUsageService();
