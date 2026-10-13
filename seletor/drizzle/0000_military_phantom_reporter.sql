CREATE TABLE `galleries` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`client_name` text NOT NULL,
	`deadline` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`watermark_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_galleries_owner_slug` ON `galleries` (`owner_id`,`slug`);--> statement-breakpoint
CREATE INDEX `idx_galleries_owner_created` ON `galleries` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`gallery_id` text NOT NULL,
	`storage_key` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`gallery_id`) REFERENCES `galleries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `photos_storage_key_unique` ON `photos` (`storage_key`);--> statement-breakpoint
CREATE INDEX `idx_photos_gallery_order` ON `photos` (`gallery_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `selections` (
	`id` text PRIMARY KEY NOT NULL,
	`gallery_id` text NOT NULL,
	`photo_id` text NOT NULL,
	`client_token` text NOT NULL,
	`comment` text,
	`selected_at` integer NOT NULL,
	FOREIGN KEY (`gallery_id`) REFERENCES `galleries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_selections_client_photo` ON `selections` (`client_token`,`photo_id`);--> statement-breakpoint
CREATE INDEX `idx_selections_gallery_client` ON `selections` (`gallery_id`,`client_token`);