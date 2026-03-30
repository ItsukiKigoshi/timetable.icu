CREATE INDEX `search_schedule_idx` ON `course_schedules` (`day_of_week`,`period`,`course_id`);--> statement-breakpoint
CREATE INDEX `category_id_idx` ON `course_to_categories` (`category_id`);--> statement-breakpoint
CREATE INDEX `year_term_status_idx` ON `courses` (`year`,`term`,`status`);