CREATE TABLE photo_files (storage_key TEXT PRIMARY KEY NOT NULL, content_type TEXT NOT NULL, size INTEGER NOT NULL, data BLOB NOT NULL);
CREATE TABLE photo_storage_usage (id INTEGER PRIMARY KEY CHECK (id = 1), bytes INTEGER NOT NULL DEFAULT 0 CHECK (bytes >= 0 AND bytes <= 367001600));
INSERT INTO photo_storage_usage (id,bytes) VALUES (1,0);
CREATE TRIGGER photo_files_quota BEFORE INSERT ON photo_files BEGIN
 UPDATE photo_storage_usage SET bytes = bytes + NEW.size WHERE id = 1;
END;
CREATE TRIGGER photo_files_release AFTER DELETE ON photo_files BEGIN
 UPDATE photo_storage_usage SET bytes = bytes - OLD.size WHERE id = 1;
END;
