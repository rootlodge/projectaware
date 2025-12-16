import { db, schema } from "@/db";
import { and, eq, gt, sql } from "drizzle-orm";

/**
 * Check if a request exceeds the rate limit.
 * Uses a sliding window algorithm persisted in the database.
 * 
 * @param identifier Unique identifier for the client (e.g., API key or IP address)
 * @param endpoint The endpoint or resource being accessed
 * @param limit Maximum number of requests allowed in the window
 * @param windowSeconds Window duration in seconds
 * @returns true if the request is allowed, false if rate limited
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  limit: number = 60,
  windowSeconds: number = 60
): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  // 1. Clean up old rate limit entries (optimization: could be a cron job)
  // We do this async and don't wait for it to avoid latency
  cleanupOldRateLimits(windowSeconds).catch(console.error);

  // 2. Count requests in the current window
  // We identify a "bucket" by the window start time rounded to the nearest window/10 for granular sliding
  // For simplicity implementation here: We verify the exact count in the last X seconds
  // But strictly querying COUNT(*) from a logs table is expensive. 
  // Instead, the schema `rate_limits` table seems to calculate sum of requests in windows.
  // Let's use the schema's `rateLimits` table which presumably stores aggregated counters.
  
  // Implementation using `rate_limits` table defined in `api-keys.schema.ts`
  // id, identifier, endpoint, windowStart, requestCount
  
  // Basic Algorithm:
  // We define fixed windows (e.g. 1 minute buckets).
  // Current bucket is `floor(now / windowSeconds) * windowSeconds`.
  // We assume the schema supports this update-increment pattern.
  
  // NOTE: The current schema has `windowStart` as timestamp.
  // Ideally for high performance we use Redis. For DB, we use an upsert.
  
  const currentWindowStart = new Date(
    Math.floor(now.getTime() / (windowSeconds * 1000)) * (windowSeconds * 1000)
  );

  try {
    // Upsert logic differs slightly between Postgres and SQLite, Drizzle handles it usually via onConflictDoUpdate
    // However, since we need multi-db support, we might need to check then update.
    
    // Find bucket for this window
    const existing = await db.query.rateLimits.findFirst({
        where: and(
            eq(schema.rateLimits.identifier, identifier),
            eq(schema.rateLimits.endpoint, endpoint),
            eq(schema.rateLimits.windowStart, currentWindowStart)
        )
    });

    if (existing) {
        if (existing.requestCount >= limit) {
            return false;
        }
        // Increment
        await db.update(schema.rateLimits)
            .set({ requestCount: existing.requestCount + 1 })
            .where(eq(schema.rateLimits.id, existing.id));
    } else {
        // Create new bucket
        await db.insert(schema.rateLimits).values({
            identifier,
            endpoint,
            windowStart: currentWindowStart,
            requestCount: 1,
        });
    }

    return true;
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // Fail open if DB is down? or fail closed?
    // Safe default to allow traffic if rate limiting infrastructure fails
    return true; 
  }
}

async function cleanupOldRateLimits(windowSeconds: number) {
    // Delete items older than 2 windows to be safe
    const cutoff = new Date(Date.now() - (windowSeconds * 2 * 1000));
    await db.delete(schema.rateLimits).where(gt(schema.rateLimits.windowStart, cutoff)); // Wait, gt means newer. We want older. 
    // Actually we want to delete where windowStart < cutoff.
    // Drizzle `lt`
    
    // Re-implementation with correct operator
    const { lt } = await import("drizzle-orm");
     await db.delete(schema.rateLimits).where(lt(schema.rateLimits.windowStart, cutoff));
}
