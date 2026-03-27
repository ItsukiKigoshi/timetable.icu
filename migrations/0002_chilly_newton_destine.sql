CREATE TABLE `custom_courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`instructor` text,
	`room` text,
	`day_of_week` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`year` integer NOT NULL,
	`term` text NOT NULL,
	`color_custom` text,
	`memo` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user_courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`course_id` integer NOT NULL,
	`color_custom` text,
	`memo` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_user_courses`("id", "user_id", "course_id", "color_custom", "memo", "created_at") SELECT "id", "user_id", "course_id", "color_custom", "memo", "created_at" FROM `user_courses`;--> statement-breakpoint
DROP TABLE `user_courses`;--> statement-breakpoint
ALTER TABLE `__new_user_courses` RENAME TO `user_courses`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `user_courses_uid_idx` ON `user_courses` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_course_schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`course_id` integer NOT NULL,
	`day_of_week` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`period` integer,
	`is_long` integer DEFAULT false,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_course_schedules`("id", "course_id", "day_of_week", "start_time", "end_time", "period", "is_long") SELECT "id", "course_id", "day_of_week", "start_time", "end_time", "period", "is_long" FROM `course_schedules`;--> statement-breakpoint
DROP TABLE `course_schedules`;--> statement-breakpoint
ALTER TABLE `__new_course_schedules` RENAME TO `course_schedules`;