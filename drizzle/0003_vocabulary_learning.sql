CREATE TABLE `vocabulary_jobs` (
	`session_id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`lease_until` integer NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vocabulary_packs` (
	`session_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`topic_type` text NOT NULL,
	`practice_number` integer NOT NULL,
	`items_json` text NOT NULL,
	`personalization_json` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `student_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_vocab_pack_number` ON `vocabulary_packs` (`user_id`,`practice_number`);--> statement-breakpoint
CREATE INDEX `idx_vocab_packs_user_topic` ON `vocabulary_packs` (`user_id`,`topic_type`,`practice_number`);--> statement-breakpoint
CREATE TABLE `vocabulary_progress` (
	`user_id` text NOT NULL,
	`word_key` text NOT NULL,
	`topic_type` text NOT NULL,
	`item_json` text NOT NULL,
	`exposures` integer DEFAULT 0 NOT NULL,
	`choice_correct` integer DEFAULT 0 NOT NULL,
	`choice_total` integer DEFAULT 0 NOT NULL,
	`spelling_correct` integer DEFAULT 0 NOT NULL,
	`spelling_total` integer DEFAULT 0 NOT NULL,
	`first_seen_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`last_tested_at` integer,
	PRIMARY KEY(`user_id`, `word_key`),
	FOREIGN KEY (`user_id`) REFERENCES `student_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vocabulary_tests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`session_id` text,
	`topic_type` text NOT NULL,
	`batch_number` integer,
	`source_sessions_json` text NOT NULL,
	`questions_json` text NOT NULL,
	`choice_answers_json` text DEFAULT '{}' NOT NULL,
	`spelling_answers_json` text DEFAULT '{}' NOT NULL,
	`choice_score` integer,
	`spelling_score` integer,
	`phase` text DEFAULT 'choice' NOT NULL,
	`choice_completed_at` integer,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `student_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_vocab_review` ON `vocabulary_tests` (`session_id`,`topic_type`,`kind`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_vocab_milestone` ON `vocabulary_tests` (`user_id`,`kind`,`batch_number`);--> statement-breakpoint
CREATE INDEX `idx_vocab_tests_user` ON `vocabulary_tests` (`user_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `sessions` ADD `topic_type` text DEFAULT '' NOT NULL;