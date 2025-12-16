import { pgTable, timestamp, uuid, varchar, text, jsonb, integer, doublePrecision, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants.schema";

// AI Model providers
export const aiProviders = ["openai", "anthropic", "ollama", "cohere", "custom"] as const;
export type AIProvider = (typeof aiProviders)[number];

// Model status
export const modelStatuses = ["active", "inactive", "deprecated"] as const;
export type ModelStatus = (typeof modelStatuses)[number];

// PostgreSQL AI Models schema
export const aiModels = pgTable("ai_models", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  modelId: varchar("model_id", { length: 255 }).notNull(),
  version: varchar("version", { length: 50 }),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  capabilities: jsonb("capabilities").$type<string[]>(),
  contextWindow: integer("context_window"),
  maxOutputTokens: integer("max_output_tokens"),
  costPer1kInputTokens: doublePrecision("cost_per_1k_input_tokens"),
  costPer1kOutputTokens: doublePrecision("cost_per_1k_output_tokens"),
  supportsStreaming: boolean("supports_streaming").default(true),
  supportsVision: boolean("supports_vision").default(false),
  supportsFunctionCalling: boolean("supports_function_calling").default(false),
  configuration: jsonb("configuration").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  providerIdx: index("ai_models_provider_idx").on(table.provider),
  statusIdx: index("ai_models_status_idx").on(table.status),
}));

export type AIModel = typeof aiModels.$inferSelect;
export type NewAIModel = typeof aiModels.$inferInsert;

// Tenant-specific model configurations
export const tenantModelConfigs = pgTable("tenant_model_configs", {
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
  maxDailyRequests: integer("max_daily_requests"),
  maxMonthlyRequests: integer("max_monthly_requests"),
  overrideConfiguration: jsonb("override_configuration").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  tenantModelIdx: index("tenant_model_configs_tenant_model_idx").on(table.tenantId, table.modelId),
}));

export type TenantModelConfig = typeof tenantModelConfigs.$inferSelect;
export type NewTenantModelConfig = typeof tenantModelConfigs.$inferInsert;

// Model usage tracking
export const modelUsage = pgTable("model_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  modelId: uuid("model_id")
    .notNull()
    .references(() => aiModels.id, { onDelete: "cascade" }),
  date: varchar("date", { length: 10 }).notNull(),
  requestCount: integer("request_count").notNull().default(0),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  totalCost: doublePrecision("total_cost").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
