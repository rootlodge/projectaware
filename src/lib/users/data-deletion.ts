import { db } from "@/db";
import { users, userActivity, feedback, sessions } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Soft delete user account (GDPR right to erasure)
 */
export async function deleteUserAccount(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Soft delete user (set deletedAt timestamp)
    await db
      .update(users)
      .set({
        deletedAt: new Date(),
        // Anonymize email to prevent re-registration with same email
        email: `deleted_${userId}@deleted.local`,
        name: null,
        passwordHash: null,
        verificationToken: null,
        resetToken: null,
      })
      .where(eq(users.id, userId));

    // Delete active sessions
    await db.delete(sessions).where(eq(sessions.userId, userId));

    // Note: Activity logs and feedback are kept for audit purposes
    // but are cascade deleted when user is hard deleted

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Hard delete user and all related data (complete erasure)
 */
export async function hardDeleteUser(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Delete in order (foreign keys will cascade if configured, but being explicit)
    await db.delete(feedback).where(eq(feedback.userId, userId));
    await db.delete(userActivity).where(eq(userActivity.userId, userId));
    await db.delete(sessions).where(eq(sessions.userId, userId));
    await db.delete(users).where(eq(users.id, userId));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Anonymize user data (alternative to deletion)
 */
export async function anonymizeUser(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await db
      .update(users)
      .set({
        email: `anonymous_${userId}@anonymous.local`,
        name: "Anonymous User",
        passwordHash: null,
        verificationToken: null,
        resetToken: null,
        deletedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Delete sessions
    await db.delete(sessions).where(eq(sessions.userId, userId));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
