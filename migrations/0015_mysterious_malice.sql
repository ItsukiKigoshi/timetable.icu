ALTER TABLE `user_courses` ADD `is_visible` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `user_courses` ADD `selected_alt_group_id` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `user_course_unique_idx` ON `user_courses` (`user_id`,`course_id`);