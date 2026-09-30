CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`type` text NOT NULL,
	`stage` text NOT NULL,
	`client_at` integer NOT NULL,
	`received_at` integer NOT NULL,
	`detail` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_events_session` ON `events` (`session_id`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`stage` text NOT NULL,
	`slot` integer,
	`created_at` integer NOT NULL,
	`mode` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_messages_session_created` ON `messages` (`session_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `reports` (
	`session_id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`exam` text NOT NULL,
	`prompt` text NOT NULL,
	`duration` integer NOT NULL,
	`target` integer NOT NULL,
	`stage` text NOT NULL,
	`draft` text DEFAULT '' NOT NULL,
	`original` text DEFAULT '' NOT NULL,
	`notes` text NOT NULL,
	`reflection` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	`submitted_at` integer,
	`completed_at` integer,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_user_created` ON `sessions` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `ai_slots` (
	`session_id` text NOT NULL,
	`slot` text NOT NULL,
	`request_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`session_id`, `slot`),
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`stage` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_snapshots_session` ON `snapshots` (`session_id`);