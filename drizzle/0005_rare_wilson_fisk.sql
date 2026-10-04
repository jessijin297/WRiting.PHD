CREATE TABLE `feedback_jobs` (
	`session_id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`lease_until` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `learning_reflections` (
	`session_id` text NOT NULL,
	`phase` text NOT NULL,
	`version` text NOT NULL,
	`answers_json` text,
	`skipped` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`session_id`, `phase`),
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `practice_feedback` (
	`session_id` text PRIMARY KEY NOT NULL,
	`evidence_hash` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `writing_milestones` (
	`session_id` text NOT NULL,
	`slot` text NOT NULL,
	`stage` text NOT NULL,
	`content` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`session_id`, `slot`),
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
DROP INDEX `idx_vocab_milestone`;--> statement-breakpoint
ALTER TABLE `vocabulary_tests` ADD `track_key` text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_vocab_milestone` ON `vocabulary_tests` (`user_id`,`kind`,`track_key`,`batch_number`);--> statement-breakpoint
ALTER TABLE `vocabulary_packs` ADD `track_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `vocabulary_packs` ADD `track_number` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE vocabulary_packs SET track_key=COALESCE((SELECT CASE WHEN writing_mode IN ('ielts_task1','ielts_task2','gre_issue','toefl_discussion') THEN writing_mode WHEN exam='GRE' THEN 'gre_issue' WHEN exam='TOEFL' THEN 'toefl_discussion' ELSE 'ielts_task2' END FROM sessions WHERE sessions.id=vocabulary_packs.session_id),'ielts_task2');
--> statement-breakpoint
UPDATE vocabulary_packs SET track_number=(SELECT COUNT(*) FROM vocabulary_packs p WHERE p.user_id=vocabulary_packs.user_id AND p.track_key=vocabulary_packs.track_key AND p.practice_number<=vocabulary_packs.practice_number);
--> statement-breakpoint
UPDATE vocabulary_tests SET track_key=COALESCE((SELECT p.track_key FROM vocabulary_packs p WHERE p.session_id=vocabulary_tests.session_id),(SELECT CASE WHEN writing_mode IN ('ielts_task1','ielts_task2','gre_issue','toefl_discussion') THEN writing_mode WHEN exam='GRE' THEN 'gre_issue' WHEN exam='TOEFL' THEN 'toefl_discussion' ELSE 'ielts_task2' END FROM sessions WHERE sessions.id=vocabulary_tests.session_id),'legacy') WHERE kind='review';
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_vocab_track_number` ON `vocabulary_packs` (`user_id`,`track_key`,`track_number`);
--> statement-breakpoint
DROP INDEX idx_vocab_review;
--> statement-breakpoint
CREATE UNIQUE INDEX idx_vocab_review ON vocabulary_tests (session_id,topic_type,track_key,kind);
