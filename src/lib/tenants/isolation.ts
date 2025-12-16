import { type NextRequest } from "next/server";
import { db } from "@/db";
import { tenantUsers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Get tenant ID from request (from header, subdomain, or path)
 */
export async function getTenantId(request: NextRequest): Promise<string | null> {
  // Check for tenant ID in header (for API requests)
  const headerTenantId = request.headers.get("x-tenant-id");
  if (headerTenantId) return headerTenantId;

  // Check for subdomain (e.g., acme.projectaware.com)
  const host = request.headers.get("host");
  if (host) {
    const subdomain = host.split(".")[0];
    if (subdomain && subdomain !== "www" && subdomain !== "localhost") {
      // Look up tenant by slug
      const tenant = await db.query.tenants.findFirst({
        where: (tenants, { eq }) => eq(tenants.slug, subdomain),
        columns: { id: true },
      });
      return tenant?.id || null;
    }
  }

  // TODO: Check for tenant ID in path (/t/[slug])

  return null;
}

/**
 * Verify user belongs to tenant
 */
export async function verifyTenantAccess(userId: string, tenantId: string): Promise<boolean> {
  const access = await db.query.tenantUsers.findFirst({
    where: and(eq(tenantUsers.userId, userId), eq(tenantUsers.tenantId, tenantId)),
  });

  return !!access;
}

/**
 * Get user's role in tenant
 */
export async function getUserTenantRole(userId: string, tenantId: string) {
  const access = await db.query.tenantUsers.findFirst({
    where: and(eq(tenantUsers.userId, userId), eq(tenantUsers.tenantId, tenantId)),
    columns: { role: true },
  });

  return access?.role || null;
}

/**
 * Tenant context for request
 */
export interface TenantContext {
  tenantId: string | null;
  userId?: string;
  role?: string;
}

/**
 * Create tenant context from request
 */
export async function createTenantContext(
  request: NextRequest,
  userId?: string
): Promise<TenantContext> {
  const tenantId = await getTenantId(request);

  if (!tenantId || !userId) {
    return { tenantId };
  }

  const role = await getUserTenantRole(userId, tenantId);

  return {
    tenantId,
    userId,
    role: role || undefined,
  };
}
