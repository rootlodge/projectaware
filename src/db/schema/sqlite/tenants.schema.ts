import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Tenant status
export const tenantStatuses = ["active", "suspended", "trial", "inactive"] as const;
export type TenantStatus = (typeof tenantStatuses)[number];

// SQLite Tenant schema
export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status", { enum: tenantStatuses }).notNull().default("trial"),
  configuration: text("configuration", { mode: "json" }).$type<Record<string, unknown>>(),
  maxUsers: integer("max_users").default(10),
  maxApiCalls: integer("max_api_calls").default(10000),
  storageLimit: integer("storage_limit").default(1073741824), // 1GB in bytes
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export const insertTenantSchema = createInsertSchema(tenants);
export const selectTenantSchema = createSelectSchema(tenants);
