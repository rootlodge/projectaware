import { pgTable, timestamp, uuid, varchar, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users.schema";
import { tenants } from "./tenants.schema";

// Tenant user roles
export const tenantUserRoles = ["owner", "admin", "member", "viewer"] as const;
export type TenantUserRole = (typeof tenantUserRoles)[number];

// PostgreSQL Tenant Users schema
export const tenantUsers = pgTable(
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
