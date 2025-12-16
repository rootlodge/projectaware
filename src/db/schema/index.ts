// Export schemas based on database type
// Import from sqlite by default, override with postgres if DATABASE_TYPE=postgresql

export * from "./sqlite/users.schema";
export * from "./sqlite/tenants.schema";
export * from "./sqlite/tenant-users.schema";
export * from "./sqlite/sessions.schema";
export * from "./sqlite/user-activity.schema";
export * from "./sqlite/feedback.schema";
export * from "./sqlite/email-config.schema";
export * from "./sqlite/plugins.schema";
export * from "./sqlite/conversations.schema";
export * from "./sqlite/ai-models.schema";
export * from "./sqlite/api-keys.schema";
