import { db } from "@/db";
import { rateLimits } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests allowed in window
}

// Default rate limits
const defaultRateLimits: Record<string, RateLimitConfig> = {
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  "api:authenticated": {
    windowMs: 60 * 1000,
    maxRequests: 300,
  },
  "api:premium": {
    windowMs: 60 * 1000,
    maxRequests: 1000,
  },
};

/**
 * Check rate limit for an identifier
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string = "api",
  config?: RateLimitConfig
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}> {
  const rateConfig = config || defaultRateLimits[endpoint] || defaultRateLimits.api;
  const now = new Date();
  const windowStart = new Date(Math.floor(now.getTime() / rateConfig.windowMs) * rateConfig.windowMs);

  try {
    // Get or create rate limit record
    const existing = await db.query.rateLimits.findFirst({
      where: and(
        eq(rateLimits.identifier, identifier),
        eq(rateLimits.endpoint, endpoint),
        gte(rateLimits.windowStart, windowStart)
      ),
    });

    if (existing) {
      const allowed = existing.requestCount < rateConfig.maxRequests;
      
      if (allowed) {
        // Increment count
        await db
          .update(rateLimits)
          .set({ requestCount: existing.requestCount + 1 })
          .where(eq(rateLimits.id, existing.id));
      }

      return {
        allowed,
        remaining: Math.max(0, rateConfig.maxRequests - existing.requestCount - (allowed ? 1 : 0)),
        resetAt: new Date(windowStart.getTime() + rateConfig.windowMs),
      };
    }

    // Create new rate limit record
    await db.insert(rateLimits).values({
      identifier,
      endpoint,
      windowStart,
      requestCount: 1,
    });

    return {
      allowed: true,
      remaining: rateConfig.maxRequests - 1,
      resetAt: new Date(windowStart.getTime() + rateConfig.windowMs),
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // Fail open - allow the request
    return {
      allowed: true,
      remaining: rateConfig.maxRequests,
      resetAt: new Date(windowStart.getTime() + rateConfig.windowMs),
    };
  }
}

/**
 * Clean up expired rate limit records
 */
export async function cleanupRateLimits(): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const { count } = await import("drizzle-orm");
  const result = await db
    .delete(rateLimits)
    .where(gte(rateLimits.createdAt, oneDayAgo));

  return 0; // TODO: Get actual count from result
}

/**
 * Get rate limit config based on user tier
 */
export function getRateLimitConfig(tier: "free" | "authenticated" | "premium"): RateLimitConfig {
  switch (tier) {
    case "premium":
      return defaultRateLimits["api:premium"];
    case "authenticated":
      return defaultRateLimits["api:authenticated"];
    case "free":
    default:
      return defaultRateLimits.api;
  }
}
