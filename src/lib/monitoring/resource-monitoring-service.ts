import DatabaseManager from '../database/manager';

export interface ResourceUsage {
  tenant_id: string;
  cpu_usage_percent: number;
  memory_usage_mb: number;
  storage_usage_gb: number;
  api_calls_count: number;
  concurrent_connections: number;
  last_updated: Date;
}

export interface ResourceLimits {
  cpu_cores: number;
  memory_gb: number;
  storage_gb: number;
  api_calls_per_hour: number;
  concurrent_connections: number;
}

export interface QuotaStatus {
  tenant_id: string;
  resource_type: string;
  current_usage: number;
  limit: number;
  usage_percentage: number;
  is_exceeded: boolean;
  warning_threshold: number;
  is_warning: boolean;
}

export class ResourceMonitoringService {
  private db: DatabaseManager;

  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  async updateResourceUsage(tenant_id: string, usage: Partial<ResourceUsage>): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO tenant_resource_usage (
          tenant_id, cpu_usage_percent, memory_usage_mb, storage_usage_gb,
          api_calls_count, concurrent_connections, last_updated
        )
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `);

      stmt.run(
        tenant_id,
        usage.cpu_usage_percent || 0,
        usage.memory_usage_mb || 0,
        usage.storage_usage_gb || 0,
        usage.api_calls_count || 0,
        usage.concurrent_connections || 0
      );
    } catch (error) {
      console.error('Failed to update resource usage:', error);
      throw error;
    }
  }

  async getResourceUsage(tenant_id: string): Promise<ResourceUsage | null> {
    try {
      const usage = this.db.prepare(`
        SELECT * FROM tenant_resource_usage WHERE tenant_id = ?
      `).get(tenant_id) as any;

      if (!usage) return null;

      return {
        tenant_id: usage.tenant_id,
        cpu_usage_percent: usage.cpu_usage_percent,
        memory_usage_mb: usage.memory_usage_mb,
        storage_usage_gb: usage.storage_usage_gb,
        api_calls_count: usage.api_calls_count,
        concurrent_connections: usage.concurrent_connections,
        last_updated: new Date(usage.last_updated),
      };
    } catch (error) {
      console.error('Failed to get resource usage:', error);
      throw error;
    }
  }

  async getResourceLimits(tenant_id: string): Promise<ResourceLimits | null> {
    try {
      const limits = this.db.prepare(`
        SELECT setting_value FROM tenant_settings 
        WHERE tenant_id = ? AND setting_key = 'resource_limits'
      `).get(tenant_id) as any;

      if (!limits) return null;

      return JSON.parse(limits.setting_value);
    } catch (error) {
      console.error('Failed to get resource limits:', error);
      throw error;
    }
  }

  async checkQuotas(tenant_id: string): Promise<QuotaStatus[]> {
    try {
      const usage = await this.getResourceUsage(tenant_id);
      const limits = await this.getResourceLimits(tenant_id);

      if (!usage || !limits) {
        return [];
      }

      const quotaStatuses: QuotaStatus[] = [];
      const warningThreshold = 80; // 80% warning threshold

      // CPU quota
      const cpuUsagePercent = (usage.cpu_usage_percent / (limits.cpu_cores * 100)) * 100;
      quotaStatuses.push({
        tenant_id,
        resource_type: 'cpu',
        current_usage: usage.cpu_usage_percent,
        limit: limits.cpu_cores * 100,
        usage_percentage: cpuUsagePercent,
        is_exceeded: cpuUsagePercent > 100,
        warning_threshold: warningThreshold,
        is_warning: cpuUsagePercent > warningThreshold,
      });

      // Memory quota
      const memoryUsagePercent = (usage.memory_usage_mb / (limits.memory_gb * 1024)) * 100;
      quotaStatuses.push({
        tenant_id,
        resource_type: 'memory',
        current_usage: usage.memory_usage_mb,
        limit: limits.memory_gb * 1024,
        usage_percentage: memoryUsagePercent,
        is_exceeded: memoryUsagePercent > 100,
        warning_threshold: warningThreshold,
        is_warning: memoryUsagePercent > warningThreshold,
      });

      // Storage quota
      const storageUsagePercent = (usage.storage_usage_gb / limits.storage_gb) * 100;
      quotaStatuses.push({
        tenant_id,
        resource_type: 'storage',
        current_usage: usage.storage_usage_gb,
        limit: limits.storage_gb,
        usage_percentage: storageUsagePercent,
        is_exceeded: storageUsagePercent > 100,
        warning_threshold: warningThreshold,
        is_warning: storageUsagePercent > warningThreshold,
      });

      // API calls quota (per hour)
      const apiCallsPercent = (usage.api_calls_count / limits.api_calls_per_hour) * 100;
      quotaStatuses.push({
        tenant_id,
        resource_type: 'api_calls',
        current_usage: usage.api_calls_count,
        limit: limits.api_calls_per_hour,
        usage_percentage: apiCallsPercent,
        is_exceeded: apiCallsPercent > 100,
        warning_threshold: warningThreshold,
        is_warning: apiCallsPercent > warningThreshold,
      });

      // Concurrent connections quota
      const connectionsPercent = (usage.concurrent_connections / limits.concurrent_connections) * 100;
      quotaStatuses.push({
        tenant_id,
        resource_type: 'connections',
        current_usage: usage.concurrent_connections,
        limit: limits.concurrent_connections,
        usage_percentage: connectionsPercent,
        is_exceeded: connectionsPercent > 100,
        warning_threshold: warningThreshold,
        is_warning: connectionsPercent > warningThreshold,
      });

      return quotaStatuses;
    } catch (error) {
      console.error('Failed to check quotas:', error);
      throw error;
    }
  }

  async getQuotaViolations(): Promise<QuotaStatus[]> {
    try {
      // Get all tenants
      const tenants = this.db.prepare(`
        SELECT id FROM tenants WHERE status = 'active'
      `).all() as any[];

      const violations: QuotaStatus[] = [];

      for (const tenant of tenants) {
        const quotas = await this.checkQuotas(tenant.id);
        const exceeded = quotas.filter(q => q.is_exceeded);
        violations.push(...exceeded);
      }

      return violations;
    } catch (error) {
      console.error('Failed to get quota violations:', error);
      throw error;
    }
  }

  async incrementApiCallCount(tenant_id: string): Promise<void> {
    try {
      // Get current count or create new record
      const current = await this.getResourceUsage(tenant_id);
      const currentCount = current?.api_calls_count || 0;

      await this.updateResourceUsage(tenant_id, {
        api_calls_count: currentCount + 1,
      });
    } catch (error) {
      console.error('Failed to increment API call count:', error);
      throw error;
    }
  }

  async resetHourlyCounters(): Promise<void> {
    try {
      // Reset hourly counters for all tenants
      this.db.prepare(`
        UPDATE tenant_resource_usage 
        SET api_calls_count = 0, last_updated = datetime('now')
      `).run();
      
      console.log('Hourly counters reset successfully');
    } catch (error) {
      console.error('Failed to reset hourly counters:', error);
      throw error;
    }
  }

  async getTenantResourceSummary(tenant_id: string) {
    try {
      const usage = await this.getResourceUsage(tenant_id);
      const limits = await this.getResourceLimits(tenant_id);
      const quotas = await this.checkQuotas(tenant_id);

      return {
        tenant_id,
        usage,
        limits,
        quotas,
        has_violations: quotas.some(q => q.is_exceeded),
        has_warnings: quotas.some(q => q.is_warning),
        last_updated: usage?.last_updated,
      };
    } catch (error) {
      console.error('Failed to get tenant resource summary:', error);
      throw error;
    }
  }
}

export const resourceMonitoringService = new ResourceMonitoringService();
