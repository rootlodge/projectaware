import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { users } from "./users.schema";

// Activity types
export const activityTypes = [
  "login",
  "logout",
  "register",
  "password_reset",
  "profile_update",
  "data_export",
  "data_delete_request",
  "feedback_submit",
  "settings_change",
  "api_key_create",
  "api_key_delete",
] as const;
export type ActivityType = (typeof activityTypes)[number];

// SQLite User Activity schema
export const userActivity = sqliteTable("user_activity", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: text("action", { enum: activityTypes }).notNull(),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type UserActivity = typeof userActivity.$inferSelect;
export type NewUserActivity = typeof userActivity.$inferInsert;

// Relations
export const userActivityRelations = relations(userActivity, ({ one }) => ({
  user: one(users, {
    fields: [userActivity.userId],
    references: [users.id],
  }),
}));
