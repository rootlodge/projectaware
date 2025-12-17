import { pgTable, text, timestamp, uuid, varchar, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users.schema";

// Feedback types
export const feedbackTypes = ["bug", "feature", "improvement", "other"] as const;
export type FeedbackType = (typeof feedbackTypes)[number];

// Feedback status
export const feedbackStatuses = ["pending", "reviewed", "resolved", "dismissed"] as const;
export type FeedbackStatus = (typeof feedbackStatuses)[number];

// PostgreSQL Feedback schema
export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  rating: integer("rating"),
  message: text("message").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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
