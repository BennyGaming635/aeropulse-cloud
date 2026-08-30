# AeroPulse Cloud

Vercel-ready account and synchronization service for AeroPulse. It provides:

- Sign in with Apple on the web and native iOS token exchange.
- Stable, non-secret AeroPulse IDs such as `AP-7K9M-2WQF`.
- Hashed 30-day sessions for browsers and native bearer tokens.
- Versioned JSON snapshots with HTTP 409 conflict responses.
- Account and cloud-data deletion.
- A responsive account portal and API documentation.

Guest mode is intentionally local to the AeroPulse app. A guest's local flights become the first cloud snapshot when they create an AeroPulse account and that account has no existing snapshot.

## Local setup

Node.js 22 or later is recommended.

1. Create a Neon Postgres database, then run `db/schema.sql` in the Neon SQL editor.
2. Copy `.env.example` to `.env.local` and fill in every value.
   Generate `APPLE_TOKEN_ENCRYPTION_KEY` with `openssl rand -base64 32` and keep it stable between deployments.
3. Run `npm install`.
4. Run `npm run dev`.

Apple's web callback requires a registered HTTPS domain, so complete Sign in with Apple testing should use a Vercel preview or production domain rather than localhost.
Apple sign-in always redirects to `APP_BASE_URL`; use a stable Apple-registered staging domain instead of arbitrary Vercel preview URLs.

## Apple Developer setup

1. Enable Sign in with Apple for the app identifier `com.bengraetz.AeroPulse`.
2. Create a Services ID, for example `com.bengraetz.AeroPulse.web`.
3. Associate the Services ID with the AeroPulse primary App ID.
4. Register the Vercel domain and `https://YOUR_DOMAIN/api/auth/apple/callback` return URL.
5. Create and download a Sign in with Apple `.p8` key, then configure its Team ID, Key ID, and private key in Vercel.
6. Set `APPLE_NATIVE_CLIENT_ID` to the iOS bundle identifier and `APPLE_WEB_CLIENT_ID` to the Services ID.

The iOS app also needs the `com.apple.developer.applesignin` entitlement and a regenerated provisioning profile.

## Vercel deployment

1. Import this directory as a new Vercel project.
2. Add a Neon integration or set `DATABASE_URL` manually.
3. Add all variables from `.env.example` to Production and Preview.
4. Deploy, register the final domain with Apple, and update `APP_BASE_URL` and `APPLE_WEB_REDIRECT_URI`.
5. Set the native app's `AeroPulseCloudBaseURL` Info.plist value to the deployed origin.

## API

Native requests use `Authorization: Bearer SESSION_TOKEN` after `POST /api/auth/apple/native`.

### `POST /api/auth/apple/native`

The app first requests a short-lived challenge, then sends its Apple identity token, single-use authorization code, challenge ID, raw nonce, and first-login display name. The server validates issuer, audience, signature, expiry, and nonce, consumes the challenge, exchanges the code with Apple, and encrypts the resulting refresh token.

### `GET /api/sync`

Returns `{ version, payload, updatedAt }`. A new account has version `0` and an empty payload.

### `PUT /api/sync`

Accepts `{ baseVersion, payload }`. The write succeeds only if `baseVersion` is current. A conflict returns HTTP 409 with `{ error, current }`. Snapshots are limited to 2 MB.

### Account deletion

`DELETE /api/account` removes the user. Foreign-key cascades remove sessions and sync data. The web account page exposes the same operation.

## Production notes

- AeroPulse IDs identify accounts but are not authentication secrets.
- Provider API credentials must remain in the native Keychain and must not be included in snapshots.
- Configure Vercel rate limiting or a firewall rule for authentication endpoints before a public launch.
- Run periodic cleanup for expired `sessions` rows.
- Also remove expired `auth_challenges` rows during scheduled cleanup.
- Update the privacy policy and App Store privacy disclosures for account identity and user-provided travel data.
