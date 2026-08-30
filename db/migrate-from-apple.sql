BEGIN;

-- Prelaunch migration: old Apple-only accounts cannot be converted because they have no password.
-- This removes those accounts and preserves the remaining schema objects.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'apple_subject'
  ) THEN
    RAISE EXCEPTION 'Expected the Apple-auth schema; migration was not run';
  END IF;
END $$;

TRUNCATE TABLE users CASCADE;
DROP TABLE IF EXISTS apple_grants;
DROP TABLE IF EXISTS auth_challenges;

ALTER TABLE users DROP COLUMN IF EXISTS apple_subject;
ALTER TABLE users DROP COLUMN IF EXISTS email;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(24);
ALTER TABLE users ADD COLUMN IF NOT EXISTS username_normalized VARCHAR(24);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_salt TEXT;
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
ALTER TABLE users ALTER COLUMN username_normalized SET NOT NULL;
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;
ALTER TABLE users ALTER COLUMN password_salt SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_username_normalized_key ON users(username_normalized);

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

COMMIT;
