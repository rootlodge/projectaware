import { betterAuth } from "better-auth";
import { db, schema } from "@/db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sendEmail, emailTemplates } from "@/lib/email";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET environment variable is required");
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: process.env.DATABASE_TYPE === "postgresql" ? "pg" : "sqlite",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
    },
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification:
      !!process.env.SMTP_HOST &&
      process.env.SMTP_USER !== "your-email@gmail.com",
  },

  email: {
    sendVerificationEmail: async ({ user, url }) => {
      const template = emailTemplates.verification(
        url,
        user.name ?? undefined
      );

      await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    },

    sendResetPasswordEmail: async ({ user, url }) => {
      const template = emailTemplates.passwordReset(url);

      await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",

  advanced: {
    generateId: false, // Let PostgreSQL generate UUIDs using defaultRandom()
  },
});

export type Session = typeof auth.$Infer.Session;
