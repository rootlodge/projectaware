import { pgTable, timestamp, uuid, varchar, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Tenant status
export const tenantStatuses = ["active", "suspended", "trial", "inactive"] as const;
export type TenantStatus = (typeof tenantStatuses)[number];

// PostgreSQL Tenant schema
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 50 }).notNull().default("trial"),
  configuration: jsonb("configuration").$type<Record<string, unknown>>(),
  maxUsers: integer("max_users").default(10),
  maxApiCalls: integer("max_api_calls").default(10000),
  storageLimit: integer("storage_limit").default(1073741824),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export const insertTenantSchema = createInsertSchema(tenants);
export const selectTenantSchema = createSelectSchema(tenants);
