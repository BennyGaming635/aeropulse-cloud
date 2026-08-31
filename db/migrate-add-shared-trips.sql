BEGIN;

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

-- Only explicitly public flight fields are copied into a shared trip.
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

UPDATE schema_metadata SET version = 4 WHERE singleton = TRUE;

COMMIT;
