CREATE INDEX `course_id_idx` ON `course_schedules` (`course_id`);--> statement-breakpoint
CREATE INDEX `day_period_idx` ON `course_schedules` (`day_of_week`,`period`);