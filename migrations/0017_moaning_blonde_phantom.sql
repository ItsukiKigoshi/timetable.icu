DROP INDEX `year_term_idx`;--> statement-breakpoint
DROP INDEX `year_term_code_idx`;--> statement-breakpoint
DROP INDEX `year_term_status_idx`;--> statement-breakpoint
DROP INDEX `units_idx`;--> statement-breakpoint
CREATE INDEX `year_term_status_code_idx` ON `courses` (`year`,`term`,`status`,`course_code`);--> statement-breakpoint
CREATE INDEX `year_term_status_lang_idx` ON `courses` (`year`,`term`,`status`,`language`);--> statement-breakpoint
CREATE INDEX `year_term_status_units_idx` ON `courses` (`year`,`term`,`status`,`units`);