CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT '"2025-12-17T19:56:00.668Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-12-17T19:56:00.668Z"' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ai_models` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`display_name` text NOT NULL,
	`provider` text NOT NULL,
	`model_id` text NOT NULL,
	`version` text,
	`description` text,
	`status` text DEFAULT 'active' NOT NULL,
	`capabilities` text,
	`context_window` integer,
	`max_output_tokens` integer,
	`cost_per_1k_input_tokens` real,
	`cost_per_1k_output_tokens` real,
	`supports_streaming` integer DEFAULT true,
	`supports_vision` integer DEFAULT false,
	`supports_function_calling` integer DEFAULT false,
	`configuration` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ai_models_provider_idx` ON `ai_models` (`provider`);--> statement-breakpoint
CREATE INDEX `ai_models_status_idx` ON `ai_models` (`status`);--> statement-breakpoint
CREATE TABLE `model_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text,
	`model_id` text NOT NULL,
	`date` text NOT NULL,
	`request_count` integer DEFAULT 0 NOT NULL,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`total_cost` real DEFAULT 0,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`model_id`) REFERENCES `ai_models`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `model_usage_tenant_date_idx` ON `model_usage` (`tenant_id`,`date`);--> statement-breakpoint
CREATE INDEX `model_usage_model_date_idx` ON `model_usage` (`model_id`,`date`);--> statement-breakpoint
CREATE TABLE `tenant_model_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`model_id` text NOT NULL,
	`is_enabled` integer DEFAULT false NOT NULL,
	`encrypted_api_key` text,
	`custom_endpoint` text,
	`max_daily_requests` integer,
	`max_monthly_requests` integer,
	`override_configuration` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`model_id`) REFERENCES `ai_models`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tenant_model_configs_tenant_model_idx` ON `tenant_model_configs` (`tenant_id`,`model_id`);--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`user_id` text NOT NULL,
	`tenant_id` text,
	`scope` text DEFAULT 'read' NOT NULL,
	`last_used_at` integer,
	`expires_at` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_key_unique` ON `api_keys` (`key`);--> statement-breakpoint
CREATE INDEX `api_keys_key_idx` ON `api_keys` (`key`);--> statement-breakpoint
CREATE INDEX `api_keys_user_idx` ON `api_keys` (`user_id`);--> statement-breakpoint
CREATE INDEX `api_keys_tenant_idx` ON `api_keys` (`tenant_id`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`endpoint` text NOT NULL,
	`window_start` integer NOT NULL,
	`request_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rate_limits_identifier_window_idx` ON `rate_limits` (`identifier`,`window_start`);--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`tenant_id` text,
	`title` text,
	`status` text DEFAULT 'active' NOT NULL,
	`metadata` text,
	`model_id` text,
	`system_prompt` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `conversations_user_idx` ON `conversations` (`user_id`);--> statement-breakpoint
CREATE INDEX `conversations_tenant_idx` ON `conversations` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `conversations_status_idx` ON `conversations` (`status`);--> statement-breakpoint
CREATE INDEX `conversations_updated_idx` ON `conversations` (`updated_at`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`metadata` text,
	`token_count` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `messages_conversation_idx` ON `messages` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `messages_created_idx` ON `messages` (`created_at`);--> statement-breakpoint
CREATE TABLE `threads` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`parent_message_id` text,
	`title` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `threads_conversation_idx` ON `threads` (`conversation_id`);--> statement-breakpoint
CREATE TABLE `email_config` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text,
	`provider` text NOT NULL,
	`from_email` text NOT NULL,
	`from_name` text,
	`encrypted_credentials` text NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`rating` integer,
	`message` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`resolution_notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `plugin_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`plugin_id` text NOT NULL,
	`tenant_id` text,
	`is_enabled` integer DEFAULT false NOT NULL,
	`config` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`plugin_id`) REFERENCES `plugins`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `plugin_configs_plugin_tenant_idx` ON `plugin_configs` (`plugin_id`,`tenant_id`);--> statement-breakpoint
CREATE TABLE `plugin_dependencies` (
	`id` text PRIMARY KEY NOT NULL,
	`plugin_id` text NOT NULL,
	`depends_on_plugin_id` text NOT NULL,
	`min_version` text,
	`max_version` text,
	`required` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`plugin_id`) REFERENCES `plugins`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`depends_on_plugin_id`) REFERENCES `plugins`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `plugin_dependencies_plugin_idx` ON `plugin_dependencies` (`plugin_id`);--> statement-breakpoint
CREATE TABLE `plugins` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`version` text NOT NULL,
	`description` text,
	`author` text,
	`author_url` text,
	`icon_url` text,
	`category` text,
	`tags` text,
	`status` text DEFAULT 'inactive' NOT NULL,
	`manifest_url` text,
	`source_url` text,
	`documentation_url` text,
	`configuration` text,
	`permissions` text,
	`created_by_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plugins_slug_unique` ON `plugins` (`slug`);--> statement-breakpoint
CREATE INDEX `plugins_slug_idx` ON `plugins` (`slug`);--> statement-breakpoint
CREATE INDEX `plugins_status_idx` ON `plugins` (`status`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer DEFAULT '"2025-12-17T19:56:00.776Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-12-17T19:56:00.776Z"' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE `tenant_users` (
	`tenant_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`joined_at` integer NOT NULL,
	PRIMARY KEY(`tenant_id`, `user_id`),
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`status` text DEFAULT 'trial' NOT NULL,
	`configuration` text,
	`max_users` integer DEFAULT 10,
	`max_api_calls` integer DEFAULT 10000,
	`storage_limit` integer DEFAULT 1073741824,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_slug_unique` ON `tenants` (`slug`);--> statement-breakpoint
CREATE TABLE `user_activity` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`metadata` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`password_hash` text,
	`role` text DEFAULT 'user' NOT NULL,
	`image` text,
	`email_verified` integer DEFAULT false NOT NULL,
	`verification_token` text,
	`verification_expires` integer,
	`reset_token` text,
	`reset_expires` integer,
	`created_at` integer DEFAULT '"2025-12-17T19:56:00.661Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-12-17T19:56:00.661Z"' NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT '"2025-12-17T19:56:00.803Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-12-17T19:56:00.803Z"' NOT NULL
);
