import { pgTable, timestamp, uuid, varchar, text, jsonb, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users.schema";
import { tenants } from "./tenants.schema";

// Conversation status
export const conversationStatuses = ["active", "archived", "deleted"] as const;
export type ConversationStatus = (typeof conversationStatuses)[number];

// Message roles
export const messageRoles = ["user", "assistant", "system", "function"] as const;
export type MessageRole = (typeof messageRoles)[number];

// PostgreSQL Conversations schema
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  modelId: varchar("model_id", { length: 255 }),
  systemPrompt: text("system_prompt"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdx: index("conversations_user_idx").on(table.userId),
  tenantIdx: index("conversations_tenant_idx").on(table.tenantId),
  statusIdx: index("conversations_status_idx").on(table.status),
  updatedIdx: index("conversations_updated_idx").on(table.updatedAt),
}));

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

// Messages
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 50 }).notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  tokenCount: integer("token_count"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  conversationIdx: index("messages_conversation_idx").on(table.conversationId),
  createdIdx: index("messages_created_idx").on(table.createdAt),
}));

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

// Conversation threads
export const threads = pgTable("threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  parentMessageId: uuid("parent_message_id").references(() => messages.id),
  title: varchar("title", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  conversationIdx: index("threads_conversation_idx").on(table.conversationId),
}));

export type Thread = typeof threads.$inferSelect;
export type NewThread = typeof threads.$inferInsert;

// Relations
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [conversations.tenantId],
    references: [tenants.id],
  }),
  messages: many(messages),
  threads: many(threads),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const threadsRelations = relations(threads, ({ one }) => ({
  conversation: one(conversations, {
    fields: [threads.conversationId],
    references: [conversations.id],
  }),
  parentMessage: one(messages, {
    fields: [threads.parentMessageId],
    references: [messages.id],
  }),
}));
