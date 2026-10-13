CREATE TABLE IF NOT EXISTS `photo_comments` (
  `id` text PRIMARY KEY NOT NULL,
  `gallery_id` text NOT NULL REFERENCES `galleries`(`id`) ON DELETE cascade,
  `photo_id` text NOT NULL REFERENCES `photos`(`id`) ON DELETE cascade,
  `client_token` text NOT NULL,
  `comment` text NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `idx_photo_comments_client_photo` ON `photo_comments` (`client_token`, `photo_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_photo_comments_gallery` ON `photo_comments` (`gallery_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `gallery_submissions` (
  `id` text PRIMARY KEY NOT NULL,
  `gallery_id` text NOT NULL REFERENCES `galleries`(`id`) ON DELETE cascade,
  `client_token` text NOT NULL,
  `message` text,
  `completed_at` integer,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `idx_gallery_submissions_client` ON `gallery_submissions` (`gallery_id`, `client_token`);
