import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { pgTable, text as pgText, timestamp, uuid, varchar, jsonb, boolean, index as pgIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users, tenants } from "./users.schema";

const isPostgres = process.env.DATABASE_TYPE === "postgresql";

// Plugin status
export const pluginStatuses = ["active", "inactive", "disabled", "pending"] as const;
export type PluginStatus = (typeof pluginStatuses)[number];

// SQLite schema
export const pluginsSqlite = sqliteTable("plugins", {
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

// PostgreSQL schema
export const pluginsPostgres = pgTable("plugins", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  version: varchar("version", { length: 50 }).notNull(),
  description: text ("description"),
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
  slugIdx: pgIndex("plugins_slug_idx").on(table.slug),
  statusIdx: pgIndex("plugins_status_idx").on(table.status),
}));

export const plugins = isPostgres ? pluginsPostgres : pluginsSqlite;
export type Plugin = typeof plugins.$inferSelect;
export type NewPlugin = typeof plugins.$inferInsert;

// Plugin configurations per tenant
export const pluginConfigsSqlite = sqliteTable("plugin_configs", {
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

export const pluginConfigsPostgres = pgTable("plugin_configs", {
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
  pluginTenantIdx: pgIndex("plugin_configs_plugin_tenant_idx").on(table.pluginId, table.tenantId),
}));

export const pluginConfigs = isPostgres ? pluginConfigsPostgres : pluginConfigsSqlite;
export type PluginConfig = typeof pluginConfigs.$inferSelect;
export type NewPluginConfig = typeof pluginConfigs.$inferInsert;

// Plugin dependencies
export const pluginDependenciesSqlite = sqliteTable("plugin_dependencies", {
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

export const pluginDependenciesPostgres = pgTable("plugin_dependencies", {
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
  pluginIdx: pgIndex("plugin_dependencies_plugin_idx").on(table.pluginId),
}));

export const pluginDependencies = isPostgres ? pluginDependenciesPostgres : pluginDependenciesSqlite;
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
