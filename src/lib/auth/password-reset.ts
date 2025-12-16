import { nanoid } from "nanoid";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./password";

/**
 * Generate a password reset token
 */
export function generateResetToken(): string {
  return nanoid(32);
}

/**
 * Get reset token expiration (1 hour from now)
 */
export function getResetExpiration(): Date {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + 1);
  return expiration;
}

/**
 * Create password reset token for a user
 */
export async function createResetToken(email: string): Promise<{
  success: boolean;
  error?: string;
  token?: string;
  userId?: string;
}> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    // Return success even if user not found (security best practice)
    return { success: true };
  }

  const token = generateResetToken();
  const expires = getResetExpiration();

  await db
    .update(users)
    .set({
      resetToken: token,
      resetExpires: expires,
    })
    .where(eq(users.id, user.id));

  return { success: true, token, userId: user.id };
}

/**
 * Verify reset token
 */
export async function verifyResetToken(token: string): Promise<{
  valid: boolean;
  error?: string;
  userId?: string;
}> {
  const user = await db.query.users.findFirst({
    where: eq(users.resetToken, token),
  });

  if (!user) {
    return { valid: false, error: "Invalid reset token" };
  }

  if (user.resetExpires && user.resetExpires < new Date()) {
    return { valid: false, error: "Reset token has expired" };
  }

  return { valid: true, userId: user.id };
}

/**
 * Reset password with token
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const verification = await verifyResetToken(token);

  if (!verification.valid || !verification.userId) {
    return { success: false, error: verification.error };
  }

  const passwordHash = await hashPassword(newPassword);

  await db
    .update(users)
    .set({
      passwordHash,
      resetToken: null,
      resetExpires: null,
    })
    .where(eq(users.id, verification.userId));

  return { success: true };
}

/**
 * Change password (for authenticated users)
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user || !user.passwordHash) {
    return { success: false, error: "User not found" };
  }

  const { comparePassword } = await import("./password");
  const isValid = await comparePassword(currentPassword, user.passwordHash);

  if (!isValid) {
    return { success: false, error: "Current password is incorrect" };
  }

  const passwordHash = await hashPassword(newPassword);

  await db
    .update(users)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return { success: true };
}
