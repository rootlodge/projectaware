import crypto from "crypto";
import { db } from "@/db";
import { apiKeys, type APIKeyScope } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Generate a secure API key
 */
export function generateAPIKey(): { key: string; hashedKey: string } {
  const key = `pa_${crypto.randomBytes(32).toString("hex")}`;
  const hashedKey =crypto.createHash("sha256").update(key).digest("hex");
  return { key, hashedKey };
}

/**
 * Create a new API key
 */
export async function createAPIKey(params: {
  name: string;
  userId: string;
  tenantId?: string;
  scope?: APIKeyScope;
  expiresInDays?: number;
}): Promise<{ success: boolean; key?: string; error?: string }> {
  try {
    const { key, hashedKey } = generateAPIKey();
    
    const expiresAt = params.expiresInDays
      ? new Date(Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    await db.insert(apiKeys).values({
      key: hashedKey,
      name: params.name,
      userId: params.userId,
      tenantId: params.tenantId,
      scope: params.scope || "read",
      expiresAt,
    });

    return { success: true, key };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Validate an API key
 */
export async function validateAPIKey(key: string): Promise<{
  valid: boolean;
  apiKey?: typeof apiKeys.$inferSelect;
  error?: string;
}> {
  try {
    const hashedKey = crypto.createHash("sha256").update(key).digest("hex");

    const apiKey = await db.query.apiKeys.findFirst({
      where: and(
        eq(apiKeys.key, hashedKey),
        eq(apiKeys.isActive, true)
      ),
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!apiKey) {
      return { valid: false, error: "Invalid API key" };
    }

    // Check expiration
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { valid: false, error: "API key has expired" };
    }

    // Update last used timestamp
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKey.id));

    return { valid: true, apiKey };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Revoke an API key
 */
export async function revokeAPIKey(
  keyId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(apiKeys)
      .set({ isActive: false })
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get user's API keys
 */
export async function getUserAPIKeys(userId: string) {
  return await db.query.apiKeys.findMany({
    where: eq(apiKeys.userId, userId),
    columns: {
      id: true,
      name: true,
      scope: true,
      lastUsedAt: true,
      expiresAt: true,
      isActive: true,
      createdAt: true,
    },
  });
}

/**
 * Check if API key has required scope
 */
export function hasRequiredScope(keyScope: APIKeyScope, requiredScope: APIKeyScope): boolean {
  const scopeHierarchy: Record<APIKeyScope, number> = {
    admin: 3,
    write: 2,
    read: 1,
  };

  return scopeHierarchy[keyScope] >= scopeHierarchy[requiredScope];
}
