import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get tenant configuration
 */
export async function getTenantConfig(tenantId: string): Promise<Record<string, unknown> | null> {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    columns: {
      configuration: true,
    },
  });

  return tenant?.configuration || null;
}

/**
 * Update tenant configuration
 */
export async function updateTenantConfig(
  tenantId: string,
  config: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(tenants)
      .set({
        configuration: config,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Merge tenant configuration (partial update)
 */
export async function mergeTenantConfig(
  tenantId: string,
  partialConfig: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentConfig = await getTenantConfig(tenantId);
    const newConfig = { ...currentConfig, ...partialConfig };

    return await updateTenantConfig(tenantId, newConfig);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Default configuration template
export const defaultTenantConfig = {
  features: {
    chatEnabled: true,
    pluginsEnabled: true,
    apiAccessEnabled: false,
  },
  limits: {
    maxConversations: 100,
    maxMessagesPerConversation: 1000,
  },
  branding: {
    primaryColor: "#3b82f6",
    logoUrl: null,
  },
  notifications: {
    emailNotifications: true,
    weeklyReports: false,
  },
};
