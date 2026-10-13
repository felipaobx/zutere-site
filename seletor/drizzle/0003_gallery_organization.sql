ALTER TABLE `galleries` ADD `category` text DEFAULT 'Ensaio' NOT NULL;
ALTER TABLE `galleries` ADD `event_date` text;
ALTER TABLE `clients` ADD `country` text DEFAULT 'Brasil (+55)' NOT NULL;
ALTER TABLE `clients` ADD `language` text DEFAULT 'Português (BR)' NOT NULL;
