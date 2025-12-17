import { pgTable, timestamp, uuid, varchar, text, jsonb } from "drizzle-orm/pg-core";
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

// PostgreSQL User Activity schema
export const userActivity = pgTable("user_activity", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 50 }).notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
