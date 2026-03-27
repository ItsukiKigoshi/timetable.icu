ALTER TABLE `course_schedules` ADD `is_alternative` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `course_schedules` ADD `alt_group_id` integer;--> statement-breakpoint
ALTER TABLE `custom_courses` ADD `overridden_course_id` integer REFERENCES courses(id);