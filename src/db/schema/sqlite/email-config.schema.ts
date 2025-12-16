import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants.schema";

// Email providers
export const emailProviders = ["smtp", "sendgrid", "mailgun", "ses", "postmark"] as const;
export type EmailProvider = (typeof emailProviders)[number];

// SQLite Email Config schema
export const emailConfig = sqliteTable("email_config", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  provider: text("provider", { enum: emailProviders }).notNull(),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name"),
  encryptedCredentials: text("encrypted_credentials").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type EmailConfig = typeof emailConfig.$inferSelect;
export type NewEmailConfig = typeof emailConfig.$inferInsert;

// Relations
export const emailConfigRelations = relations(emailConfig, ({ one }) => ({
  tenant: one(tenants, {
    fields: [emailConfig.tenantId],
    references: [tenants.id],
  }),
}));
