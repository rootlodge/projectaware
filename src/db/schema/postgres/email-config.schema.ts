import { pgTable, text, timestamp, uuid, varchar, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants.schema";

// Email providers
export const emailProviders = ["smtp", "sendgrid", "mailgun", "ses", "postmark"] as const;
export type EmailProvider = (typeof emailProviders)[number];

// PostgreSQL Email Config schema
export const emailConfig = pgTable("email_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 50 }).notNull(),
  fromEmail: varchar("from_email", { length: 255 }).notNull(),
  fromName: varchar("from_name", { length: 255 }),
  encryptedCredentials: text("encrypted_credentials").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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
