import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { pgTable, text as pgText, timestamp, uuid, varchar, jsonb, integer as pgInteger, doublePrecision, boolean, index as pgIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants.schema";

const isPostgres = process.env.DATABASE_TYPE === "postgresql";

// AI Model providers
export const aiProviders = ["openai", "anthropic", "ollama", "cohere", "custom"] as const;
export type AIProvider = (typeof aiProviders)[number];

// Model status
export const modelStatuses = ["active", "inactive", "deprecated"] as const;
export type ModelStatus = (typeof modelStatuses)[number];

// SQLite schema
export const aiModelsSqlite = sqliteTable("ai_models", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  provider: text("provider", { enum: aiProviders }).notNull(),
  modelId: text("model_id").notNull(), // e.g., "gpt-4", "claude-3"
  version: text("version"),
  description: text("description"),
  status: text("status", { enum: modelStatuses }).notNull().default("active"),
  capabilities: text("capabilities", { mode: "json" }).$type<string[]>(), // ["chat", "vision", "function-calling"]
  contextWindow: integer("context_window"), // Max tokens
  maxOutputTokens: integer("max_output_tokens"),
  costPer1kInputTokens: real("cost_per_1k_input_tokens"),
  costPer1kOutputTokens: real("cost_per_1k_output_tokens"),
  supportsStreaming: integer("supports_streaming", { mode: "boolean" }).default(true),
  supportsVision: integer("supports_vision", { mode: "boolean" }).default(false),
  supportsFunctionCalling: integer("supports_function_calling", { mode: "boolean" }).default(false),
  configuration: text("configuration", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  providerIdx: index("ai_models_provider_idx").on(table.provider),
  statusIdx: index("ai_models_status_idx").on(table.status),
}));

export const aiModelsPostgres = pgTable("ai_models", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  modelId: varchar("model_id", { length: 255 }).notNull(),
  version: varchar("version", { length: 50 }),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  capabilities: jsonb("capabilities").$type<string[]>(),
  contextWindow: pgInteger("context_window"),
  maxOutputTokens: pgInteger("max_output_tokens"),
  costPer1kInputTokens: doublePrecision("cost_per_1k_input_tokens"),
  costPer1kOutputTokens: doublePrecision("cost_per_1k_output_tokens"),
  supportsStreaming: boolean("supports_streaming").default(true),
  supportsVision: boolean("supports_vision").default(false),
  supportsFunctionCalling: boolean("supports_function_calling").default(false),
  configuration: jsonb("configuration").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  providerIdx: pgIndex("ai_models_provider_idx").on(table.provider),
  statusIdx: pgIndex("ai_models_status_idx").on(table.status),
}));

export const aiModels = isPostgres ? aiModelsPostgres : aiModelsSqlite;
export type AIModel = typeof aiModels.$inferSelect;
export type NewAIModel = typeof aiModels.$inferInsert;

// Tenant-specific model configurations (API keys, limits, etc.)
export const tenantModelConfigsSqlite = sqliteTable("tenant_model_configs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  modelId: text("model_id")
    .notNull()
    .references(() => aiModels.id, { onDelete: "cascade" }),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(false),
  encryptedApiKey: text("encrypted_api_key"), // Tenant's own API key
  customEndpoint: text("custom_endpoint"),
  maxDailyRequests: integer("max_daily_requests"),
  maxMonthlyRequests: integer("max_monthly_requests"),
  overrideConfiguration: text("override_configuration", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  tenantModelIdx: index("tenant_model_configs_tenant_model_idx").on(table.tenantId, table.modelId),
}));

export const tenantModelConfigsPostgres = pgTable("tenant_model_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  modelId: uuid("model_id")
    .notNull()
    .references(() => aiModels.id, { onDelete: "cascade" }),
  isEnabled: boolean("is_enabled").notNull().default(false),
  encryptedApiKey: text("encrypted_api_key"),
  customEndpoint: text("custom_endpoint"),
  maxDailyRequests: pgInteger("max_daily_requests"),
  maxMonthlyRequests: pgInteger("max_monthly_requests"),
  overrideConfiguration: jsonb("override_configuration").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  tenantModelIdx: pgIndex("tenant_model_configs_tenant_model_idx").on(table.tenantId, table.modelId),
}));

export const tenantModelConfigs = isPostgres ? tenantModelConfigsPostgres : tenantModelConfigsSqlite;
export type TenantModelConfig = typeof tenantModelConfigs.$inferSelect;
export type NewTenantModelConfig = typeof tenantModelConfigs.$inferInsert;

// Model usage tracking
export const modelUsageSqlite = sqliteTable("model_usage", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  modelId: text("model_id")
    .notNull()
    .references(() => aiModels.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD format
  requestCount: integer("request_count").notNull().default(0),
  inputTokens: integer("input_tokens").notNull().default(0),
 outputTokens: integer("output_tokens").notNull().default(0),
  totalCost: real("total_cost").default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  tenantDateIdx: index("model_usage_tenant_date_idx").on(table.tenantId, table.date),
  modelDateIdx: index("model_usage_model_date_idx").on(table.modelId, table.date),
}));

export const modelUsagePostgres = pgTable("model_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  modelId: uuid("model_id")
    .notNull()
    .references(() => aiModels.id, { onDelete: "cascade" }),
  date: varchar("date", { length: 10 }).notNull(),
  requestCount: pgInteger("request_count").notNull().default(0),
  inputTokens: pgInteger("input_tokens").notNull().default(0),
  outputTokens: pgInteger("output_tokens").notNull().default(0),
  totalCost: doublePrecision("total_cost").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  tenantDateIdx: pgIndex("model_usage_tenant_date_idx").on(table.tenantId, table.date),
  modelDateIdx: pgIndex("model_usage_model_date_idx").on(table.modelId, table.date),
}));

export const modelUsage = isPostgres ? modelUsagePostgres : modelUsageSqlite;
export type ModelUsage = typeof modelUsage.$inferSelect;
export type NewModelUsage = typeof modelUsage.$inferInsert;

// Relations
export const aiModelsRelations = relations(aiModels, ({ many }) => ({
  tenantConfigs: many(tenantModelConfigs),
  usage: many(modelUsage),
}));

export const tenantModelConfigsRelations = relations(tenantModelConfigs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantModelConfigs.tenantId],
    references: [tenants.id],
  }),
  model: one(aiModels, {
    fields: [tenantModelConfigs.modelId],
    references: [aiModels.id],
  }),
}));

export const modelUsageRelations = relations(modelUsage, ({ one }) => ({
  tenant: one(tenants, {
    fields: [modelUsage.tenantId],
    references: [tenants.id],
  }),
  model: one(aiModels, {
    fields: [modelUsage.modelId],
    references: [aiModels.id],
  }),
}));
