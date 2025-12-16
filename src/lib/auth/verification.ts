import { nanoid } from "nanoid";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Generate a verification token
 */
export function generateVerificationToken(): string {
  return nanoid(32);
}

/**
 * Get verification token expiration (24 hours from now)
 */
export function getVerificationExpiration(): Date {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + 24);
  return expiration;
}

/**
 * Create verification token for a user
 */
export async function createVerificationToken(userId: string): Promise<string> {
  const token = generateVerificationToken();
  const expires = getVerificationExpiration();

  await db
    .update(users)
    .set({
      verificationToken: token,
      verificationExpires: expires,
    })
    .where(eq(users.id, userId));

  return token;
}

/**
 * Verify email with token
 */
export async function verifyEmailWithToken(
  token: string
): Promise<{ success: boolean; error?: string; userId?: string }> {
  const user = await db.query.users.findFirst({
    where: eq(users.verificationToken, token),
  });

  if (!user) {
    return { success: false, error: "Invalid verification token" };
  }

  if (user.verificationExpires && user.verificationExpires < new Date()) {
    return { success: false, error: "Verification token has expired" };
  }

  // Mark email as verified
  await db
    .update(users)
    .set({
      emailVerified: true,
      verificationToken: null,
      verificationExpires: null,
    })
    .where(eq(users.id, user.id));

  return { success: true, userId: user.id };
}

/**
 * Check if a user's email is verified
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { emailVerified: true },
  });

  return user?.emailVerified === true;
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string): Promise<{
  success: boolean;
  error?: string;
  token?: string;
}> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  if (user.emailVerified) {
    return { success: false, error: "Email already verified" };
  }

  const token = await createVerificationToken(user.id);
  return { success: true, token };
}
