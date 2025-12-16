import { db } from "@/db";
import { tenants, tenantUsers } from "@/db/schema";
import { eq, count as drizzleCount } from "drizzle-orm";

interface QuotaCheck {
  allowed: boolean;
  current: number;
  limit: number;
  percentage: number;
}

/**
 * Check if tenant can add more users
 */
export async function checkUserQuota(tenantId: string): Promise<QuotaCheck> {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    columns: {
      maxUsers: true,
    },
  });

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  const [result] = await db
    .select({ count: drizzleCount() })
    .from(tenantUsers)
    .where(eq(tenantUsers.tenantId, tenantId));

  const current = result?.count || 0;
  const limit = tenant.maxUsers || 10;
  const percentage = (current / limit) * 100;

  return {
    allowed: current < limit,
    current,
    limit,
    percentage,
  };
}

/**
 * Check API call quota
 */
export async function checkApiCallQuota(tenantId: string, currentCount: number): Promise<QuotaCheck> {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    columns: {
      maxApiCalls: true,
    },
  });

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  const limit = tenant.maxApiCalls || 10000;
  const percentage = (currentCount / limit) * 100;

  return {
    allowed: currentCount < limit,
    current: currentCount,
    limit,
    percentage,
  };
}

/**
 * Check storage quota
 */
export async function checkStorageQuota(tenantId: string, currentUsage: number): Promise<QuotaCheck> {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    columns: {
      storageLimit: true,
    },
  });

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  const limit = tenant.storageLimit || 1073741824; // 1GB
  const percentage = (currentUsage / limit) * 100;

  return {
    allowed: currentUsage < limit,
    current: currentUsage,
    limit,
    percentage,
  };
}

/**
 * Check if approaching any quota limits (>80%)
 */
export async function getQuotaAlerts(tenantId: string, apiCallCount: number, storageUsage: number) {
  const alerts: string[] = [];

  const userQuota = await checkUserQuota(tenantId);
  if (userQuota.percentage > 80) {
    alerts.push(`User limit: ${userQuota.percentage.toFixed(0)}% used (${userQuota.current}/${userQuota.limit})`);
  }

  const apiQuota = await checkApiCallQuota(tenantId, apiCallCount);
  if (apiQuota.percentage > 80) {
    alerts.push(`API call limit: ${apiQuota.percentage.toFixed(0)}% used (${apiQuota.current}/${apiQuota.limit})`);
  }

  const storageQuota = await checkStorageQuota(tenantId, storageUsage);
  if (storageQuota.percentage > 80) {
    const { formatBytes } = await import("@/lib/utils");
    alerts.push(
      `Storage limit: ${storageQuota.percentage.toFixed(0)}% used (${formatBytes(storageQuota.current)}/${formatBytes(storageQuota.limit)})`
    );
  }

  return alerts;
}
