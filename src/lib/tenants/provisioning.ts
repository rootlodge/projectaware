import { db } from "@/db";
import { tenants, tenantUsers, type TenantStatus } from "@/db/schema";
import { eq } from "drizzle-orm";
import { slugSchema } from "@/lib/utils/validators";

interface CreateTenantParams {
  name: string;
  slug: string;
  ownerId: string;
  configuration?: Record<string, unknown>;
  maxUsers?: number;
  maxApiCalls?: number;
  storageLimit?: number;
}

/**
 * Create a new tenant
 */
export async function createTenant(params: CreateTenantParams): Promise<{
  success: boolean;
  tenantId?: string;
  error?: string;
}> {
  try {
    // Validate slug
    const slugValidation = slugSchema.safeParse(params.slug);
    if (!slugValidation.success) {
      return {
        success: false,
        error: slugValidation.error.errors[0].message,
      };
    }

    // Check if slug already exists
    const existing = await db.query.tenants.findFirst({
      where: eq(tenants.slug, params.slug),
    });

    if (existing) {
      return {
        success: false,
        error: "Tenant slug already exists",
      };
    }

    // Create tenant
    const [newTenant] = await db
      .insert(tenants)
      .values({
        name: params.name,
        slug: params.slug,
        status: "trial",
        configuration: params.configuration || {},
        maxUsers: params.maxUsers || 10,
        maxApiCalls: params.maxApiCalls || 10000,
        storageLimit: params.storageLimit || 1073741824, // 1GB
      })
      .returning();

    // Add owner as tenant admin
    await db.insert(tenantUsers).values({
      tenantId: newTenant.id,
      userId: params.ownerId,
      role: "owner",
    });

    return {
      success: true,
      tenantId: newTenant.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get tenant by ID
 */
export async function getTenantById(tenantId: string) {
  return await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });
}

/**
 * Get tenant by slug
 */
export async function getTenantBySlug(slug: string) {
  return await db.query.tenants.findFirst({
    where: eq(tenants.slug, slug),
  });
}

/**
 * Update tenant
 */
export async function updateTenant(
  tenantId: string,
  updates: {
    name?: string;
    status?: TenantStatus;
    configuration?: Record<string, unknown>;
    maxUsers?: number;
    maxApiCalls?: number;
    storageLimit?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(tenants)
      .set({
        ...updates,
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
 * Get user's tenants
 */
export async function getUserTenants(userId: string) {
  const userTenantsData = await db.query.tenantUsers.findMany({
    where: eq(tenantUsers.userId, userId),
    with: {
      tenant: true,
    },
  });

  return userTenantsData.map((ut) => ({
    ...ut.tenant,
    userRole: ut.role,
    joinedAt: ut.joinedAt,
  }));
}

/**
 * Get tenant users
 */
export async function getTenantUsers(tenantId: string) {
  const users = await db.query.tenantUsers.findMany({
    where: eq(tenantUsers.tenantId, tenantId),
    with: {
      user: {
        columns: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });

  return users;
}

/**
 * Add user to tenant
 */
export async function addUserToTenant(
  tenantId: string,
  userId: string,
  role: "admin" | "member" | "viewer" = "member"
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.insert(tenantUsers).values({
      tenantId,
      userId,
      role,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Remove user from tenant
 */
export async function removeUserFromTenant(
  tenantId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { and } = await import("drizzle-orm");
    await db
      .delete(tenantUsers)
      .where(and(eq(tenantUsers.tenantId, tenantId), eq(tenantUsers.userId, userId)));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
