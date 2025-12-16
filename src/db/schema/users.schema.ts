import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { pgTable, text as pgText, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";

// Determine database type from environment
const isPostgres = process.env.DATABASE_TYPE === "postgresql";

// User roles
export const userRoles = ["admin", "developer", "team_member", "user"] as const;
export type UserRole = (typeof userRoles)[number];

// SQLite schema
export const usersSqlite = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash"),
  role: text("role", { enum: userRoles }).notNull().default("user"),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  verificationToken: text("verification_token"),
  verificationExpires: integer("verification_expires", { mode: "timestamp" }),
  resetToken: text("reset_token"),
  resetExpires: integer("reset_expires", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

// PostgreSQL schema
export const usersPostgres = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  passwordHash: text("password_hash"),
  role: varchar("role", { length: 50 }).notNull().default("user"),
  emailVerified: timestamp("email_verified", { mode: "boolean" }).default(false),
  verificationToken: text("verification_token"),
  verificationExpires: timestamp("verification_expires"),
  resetToken: text("reset_token"),
  resetExpires: timestamp("reset_expires"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// Export the appropriate schema based on environment
export const users = isPostgres ? usersPostgres : usersSqlite;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email.email("Invalid email address"),
  role: (schema) => schema.role.default("user"),
});

export const selectUserSchema = createSelectSchema(users);
export const publicUserSchema = selectUserSchema.omit({
  passwordHash: true,
  verificationToken: true,
  resetToken: true,
});
