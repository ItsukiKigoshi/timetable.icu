PRAGMA foreign_keys=OFF;

CREATE TABLE `custom_course_schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`custom_course_id` integer NOT NULL,
	`day_of_week` text NOT NULL,
	`period` text,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	FOREIGN KEY (`custom_course_id`) REFERENCES `custom_courses`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `__new_custom_courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`instructor` text,
	`room` text,
	`units` real DEFAULT 0 NOT NULL,
	`year` integer NOT NULL,
	`term` text NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`color_custom` text,
	`memo` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

INSERT INTO `__new_custom_courses`("id", "user_id", "title", "instructor", "room", "units", "year", "term", "is_visible", "color_custom", "memo", "created_at") SELECT "id", "user_id", "title", "instructor", "room", "units", "year", "term", "is_visible", "color_custom", "memo", "created_at" FROM `custom_courses`;
DROP TABLE `custom_courses`;
ALTER TABLE `__new_custom_courses` RENAME TO `custom_courses`;
CREATE TABLE `__new_account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

INSERT INTO `__new_account`("id", "account_id", "provider_id", "user_id", "access_token", "refresh_token", "id_token", "access_token_expires_at", "refresh_token_expires_at", "scope", "password", "created_at", "updated_at") SELECT "id", "account_id", "provider_id", "user_id", "access_token", "refresh_token", "id_token", "access_token_expires_at", "refresh_token_expires_at", "scope", "password", "created_at", "updated_at" FROM `account`;
DROP TABLE `account`;
ALTER TABLE `__new_account` RENAME TO `account`;
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);
CREATE TABLE `__new_session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

INSERT INTO `__new_session`("id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id") SELECT "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id" FROM `session`;
DROP TABLE `session`;
ALTER TABLE `__new_session` RENAME TO `session`;
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);
CREATE TABLE `__new_user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);

INSERT INTO `__new_user`("id", "name", "email", "email_verified", "image", "created_at", "updated_at") SELECT "id", "name", "email", "email_verified", "image", "created_at", "updated_at" FROM `user`;
DROP TABLE `user`;
ALTER TABLE `__new_user` RENAME TO `user`;
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);
CREATE TABLE `__new_verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);

INSERT INTO `__new_verification`("id", "identifier", "value", "expires_at", "created_at", "updated_at") SELECT "id", "identifier", "value", "expires_at", "created_at", "updated_at" FROM `verification`;
DROP TABLE `verification`;
ALTER TABLE `__new_verification` RENAME TO `verification`;
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);

PRAGMA foreign_keys=ON;