CREATE TABLE `gallery_clients` (
  `id` text PRIMARY KEY NOT NULL,
  `gallery_id` text NOT NULL REFERENCES `galleries`(`id`) ON DELETE CASCADE,
  `client_id` text NOT NULL REFERENCES `clients`(`id`) ON DELETE CASCADE,
  `created_at` integer NOT NULL
);
CREATE UNIQUE INDEX `idx_gallery_clients_pair` ON `gallery_clients` (`gallery_id`,`client_id`);
CREATE INDEX `idx_gallery_clients_client` ON `gallery_clients` (`client_id`);

INSERT OR IGNORE INTO `gallery_clients` (`id`, `gallery_id`, `client_id`, `created_at`)
SELECT lower(hex(randomblob(16))), `id`, `client_id`, CAST(strftime('%s','now') AS integer) * 1000
FROM `galleries` WHERE `client_id` IS NOT NULL;

CREATE TABLE `client_credentials` (
  `id` text PRIMARY KEY NOT NULL,
  `client_id` text NOT NULL REFERENCES `clients`(`id`) ON DELETE CASCADE,
  `login` text NOT NULL,
  `password_hash` text NOT NULL,
  `salt` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
CREATE UNIQUE INDEX `idx_client_credentials_client` ON `client_credentials` (`client_id`);
CREATE UNIQUE INDEX `idx_client_credentials_login` ON `client_credentials` (`login`);

CREATE TABLE `client_sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `credential_id` text NOT NULL REFERENCES `client_credentials`(`id`) ON DELETE CASCADE,
  `token_hash` text NOT NULL,
  `expires_at` integer NOT NULL,
  `created_at` integer NOT NULL
);
CREATE UNIQUE INDEX `idx_client_sessions_token` ON `client_sessions` (`token_hash`);
CREATE INDEX `idx_client_sessions_credential_expiry` ON `client_sessions` (`credential_id`,`expires_at`);
