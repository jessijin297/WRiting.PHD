CREATE TABLE `review_jobs` (
	`session_id` text NOT NULL,
	`kind` text NOT NULL,
	`token` text NOT NULL,
	`lease_until` integer NOT NULL,
	PRIMARY KEY(`session_id`, `kind`),
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `revision_learning` (
	`session_id` text NOT NULL,
	`kind` text NOT NULL,
	`review_hash` text NOT NULL,
	`change_id` text NOT NULL,
	`choice` text NOT NULL,
	`answer` text NOT NULL,
	`explanation` text NOT NULL,
	`feedback` text NOT NULL,
	`understood` integer DEFAULT 0 NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`session_id`, `kind`, `review_hash`, `change_id`),
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `session_images` (
	`session_id` text PRIMARY KEY NOT NULL,
	`mime_type` text NOT NULL,
	`image_data` text NOT NULL,
	`byte_size` integer NOT NULL,
	`content_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `writing_reviews` (
	`session_id` text NOT NULL,
	`kind` text NOT NULL,
	`review_hash` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`session_id`, `kind`),
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `messages` ADD `translations_json` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `writing_mode` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `ui_language` text DEFAULT 'zh' NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `workflow_version` integer DEFAULT 2 NOT NULL;