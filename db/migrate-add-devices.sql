BEGIN;

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

UPDATE schema_metadata SET version = 3 WHERE singleton = TRUE;

COMMIT;
