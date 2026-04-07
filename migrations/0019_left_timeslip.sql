CREATE TABLE `custom_course_schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`custom_course_id` integer NOT NULL,
	`day_of_week` text NOT NULL,
	`period` text,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	FOREIGN KEY (`custom_course_id`) REFERENCES `custom_courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_custom_courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`instructor` text,
	`room` text,
	`units` real DEFAULT 0 NOT NULL,
	`year` integer NOT NULL,
	`term` text NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`color_custom` text,
	`memo` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_custom_courses`("id", "user_id", "title", "instructor", "room", "units", "year", "term", "is_visible", "color_custom", "memo", "created_at") SELECT "id", "user_id", "title", "instructor", "room", "units", "year", "term", "is_visible", "color_custom", "memo", "created_at" FROM `custom_courses`;--> statement-breakpoint
DROP TABLE `custom_courses`;--> statement-breakpoint
ALTER TABLE `__new_custom_courses` RENAME TO `custom_courses`;--> statement-breakpoint
PRAGMA foreign_keys=ON;