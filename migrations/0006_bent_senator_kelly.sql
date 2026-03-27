DROP INDEX `rg_no_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `year_rgno_unique_idx` ON `courses` (`year`,`rg_no`);