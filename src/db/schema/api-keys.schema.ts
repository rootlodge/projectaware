import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { pgTable, timestamp, uuid, varchar, text as pgText, boolean, index as pgIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users, tenants } from "./users.schema";

const isPostgres = process.env.DATABASE_TYPE === "postgresql";

// API key scopes
export const apiKeyScopes = ["read", "write", "admin"] as const;
export type APIKeyScope = (typeof apiKeyScopes)[number];

// SQLite schema
export const apiKeysSqlite = sqliteTable("api_keys", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: text("key").notNull().unique(), // Hashed API key
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

export const apiKeysPostgres = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  scope: varchar("scope", { length: 50 }).notNull().default("read"),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  keyIdx: pgIndex("api_keys_key_idx").on(table.key),
  userIdx: pgIndex("api_keys_user_idx").on(table.userId),
  tenantIdx: pgIndex("api_keys_tenant_idx").on(table.tenantId),
}));

export const apiKeys = isPostgres ? apiKeysPostgres : apiKeysSqlite;
export type APIKey = typeof apiKeys.$inferSelect;
export type NewAPIKey = typeof apiKeys.$inferInsert;

// Rate limit buckets for tracking API usage
export const rateLimitsSqlite = sqliteTable("rate_limits", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  identifier: text("identifier").notNull(), // API key or IP address
  endpoint: text("endpoint").notNull(),
  windowStart: integer("window_start", { mode: "timestamp" }).notNull(),
  requestCount: integer("request_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  identifierWindowIdx: index("rate_limits_identifier_window_idx").on(table.identifier, table.windowStart),
}));

export const rateLimitsPostgres = pgTable("rate_limits", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  windowStart: timestamp("window_start").notNull(),
  requestCount: integer("request_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  identifierWindowIdx: pgIndex("rate_limits_identifier_window_idx").on(table.identifier, table.windowStart),
}));

export const rateLimits = isPostgres ? rateLimitsPostgres : rateLimitsSqlite;
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
