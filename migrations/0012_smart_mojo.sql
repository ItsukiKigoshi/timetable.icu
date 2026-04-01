PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year` integer NOT NULL,
	`rg_no` text NOT NULL,
	`status` text DEFAULT 'active',
	`term` text NOT NULL,
	`course_code` text NOT NULL,
	`title_ja` text NOT NULL,
	`title_en` text NOT NULL,
	`instructor` text NOT NULL,
	`room` text,
	`language` text,
	`units` real DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()
                                                     )
);
--> statement-breakpoint
INSERT INTO `__new_courses`("id", "year", "rg_no", "status", "term", "course_code", "title_ja", "title_en", "instructor", "room", "language", "units", "updated_at") SELECT "id", "year", "rg_no", "status", "term", "course_code", "title_ja", "title_en", "instructor", "room", "language", "units", "updated_at" FROM `courses`;--> statement-breakpoint
DROP TABLE `courses`;--> statement-breakpoint
ALTER TABLE `__new_courses` RENAME TO `courses`;--> statement-breakpoint
CREATE UNIQUE INDEX `year_rgno_unique_idx` ON `courses` (`year`,`rg_no`);--> statement-breakpoint
CREATE INDEX `year_term_idx` ON `courses` (`year`,`term`);--> statement-breakpoint
CREATE INDEX `year_term_status_idx` ON `courses` (`year`,`term`,`status`);--> statement-breakpoint
CREATE TABLE `__new_custom_courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`instructor` text,
	`room` text,
	`units` real DEFAULT 0 NOT NULL,
	`day_of_week` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`year` integer NOT NULL,
	`term` text NOT NULL,
	`color_custom` text,
	`memo` text,
	`overridden_course_id` integer,
	`created_at` integer DEFAULT (unixepoch()
                                                 ),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`overridden_course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_custom_courses`("id", "user_id", "title", "instructor", "room", "units", "day_of_week", "start_time", "end_time", "year", "term", "color_custom", "memo", "overridden_course_id", "created_at") SELECT "id", "user_id", "title", "instructor", "room", "units", "day_of_week", "start_time", "end_time", "year", "term", "color_custom", "memo", "overridden_course_id", "created_at" FROM `custom_courses`;--> statement-breakpoint
DROP TABLE `custom_courses`;--> statement-breakpoint
ALTER TABLE `__new_custom_courses` RENAME TO `custom_courses`;--> statement-breakpoint
CREATE TABLE `__new_user_courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`course_id` integer NOT NULL,
	`color_custom` text,
	`memo` text,
	`created_at` integer DEFAULT (unixepoch()
                                                     ),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_user_courses`("id", "user_id", "course_id", "color_custom", "memo", "created_at") SELECT "id", "user_id", "course_id", "color_custom", "memo", "created_at" FROM `user_courses`;--> statement-breakpoint
DROP TABLE `user_courses`;--> statement-breakpoint
ALTER TABLE `__new_user_courses` RENAME TO `user_courses`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `user_courses_uid_idx` ON `user_courses` (`user_id`);
