import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { pgTable, text as pgText, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users.schema";

const isPostgres = process.env.DATABASE_TYPE === "postgresql";

// Feedback types
export const feedbackTypes = ["bug", "feature", "improvement", "other"] as const;
export type FeedbackType = (typeof feedbackTypes)[number];

// Feedback status
export const feedbackStatuses = ["pending", "reviewed", "resolved", "dismissed"] as const;
export type FeedbackStatus = (typeof feedbackStatuses)[number];

// SQLite schema
export const feedbackSqlite = sqliteTable("feedback", {
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

// PostgreSQL schema
export const feedbackPostgres = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
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

export const feedback = isPostgres ? feedbackPostgres : feedbackSqlite;
export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;

// Relations
export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
}));
