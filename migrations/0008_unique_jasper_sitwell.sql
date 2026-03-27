PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name_ja` text NOT NULL,
	`name_en` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_categories`("id", "name_ja", "name_en") SELECT "id", "name_ja", "name_en" FROM `categories`;--> statement-breakpoint
DROP TABLE `categories`;--> statement-breakpoint
ALTER TABLE `__new_categories` RENAME TO `categories`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_course_to_categories` (
	`course_id` integer NOT NULL,
	`category_id` text NOT NULL,
	PRIMARY KEY(`course_id`, `category_id`),
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_course_to_categories`("course_id", "category_id") SELECT "course_id", "category_id" FROM `course_to_categories`;--> statement-breakpoint
DROP TABLE `course_to_categories`;--> statement-breakpoint
ALTER TABLE `__new_course_to_categories` RENAME TO `course_to_categories`;