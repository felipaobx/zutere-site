CREATE TABLE photographers (id TEXT PRIMARY KEY NOT NULL, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password_hash TEXT NOT NULL, salt TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE photographer_sessions (id TEXT PRIMARY KEY NOT NULL, photographer_id TEXT NOT NULL REFERENCES photographers(id) ON DELETE CASCADE, token_hash TEXT NOT NULL UNIQUE, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX idx_photographer_sessions_expiry ON photographer_sessions(expires_at);
CREATE TABLE login_attempts (key TEXT PRIMARY KEY NOT NULL, attempts INTEGER NOT NULL DEFAULT 1, resets_at INTEGER NOT NULL);
