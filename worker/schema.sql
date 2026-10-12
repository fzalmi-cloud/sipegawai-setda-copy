PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS records (
  entity TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  created_date TEXT,
  updated_date TEXT,
  PRIMARY KEY (entity, id)
);

CREATE INDEX IF NOT EXISTS idx_records_entity_created
  ON records(entity, created_date);

CREATE INDEX IF NOT EXISTS idx_records_entity_updated
  ON records(entity, updated_date);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user
  ON sessions(user_id);
