ALTER TABLE `galleries` ADD `client_id` text REFERENCES `clients`(`id`) ON DELETE SET NULL;
CREATE INDEX `idx_galleries_client` ON `galleries` (`client_id`);
