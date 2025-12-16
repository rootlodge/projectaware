import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { pgTable, timestamp, uuid, varchar, primaryKey as pgPrimaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users.schema";
import { tenants } from "./tenants.schema";

const isPostgres = process.env.DATABASE_TYPE === "postgresql";

// Tenant user roles (within a specific tenant)
export const tenantUserRoles = ["owner", "admin", "member", "viewer"] as const;
export type TenantUserRole = (typeof tenantUserRoles)[number];

// Junction table for many-to-many relationship
// SQLite schema
export const tenantUsersSqlite = sqliteTable(
  "tenant_users",
  {
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: tenantUserRoles }).notNull().default("member"),
    joinedAt: integer("joined_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.tenantId, table.userId] }),
  })
);

// PostgreSQL schema
export const tenantUsersPostgres = pgTable(
  "tenant_users",
  {
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull().default("member"),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (table) => ({
    pk: pgPrimaryKey({ columns: [table.tenantId, table.userId] }),
  })
);

export const tenantUsers = isPostgres ? tenantUsersPostgres : tenantUsersSqlite;
export type TenantUser = typeof tenantUsers.$inferSelect;
export type NewTenantUser = typeof tenantUsers.$inferInsert;

// Relations
export const tenantUsersRelations = relations(tenantUsers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantUsers.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [tenantUsers.userId],
    references: [users.id],
  }),
}));
