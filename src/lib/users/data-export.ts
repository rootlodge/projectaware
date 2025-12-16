import { db } from "@/db";
import { users, userActivity, feedback } from "@/db/schema";
import { eq } from "drizzle-orm";

interface UserDataExport {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: Date;
  };
  activity: unknown[];
  feedback: unknown[];
  exportDate: string;
}

/**
 * Export all user data (GDPR compliance)
 */
export async function exportUserData(userId: string): Promise<UserDataExport> {
  // Get user data
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Get activity data
  const activity = await db.query.userActivity.findMany({
    where: eq(userActivity.userId, userId),
  });

  // Get feedback data
  const userFeedback = await db.query.feedback.findMany({
    where: eq(feedback.userId, userId),
  });

  return {
    user,
    activity,
    feedback: userFeedback,
    exportDate: new Date().toISOString(),
  };
}

/**
 * Generate downloadable JSON export
 */
export async function generateDataExportFile(userId: string): Promise<string> {
  const data = await exportUserData(userId);
  return JSON.stringify(data, null, 2);
}
