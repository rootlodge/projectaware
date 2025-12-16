import { pgTable, timestamp, uuid, varchar, text, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users.schema";
import { tenants } from "./tenants.schema";

// Plugin status
export const pluginStatuses = ["active", "inactive", "disabled", "pending"] as const;
export type PluginStatus = (typeof pluginStatuses)[number];

// PostgreSQL Plugins schema
export const plugins = pgTable("plugins", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  version: varchar("version", { length: 50 }).notNull(),
  description: text("description"),
  author: varchar("author", { length: 255 }),
  authorUrl: text("author_url"),
  iconUrl: text("icon_url"),
  category: varchar("category", { length: 100 }),
  tags: jsonb("tags").$type<string[]>(),
  status: varchar("status", { length: 50 }).notNull().default("inactive"),
  manifestUrl: text("manifest_url"),
  sourceUrl: text("source_url"),
  documentationUrl: text("documentation_url"),
  configuration: jsonb("configuration").$type<Record<string, unknown>>(),
  permissions: jsonb("permissions").$type<string[]>(),
  createdById: uuid("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  slugIdx: index("plugins_slug_idx").on(table.slug),
  statusIdx: index("plugins_status_idx").on(table.status),
}));

export type Plugin = typeof plugins.$inferSelect;
export type NewPlugin = typeof plugins.$inferInsert;

// Plugin configurations per tenant
export const pluginConfigs = pgTable("plugin_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  pluginId: uuid("plugin_id")
    .notNull()
    .references(() => plugins.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  isEnabled: boolean("is_enabled").notNull().default(false),
  config: jsonb("config").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  pluginTenantIdx: index("plugin_configs_plugin_tenant_idx").on(table.pluginId, table.tenantId),
}));

export type PluginConfig = typeof pluginConfigs.$inferSelect;
export type NewPluginConfig = typeof pluginConfigs.$inferInsert;

// Plugin dependencies
export const pluginDependencies = pgTable("plugin_dependencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  pluginId: uuid("plugin_id")
    .notNull()
    .references(() => plugins.id, { onDelete: "cascade" }),
  dependsOnPluginId: uuid("depends_on_plugin_id")
    .notNull()
    .references(() => plugins.id, { onDelete: "cascade" }),
  minVersion: varchar("min_version", { length: 50 }),
  maxVersion: varchar("max_version", { length: 50 }),
  required: boolean("required").notNull().default(true),
}, (table) => ({
  pluginIdx: index("plugin_dependencies_plugin_idx").on(table.pluginId),
}));

export type PluginDependency = typeof pluginDependencies.$inferSelect;
export type NewPluginDependency = typeof pluginDependencies.$inferInsert;

// Relations
export const pluginsRelations = relations(plugins, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [plugins.createdById],
    references: [users.id],
  }),
  configs: many(pluginConfigs),
  dependencies: many(pluginDependencies, { relationName: "plugin" }),
  dependents: many(pluginDependencies, { relationName: "dependsOn" }),
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
