import { db } from "@/db";
import { userActivity, type ActivityType } from "@/db/schema";

interface TrackActivityParams {
  userId: string;
  action: ActivityType;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Track user activity
 */
export async function trackActivity(params: TrackActivityParams): Promise<void> {
  try {
    await db.insert(userActivity).values({
      userId: params.userId,
      action: params.action,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  } catch (error) {
    console.error("Failed to track activity:", error);
    // Don't throw - activity tracking is non-critical
  }
}

/**
 * Get user activity log
 */
export async function getUserActivity(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    action?: ActivityType;
  }
) {
  const { limit = 50, offset = 0, action } = options || {};

  const { eq, and, desc } = await import("drizzle-orm");

  const whereConditions = action
    ? and(eq(userActivity.userId, userId), eq(userActivity.action, action))
    : eq(userActivity.userId, userId);

  const activities = await db.query.userActivity.findMany({
    where: whereConditions,
    orderBy: desc(userActivity.createdAt),
    limit,
    offset,
  });

  return activities;
}

/**
 * Get activity count for a user
 */
export async function getActivityCount(userId: string, action?: ActivityType): Promise<number> {
  const { eq, and, count } = await import("drizzle-orm");

  const whereConditions = action
    ? and(eq(userActivity.userId, userId), eq(userActivity.action, action))
    : eq(userActivity.userId, userId);

  const result = await db
    .select({ count: count() })
    .from(userActivity)
    .where(whereConditions);

  return result[0]?.count || 0;
}
