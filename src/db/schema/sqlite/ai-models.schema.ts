import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants.schema";

// AI Model providers
export const aiProviders = ["openai", "anthropic", "ollama", "cohere", "custom"] as const;
export type AIProvider = (typeof aiProviders)[number];

// Model status
export const modelStatuses = ["active", "inactive", "deprecated"] as const;
export type ModelStatus = (typeof modelStatuses)[number];

// SQLite AI Models schema
export const aiModels = sqliteTable("ai_models", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  provider: text("provider", { enum: aiProviders }).notNull(),
  modelId: text("model_id").notNull(),
  version: text("version"),
  description: text("description"),
  status: text("status", { enum: modelStatuses }).notNull().default("active"),
  capabilities: text("capabilities", { mode: "json" }).$type<string[]>(),
  contextWindow: integer("context_window"),
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

export type AIModel = typeof aiModels.$inferSelect;
export type NewAIModel = typeof aiModels.$inferInsert;

// Tenant-specific model configurations
export const tenantModelConfigs = sqliteTable("tenant_model_configs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  modelId: text("model_id")
    .notNull()
    .references(() => aiModels.id, { onDelete: "cascade" }),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(false),
  encryptedApiKey: text("encrypted_api_key"),
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

export type TenantModelConfig = typeof tenantModelConfigs.$inferSelect;
export type NewTenantModelConfig = typeof tenantModelConfigs.$inferInsert;

// Model usage tracking
export const modelUsage = sqliteTable("model_usage", {
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
