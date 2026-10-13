ALTER TABLE `photos` ADD `is_cover` integer NOT NULL DEFAULT 0;
UPDATE `photos` SET `is_cover` = 1
WHERE `id` IN (SELECT `id` FROM `photos` p2 WHERE p2.`gallery_id` = `photos`.`gallery_id` ORDER BY p2.`sort_order` ASC LIMIT 1);

CREATE TABLE `account_settings` (
  `owner_id` text PRIMARY KEY NOT NULL,
  `display_name` text NOT NULL DEFAULT 'Felipe Costa',
  `studio_name` text NOT NULL DEFAULT 'Estúdio Lume',
  `login_email` text,
  `primary_color` text NOT NULL DEFAULT '#6f4cc3',
  `accent_color` text NOT NULL DEFAULT '#a95072',
  `appearance` text NOT NULL DEFAULT 'light',
  `plan` text NOT NULL DEFAULT 'studio',
  `updated_at` integer NOT NULL
);
