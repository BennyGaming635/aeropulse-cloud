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
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  id UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_name VARCHAR(120) NOT NULL DEFAULT 'Unknown device',
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS device_name VARCHAR(120) DEFAULT 'Unknown device';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();
UPDATE sessions SET id = gen_random_uuid() WHERE id IS NULL;
UPDATE sessions SET device_name = 'Unknown device' WHERE device_name IS NULL;
UPDATE sessions SET last_seen_at = created_at WHERE last_seen_at IS NULL;
ALTER TABLE sessions ALTER COLUMN id SET NOT NULL;
ALTER TABLE sessions ALTER COLUMN device_name SET NOT NULL;
ALTER TABLE sessions ALTER COLUMN last_seen_at SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS sessions_id_idx ON sessions(id);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS sync_snapshots (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shared_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL CHECK (length(btrim(name)) > 0),
  start_date DATE,
  end_date DATE,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS shared_trip_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES shared_trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(12) NOT NULL CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trip_id, user_id)
);

CREATE TABLE IF NOT EXISTS shared_trip_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES shared_trips(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 25 CHECK (max_uses BETWEEN 1 AND 50),
  use_count INTEGER NOT NULL DEFAULT 0 CHECK (use_count >= 0),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (use_count <= max_uses)
);

-- Shared snapshots are intentionally allow-listed. Sensitive sync fields such as
-- credentials, confirmation codes, seats, private notes, and attachments have no columns here.
CREATE TABLE IF NOT EXISTS shared_flight_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES shared_trips(id) ON DELETE CASCADE,
  added_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  flight_number VARCHAR(16) NOT NULL CHECK (length(btrim(flight_number)) > 0),
  airline_name VARCHAR(100),
  origin_code CHAR(3) NOT NULL CHECK (origin_code ~ '^[A-Z]{3}$'),
  destination_code CHAR(3) NOT NULL CHECK (destination_code ~ '^[A-Z]{3}$'),
  scheduled_departure TIMESTAMPTZ NOT NULL,
  scheduled_arrival TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (scheduled_arrival IS NULL OR scheduled_arrival >= scheduled_departure),
  UNIQUE (trip_id, flight_number, origin_code, destination_code, scheduled_departure)
);

CREATE INDEX IF NOT EXISTS shared_trips_owner_idx ON shared_trips(owner_user_id);
CREATE INDEX IF NOT EXISTS shared_trip_memberships_user_idx ON shared_trip_memberships(user_id);
CREATE INDEX IF NOT EXISTS shared_trip_invites_trip_idx ON shared_trip_invites(trip_id);
CREATE INDEX IF NOT EXISTS shared_trip_invites_expiry_idx ON shared_trip_invites(expires_at);
CREATE INDEX IF NOT EXISTS shared_flight_snapshots_trip_idx ON shared_flight_snapshots(trip_id);

INSERT INTO schema_metadata (singleton, version) VALUES (TRUE, 4)
ON CONFLICT (singleton) DO UPDATE SET version = EXCLUDED.version;
