CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aero_pulse_id VARCHAR(12) NOT NULL UNIQUE,
  username VARCHAR(24) NOT NULL,
  username_normalized VARCHAR(24) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS provider_credentials (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id VARCHAR(32) NOT NULL,
  encrypted_credentials TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, provider_id),
  CHECK (provider_id IN ('airLabs', 'aviationstack', 'aeroDataBox', 'lufthansa'))
);

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  key_hash TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS schema_metadata (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  version INTEGER NOT NULL
);
INSERT INTO schema_metadata (singleton, version) VALUES (TRUE, 2)
ON CONFLICT (singleton) DO UPDATE SET version = EXCLUDED.version;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS sync_snapshots (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
