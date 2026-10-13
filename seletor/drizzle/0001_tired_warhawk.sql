CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`notes` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_clients_owner_email` ON `clients` (`owner_id`,`email`);--> statement-breakpoint
CREATE INDEX `idx_clients_owner_name` ON `clients` (`owner_id`,`name`);--> statement-breakpoint
CREATE TABLE `deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`gallery_id` text NOT NULL,
	`status` text DEFAULT 'preparing' NOT NULL,
	`download_limit` integer,
	`download_count` integer DEFAULT 0 NOT NULL,
	`expires_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`gallery_id`) REFERENCES `galleries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_deliveries_owner_status` ON `deliveries` (`owner_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_deliveries_gallery` ON `deliveries` (`gallery_id`);--> statement-breakpoint
CREATE TABLE `gallery_credentials` (
	`id` text PRIMARY KEY NOT NULL,
	`gallery_id` text NOT NULL,
	`login` text NOT NULL,
	`password_hash` text NOT NULL,
	`salt` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`gallery_id`) REFERENCES `galleries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_gallery_credentials_gallery` ON `gallery_credentials` (`gallery_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_gallery_credentials_login` ON `gallery_credentials` (`login`);--> statement-breakpoint
CREATE TABLE `gallery_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`credential_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`credential_id`) REFERENCES `gallery_credentials`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_gallery_sessions_token` ON `gallery_sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_gallery_sessions_credential_expiry` ON `gallery_sessions` (`credential_id`,`expires_at`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`client_id` text,
	`gallery_id` text,
	`description` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`due_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`gallery_id`) REFERENCES `galleries`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_orders_owner_status` ON `orders` (`owner_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_orders_client` ON `orders` (`client_id`);