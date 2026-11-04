CREATE TABLE `answers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` integer NOT NULL,
	`draft` text,
	`final_text` text,
	`sources` text DEFAULT '[]' NOT NULL,
	`approved` integer DEFAULT 0 NOT NULL,
	`published_at` text,
	`delivery_status` text DEFAULT 'not_requested' NOT NULL,
	`delivered_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `answers_question_id_unique` ON `answers` (`question_id`);--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event` text NOT NULL,
	`entity_id` integer,
	`detail` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_name` text NOT NULL,
	`student_email` text,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`category` text DEFAULT 'General' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`channel` text DEFAULT 'web' NOT NULL,
	`anonymous` integer DEFAULT 0 NOT NULL,
	`external_contact` text,
	`external_message_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_questions_external_message_id` ON `questions` (`external_message_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`expires_at` integer NOT NULL
);
