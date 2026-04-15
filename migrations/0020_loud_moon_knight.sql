DROP INDEX `year_term_status_code_idx`;--> statement-breakpoint
DROP INDEX `year_term_status_lang_idx`;--> statement-breakpoint
DROP INDEX `year_term_status_units_idx`;--> statement-breakpoint
CREATE INDEX `courses_search_optimal_idx` ON `courses` (`year`,`term`,`status`,`course_code`,`id`);--> statement-breakpoint
CREATE INDEX `year_term_status_lang_idx` ON `courses` (`year`,`term`,`status`,`language`,`id`);--> statement-breakpoint
CREATE INDEX `year_term_status_units_idx` ON `courses` (`year`,`term`,`status`,`units`,`id`);--> statement-breakpoint