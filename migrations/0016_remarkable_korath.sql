CREATE INDEX `category_search_idx` ON `course_to_categories` (`category_id`,`course_id`);--> statement-breakpoint
CREATE INDEX `year_term_code_idx` ON `courses` (`year`,`term`,`course_code`);