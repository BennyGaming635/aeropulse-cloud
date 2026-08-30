# AeroPulse Cloud

Vercel-ready account and synchronization service for AeroPulse.

- Username/password signup and login with `scrypt` password hashing.
- Stable, non-secret AeroPulse IDs such as `AP-7K9M-2WQF`.
- Hashed 30-day browser and native bearer sessions.
- Version-protected flight and preference snapshots.
- AES-256-GCM encrypted AirLabs, Aviationstack, AeroDataBox, and Lufthansa credentials.
- Web account, API-key management, sign-out, and account deletion.

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
4. Configure the three environment variables above.
5. Run `npm install` and `npm run dev`, or import this repository into Vercel.
6. Set `AeroPulseCloudBaseURL` in the native app's `Info.plist` to the deployed origin.

## Native API

`POST /api/auth/signup` accepts `username`, `password`, and optional `displayName`.

`POST /api/auth/login` accepts `username` and `password`.

Both return `{ account, sessionToken, expiresAt }`. Native requests then use `Authorization: Bearer SESSION_TOKEN`.

`GET`, `PUT`, and `DELETE /api/provider-credentials` synchronize provider keys independently from the flight snapshot. Mutations include the provider's `baseVersion`; stale writes return HTTP 409. Deletions retain versioned tombstones so old devices cannot overwrite a newly recreated key. Keys are returned only to an authenticated account over HTTPS and are encrypted before database storage.

`GET /api/sync` returns `{ version, payload, updatedAt }`. `PUT /api/sync` accepts `{ baseVersion, payload }` and returns HTTP 409 if another device wrote first.

`DELETE /api/account` permanently removes the user. Foreign-key cascades remove sessions, provider credentials, and snapshots.

## Production notes

- AeroPulse IDs and usernames identify accounts; neither replaces the password.
- Authentication has database-backed IP and username limits; add Vercel Firewall limits as an additional public-launch layer.
- Run periodic cleanup with `DELETE FROM sessions WHERE expires_at <= NOW()`.
- Periodically remove expired rate-limit windows from `auth_rate_limits`.
- Never expose `CREDENTIAL_ENCRYPTION_KEY` to browser code or commit `.env.local`.
- Update App Store and website privacy disclosures for account identifiers, travel data, and user-provided provider credentials.
