import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { users } from "./users.schema";
import { tenants } from "./tenants.schema";

// Plugin status
export const pluginStatuses = ["active", "inactive", "disabled", "pending"] as const;
export type PluginStatus = (typeof pluginStatuses)[number];

// SQLite Plugins schema
export const plugins = sqliteTable("plugins", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  version: text("version").notNull(),
  description: text("description"),
  author: text("author"),
  authorUrl: text("author_url"),
  iconUrl: text("icon_url"),
  category: text("category"),
  tags: text("tags", { mode: "json" }).$type<string[]>(),
  status: text("status", { enum: pluginStatuses }).notNull().default("inactive"),
  manifestUrl: text("manifest_url"),
  sourceUrl: text("source_url"),
  documentationUrl: text("documentation_url"),
  configuration: text("configuration", { mode: "json" }).$type<Record<string, unknown>>(),
  permissions: text("permissions", { mode: "json" }).$type<string[]>(),
  createdById: text("created_by_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  slugIdx: index("plugins_slug_idx").on(table.slug),
  statusIdx: index("plugins_status_idx").on(table.status),
}));

export type Plugin = typeof plugins.$inferSelect;
export type NewPlugin = typeof plugins.$inferInsert;

// Plugin configurations per tenant
export const pluginConfigs = sqliteTable("plugin_configs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  pluginId: text("plugin_id")
    .notNull()
    .references(() => plugins.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(false),
  config: text("config", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  pluginTenantIdx: index("plugin_configs_plugin_tenant_idx").on(table.pluginId, table.tenantId),
}));

export type PluginConfig = typeof pluginConfigs.$inferSelect;
export type NewPluginConfig = typeof pluginConfigs.$inferInsert;

// Plugin dependencies
export const pluginDependencies = sqliteTable("plugin_dependencies", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  pluginId: text("plugin_id")
    .notNull()
    .references(() => plugins.id, { onDelete: "cascade" }),
  dependsOnPluginId: text("depends_on_plugin_id")
    .notNull()
    .references(() => plugins.id, { onDelete: "cascade" }),
  minVersion: text("min_version"),
  maxVersion: text("max_version"),
  required: integer("required", { mode: "boolean" }).notNull().default(true),
}, (table) => ({
  pluginIdx: index("plugin_dependencies_plugin_idx").on(table.pluginId),
}));

export type PluginDependency = typeof pluginDependencies.$inferSelect;
export type NewPluginDependency = typeof pluginDependencies.$inferInsert;

// Plugin Storage (Key-Value Store)
export const pluginStorage = sqliteTable("plugin_storage", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  pluginId: text("plugin_id")
    .notNull()
    .references(() => plugins.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  value: text("value", { mode: "json" }).$type<any>(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  lookupIdx: index("plugin_storage_lookup_idx").on(table.pluginId, table.tenantId, table.key),
}));

export type PluginStorage = typeof pluginStorage.$inferSelect;
export type NewPluginStorage = typeof pluginStorage.$inferInsert;

// Plugin Reviews
export const pluginReviews = sqliteTable("plugin_reviews", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  pluginId: text("plugin_id")
    .notNull()
    .references(() => plugins.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5
  review: text("review"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  pluginIdx: index("plugin_reviews_plugin_idx").on(table.pluginId),
}));

export type PluginReview = typeof pluginReviews.$inferSelect;
export type NewPluginReview = typeof pluginReviews.$inferInsert;

// Relations
export const pluginsRelations = relations(plugins, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [plugins.createdById],
    references: [users.id],
  }),
  configs: many(pluginConfigs),
  dependencies: many(pluginDependencies, { relationName: "plugin" }),
  dependents: many(pluginDependencies, { relationName: "dependsOn" }),
  reviews: many(pluginReviews),
}));

export const pluginConfigsRelations = relations(pluginConfigs, ({ one }) => ({
  plugin: one(plugins, {
    fields: [pluginConfigs.pluginId],
    references: [plugins.id],
  }),
  tenant: one(tenants, {
    fields: [pluginConfigs.tenantId],
    references: [tenants.id],
  }),
}));

export const pluginDependenciesRelations = relations(pluginDependencies, ({ one }) => ({
  plugin: one(plugins, {
    fields: [pluginDependencies.pluginId],
    references: [plugins.id],
    relationName: "plugin",
  }),
  dependsOn: one(plugins, {
    fields: [pluginDependencies.dependsOnPluginId],
    references: [plugins.id],
    relationName: "dependsOn",
  }),
}));

export const pluginReviewsRelations = relations(pluginReviews, ({ one }) => ({
  plugin: one(plugins, {
    fields: [pluginReviews.pluginId],
    references: [plugins.id],
  }),
  user: one(users, {
    fields: [pluginReviews.userId],
    references: [users.id],
  }),
}));
