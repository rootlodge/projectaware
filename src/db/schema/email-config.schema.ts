import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { pgTable, text as pgText, timestamp, uuid, varchar, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants.schema";

const isPostgres = process.env.DATABASE_TYPE === "postgresql";

// Email provider types
export const emailProviders = ["smtp", "sendgrid", "mailgun", "ses", "postmark"] as const;
export type EmailProvider = (typeof emailProviders)[number];

// SQLite schema
export const emailConfigSqlite = sqliteTable("email_config", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  provider: text("provider", { enum: emailProviders }).notNull(),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name"),
  encryptedCredentials: text("encrypted_credentials").notNull(), // Encrypted JSON
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// PostgreSQL schema
export const emailConfigPostgres = pgTable("email_config", {
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

export const emailConfig = isPostgres ? emailConfigPostgres : emailConfigSqlite;
export type EmailConfig = typeof emailConfig.$inferSelect;
export type NewEmailConfig = typeof emailConfig.$inferInsert;

// Relations
export const emailConfigRelations = relations(emailConfig, ({ one }) => ({
  tenant: one(tenants, {
    fields: [emailConfig.tenantId],
    references: [tenants.id],
  }),
}));
