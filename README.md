# Aero

Vercel-ready Aero ID account and synchronization service for Aero.

- Username/password signup and login with `scrypt` password hashing.
- Stable, non-secret Aero IDs such as `AP-7K9M-2WQF`.
- Hashed 30-day browser and native bearer sessions.
- Version-protected flight and preference snapshots.
- Aero ID shared trips with expiring invite links and redacted flight snapshots.
- AES-256-GCM encrypted AirLabs, Aviationstack, AeroDataBox, and Lufthansa credentials.
- Web account, API-key management, device-session revocation, sign-out, and account deletion.

Guest mode remains local to the native app. A guest's local data becomes the first cloud snapshot when they create a new account.

## Environment variables

Copy `.env.example` to `.env.local` for local development and add the same values in Vercel:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon/Postgres connection string. |
| `APP_BASE_URL` | Canonical HTTPS deployment origin, with no trailing slash. |
| `CREDENTIAL_ENCRYPTION_KEY` | Base64-encoded 32-byte key used only for provider credentials. |

Generate the encryption key once with `openssl rand -base64 32`. Keep it stable and secret. Losing or rotating it without a migration makes existing synced API keys unreadable.

No Apple Developer credentials or OAuth secrets are required.

## Setup

1. Create a Neon Postgres database.
2. Run `db/schema.sql` in the Neon SQL editor.
3. If the old Apple-auth schema was already installed, run `db/migrate-from-apple.sql` once instead. It deletes prelaunch Apple-only accounts because they cannot be converted to passwords.
4. If the password-auth schema is already deployed at version 2, run `db/migrate-add-devices.sql` once.
5. On an existing version 3 database, run `db/migrate-add-shared-trips.sql` once to install shared trips and update `schema_metadata` to version 4. New databases receive the same tables from `db/schema.sql`.
6. Configure the three environment variables above.
7. Run `npm install` and `npm run dev`, or import this repository into Vercel.
8. Set `AeroPulseCloudBaseURL` in the native app's `Info.plist` to the deployed origin.

## Native API

`POST /api/auth/signup` accepts `username`, `password`, and optional `displayName`.

`POST /api/auth/login` accepts `username` and `password`.

Both return `{ account, sessionToken, expiresAt }`. Native requests then use `Authorization: Bearer SESSION_TOKEN`.

`GET`, `PUT`, and `DELETE /api/provider-credentials` synchronize provider keys independently from the flight snapshot. Mutations include the provider's `baseVersion`; stale writes return HTTP 409. Deletions retain versioned tombstones so old devices cannot overwrite a newly recreated key. Keys are returned only to an authenticated account over HTTPS and are encrypted before database storage.

`GET /api/sync` returns `{ version, payload, updatedAt }`. `PUT /api/sync` accepts `{ baseVersion, payload }` and returns HTTP 409 if another device wrote first.

`DELETE /api/account` permanently removes the user. Foreign-key cascades remove sessions, provider credentials, and snapshots.

`GET /api/sessions` lists active browser and native devices. `DELETE /api/sessions` revokes a selected session immediately.

## Shared trips API

All shared-trip API calls require an Aero ID session cookie or bearer session. Browser mutations also require the canonical `Origin` already enforced by the account APIs.

- `GET /api/shared-trips` lists the caller's memberships, members, and allow-listed flight snapshots. `POST /api/shared-trips` creates a trip and owner membership from `{ name, startDate?, endDate? }`.
- `PATCH /api/shared-trips/:tripID` is owner-only and accepts `{ baseVersion, name?, startDate?, endDate? }`. Stale versions return HTTP 409 with `currentVersion`.
- `POST /api/shared-trips/:tripID/flights` lets a member add `{ flightNumber, airlineName?, originCode, destinationCode, scheduledDeparture, scheduledArrival? }`. `DELETE` accepts `{ flightID }`; the contributor or trip owner may remove it.
- `POST /api/shared-trips/:tripID/invites` is owner-only and accepts `{ expiresInHours, maxUses }`. It returns the raw invite URL once; only the token's SHA-256 hash is stored.
- `POST /api/shared-trip-invites/:token/join` joins the signed-in Aero ID while the invite is active. The public `/invite/:token` page discloses only trip name, owner public identity, and expiry before joining.
- `DELETE /api/shared-trips/:tripID/memberships` accepts `{ membershipID }`. A non-owner may remove their own membership, while the owner may remove another non-owner member. Owners cannot leave because ownership transfer is not yet modeled.

Shared flight storage is deliberately not a copy of the private sync payload. It has columns only for flight number, optional airline name, airport codes, and scheduled times. It has no provider credentials, confirmation codes, seats, private notes, attachments, or arbitrary JSON fields.

## Production notes

- Aero IDs and usernames identify accounts; neither replaces the password.
- Authentication has database-backed IP and username limits; add Vercel Firewall limits as an additional public-launch layer.
- Run periodic cleanup with `DELETE FROM sessions WHERE expires_at <= NOW()`.
- Periodically remove expired rate-limit windows from `auth_rate_limits`.
- Periodically remove expired or revoked rows from `shared_trip_invites`; membership and snapshot rows cascade when a trip or account owner is deleted.
- Never expose `CREDENTIAL_ENCRYPTION_KEY` to browser code or commit `.env.local`.
- Keep App Store disclosures aligned with `/privacy`: shared Aero identity and redacted travel snapshots are visible to joined trip members, while provider credentials and private booking details are never shared.
