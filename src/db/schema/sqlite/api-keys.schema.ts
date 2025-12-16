import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { users } from "./users.schema";
import { tenants } from "./tenants.schema";

// API key scopes
export const apiKeyScopes = ["read", "write", "admin"] as const;
export type APIKeyScope = (typeof apiKeyScopes)[number];

// SQLite API Keys schema
export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  scope: text("scope", { enum: apiKeyScopes }).notNull().default("read"),
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  keyIdx: index("api_keys_key_idx").on(table.key),
  userIdx: index("api_keys_user_idx").on(table.userId),
  tenantIdx: index("api_keys_tenant_idx").on(table.tenantId),
}));

export type APIKey = typeof apiKeys.$inferSelect;
export type NewAPIKey = typeof apiKeys.$inferInsert;

// Rate limit buckets
export const rateLimits = sqliteTable("rate_limits", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  identifier: text("identifier").notNull(),
  endpoint: text("endpoint").notNull(),
  windowStart: integer("window_start", { mode: "timestamp" }).notNull(),
  requestCount: integer("request_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  identifierWindowIdx: index("rate_limits_identifier_window_idx").on(table.identifier, table.windowStart),
}));

export type RateLimit = typeof rateLimits.$inferSelect;
export type NewRateLimit = typeof rateLimits.$inferInsert;

// Relations
export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [apiKeys.tenantId],
    references: [tenants.id],
  }),
}));
