CREATE TABLE drive_configs (owner_id TEXT PRIMARY KEY REFERENCES photographers(id) ON DELETE CASCADE, client_id TEXT NOT NULL, secret_cipher TEXT NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE drive_connections (owner_id TEXT PRIMARY KEY REFERENCES photographers(id) ON DELETE CASCADE, google_subject TEXT NOT NULL, email TEXT NOT NULL, folder_id TEXT NOT NULL, tokens_cipher TEXT NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE drive_oauth_states (state_hash TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES photographers(id) ON DELETE CASCADE, browser_hash TEXT NOT NULL, verifier_cipher TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE drive_files (storage_key TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES photographers(id), remote_file_id TEXT NOT NULL UNIQUE, content_type TEXT NOT NULL, size INTEGER NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX idx_drive_files_owner ON drive_files(owner_id);
CREATE TABLE drive_gallery_folders (gallery_id TEXT PRIMARY KEY REFERENCES galleries(id) ON DELETE CASCADE, owner_id TEXT NOT NULL REFERENCES photographers(id), remote_folder_id TEXT NOT NULL);
