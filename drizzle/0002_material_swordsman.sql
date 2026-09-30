CREATE TABLE `teacher_logins` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`credential_epoch` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_teacher_logins_expires` ON `teacher_logins` (`expires_at`);