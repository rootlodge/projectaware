import { db } from "@/db";
import { emailConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/utils/encryption";
import { SMTPProvider } from "./providers/smtp";
import type { EmailProvider, EmailParams, EmailCredentials } from "./providers/base";

/**
 * Get email provider for a tenant
 */
async function getEmailProvider(tenantId?: string): Promise<EmailProvider | null> {
  // Try to get tenant-specific email configuration
  if (tenantId) {
    const config = await db.query.emailConfig.findFirst({
      where: eq(emailConfig.tenantId, tenantId),
    });

    if (config && config.isActive) {
      return createEmailProvider(config);
    }
  }

  // Try to get global email configuration (tenantId is null)
  const globalConfig = await db.query.emailConfig.findFirst({
    where: eq(emailConfig.tenantId, null),
  });

  if (globalConfig && globalConfig.isActive) {
    return createEmailProvider(globalConfig);
  }

  // Fallback to environment variables
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    const credentials: EmailCredentials = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    };

    return new SMTPProvider(
      credentials,
      process.env.EMAIL_FROM || "noreply@projectaware.com",
      "Project Aware"
    );
  }

  return null;
}

/**
 * Create email provider from configuration
 */
function createEmailProvider(config: typeof emailConfig.$inferSelect): EmailProvider {
  const credentials: EmailCredentials = JSON.parse(decrypt(config.encryptedCredentials));

  switch (config.provider) {
    case "smtp":
      return new SMTPProvider(credentials, config.fromEmail, config.fromName || undefined);
    // Add other providers here (SendGrid, Mailgun, etc.)
    default:
      throw new Error(`Unsupported email provider: ${config.provider}`);
  }
}

/**
 * Send an email
 */
export async function sendEmail(
  params: EmailParams,
  tenantId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = await getEmailProvider(tenantId);

    if (!provider) {
      return {
        success: false,
        error: "No email provider configured",
      };
    }

    const result = await provider.send(params);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfig(tenantId?: string): Promise<boolean> {
  try {
    const provider = await getEmailProvider(tenantId);
    if (!provider) return false;
    return await provider.test();
  } catch {
    return false;
  }
}

// Email templates
export const emailTemplates = {
  verification: (verificationUrl: string, userName?: string) => ({
    subject: "Verify your email address",
    html: `
      <h1>Welcome${userName ? `, ${userName}` : ""}!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${verificationUrl}">Verify Email</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `,
    text: `Welcome${userName ? `, ${userName}` : ""}!\n\nPlease verify your email address by visiting: ${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, you can safely ignore this email.`,
  }),

  passwordReset: (resetUrl: string) => ({
    subject: "Reset your password",
    html: `
      <h1>Password Reset Request</h1>
      <p>You requested to reset your password. Click the link below to proceed:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
    text: `Password Reset Request\n\nYou requested to reset your password. Visit this link to proceed:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, you can safely ignore this email.`,
  }),

  welcome: (userName?: string) => ({
    subject: "Welcome to Project Aware!",
    html: `
      <h1>Welcome${userName ? `, ${userName}` : ""}!</h1>
      <p>Thank you for joining Project Aware. We're excited to have you on board!</p>
      <p>Get started by exploring your dashboard and customizing your settings.</p>
    `,
    text: `Welcome${userName ? `, ${userName}` : ""}!\n\nThank you for joining Project Aware. We're excited to have you on board!\n\nGet started by exploring your dashboard and customizing your settings.`,
  }),
};
