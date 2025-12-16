import { db } from "@/db";
import { feedback, type FeedbackType, type FeedbackStatus } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

interface SubmitFeedbackParams {
  userId: string;
  type: FeedbackType;
  message: string;
  rating?: number;
}

/**
 * Submit user feedback
 */
export async function submitFeedback(params: SubmitFeedbackParams): Promise<{
  success: boolean;
  feedbackId?: string;
  error?: string;
}> {
  try {
    const [newFeedback] = await db
      .insert(feedback)
      .values({
        userId: params.userId,
        type: params.type,
        message: params.message,
        rating: params.rating,
        status: "pending",
      })
      .returning();

    return {
      success: true,
      feedbackId: newFeedback.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get user's feedback
 */
export async function getUserFeedback(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    type?: FeedbackType;
    status?: FeedbackStatus;
  }
) {
  const { limit = 50, offset = 0, type, status } = options || {};

  const conditions = [eq(feedback.userId, userId)];
  if (type) conditions.push(eq(feedback.type, type));
  if (status) conditions.push(eq(feedback.status, status));

  const userFeedback = await db.query.feedback.findMany({
    where: and(...conditions),
    orderBy: desc(feedback.createdAt),
    limit,
    offset,
  });

  return userFeedback;
}

/**
 * Update feedback status (admin only)
 */
export async function updateFeedbackStatus(
  feedbackId: string,
  status: FeedbackStatus,
  resolutionNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(feedback)
      .set({
        status,
        resolutionNotes,
        updatedAt: new Date(),
      })
      .where(eq(feedback.id, feedbackId));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get all feedback (admin)
 */
export async function getAllFeedback(options?: {
  limit?: number;
  offset?: number;
  type?: FeedbackType;
  status?: FeedbackStatus;
}) {
  const { limit = 50, offset = 0, type, status } = options || {};

  const conditions = [];
  if (type) conditions.push(eq(feedback.type, type));
  if (status) conditions.push(eq(feedback.status, status));

  const allFeedback = await db.query.feedback.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      user: {
        columns: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: desc(feedback.createdAt),
    limit,
    offset,
  });

  return allFeedback;
}
