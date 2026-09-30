CREATE TABLE `student_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`username_key` text NOT NULL,
	`password_hash` text NOT NULL,
	`research_consent` integer DEFAULT 0 NOT NULL,
	`notice_version` text NOT NULL,
	`notice_accepted_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_accounts_username` ON `student_accounts` (`username_key`);--> statement-breakpoint
CREATE TABLE `auth_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`attempts` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_attempts_expires` ON `auth_attempts` (`expires_at`);--> statement-breakpoint
CREATE TABLE `consent_events` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`research_consent` integer NOT NULL,
	`notice_version` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `student_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_consent_account` ON `consent_events` (`account_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `student_logins` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `student_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_logins_account` ON `student_logins` (`account_id`);--> statement-breakpoint
CREATE INDEX `idx_logins_expires` ON `student_logins` (`expires_at`);