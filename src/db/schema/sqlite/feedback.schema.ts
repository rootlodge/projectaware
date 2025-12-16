import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { users } from "./users.schema";

// Feedback types
export const feedbackTypes = ["bug", "feature", "improvement", "other"] as const;
export type FeedbackType = (typeof feedbackTypes)[number];

// Feedback status
export const feedbackStatuses = ["pending", "reviewed", "resolved", "dismissed"] as const;
export type FeedbackStatus = (typeof feedbackStatuses)[number];

// SQLite Feedback schema
export const feedback = sqliteTable("feedback", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: feedbackTypes }).notNull(),
  rating: integer("rating"), // 1-5 stars
  message: text("message").notNull(),
  status: text("status", { enum: feedbackStatuses }).notNull().default("pending"),
  resolutionNotes: text("resolution_notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;

// Relations
export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
}));
