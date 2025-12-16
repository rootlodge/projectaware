import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { users } from "./users.schema";
import { tenants } from "./tenants.schema";

// Tenant user roles
export const tenantUserRoles = ["owner", "admin", "member", "viewer"] as const;
export type TenantUserRole = (typeof tenantUserRoles)[number];

// SQLite Tenant Users schema
export const tenantUsers = sqliteTable(
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
