export default function DocsPage() {
  return (
    <main className="docs-shell">
      <p className="eyebrow">AEROPULSE CLOUD API / V1</p>
      <h1>Native sync contract</h1>
      <p className="docs-lede">The iOS app authenticates with an Apple identity token and then uses the returned AeroPulse session as a bearer token.</p>

      <section className="endpoint"><code>POST /api/auth/apple/challenge</code><p>Create a short-lived, single-use nonce challenge for native Sign in with Apple.</p></section>
      <section className="endpoint"><code>POST /api/auth/apple/native</code><p>Exchange an Apple identity token, authorization code, and challenge for an account session.</p></section>
      <section className="endpoint"><code>GET /api/account</code><p>Restore the current AeroPulse ID and account details.</p></section>
      <section className="endpoint"><code>GET /api/sync</code><p>Fetch the current snapshot and its optimistic version.</p></section>
      <section className="endpoint"><code>PUT /api/sync</code><p>Write a snapshot using <code>baseVersion</code>. A stale write returns HTTP 409 and the current snapshot.</p></section>
      <section className="endpoint"><code>DELETE /api/account</code><p>Permanently remove the account, sessions, and synced data.</p></section>

      <div className="code-card">
        <span>Native authorization request</span>
        <pre>{`{
  "identityToken": "eyJ...",
  "authorizationCode": "c123...",
  "challengeID": "8d97bdf0-7b15-4c5b-8322-90e4fa0693e8",
  "rawNonce": "one-time-random-value",
  "displayName": "Taylor"
}`}</pre>
      </div>
      <div className="code-card">
        <span>Versioned snapshot write</span>
        <pre>{`{
  "baseVersion": 4,
  "payload": {
    "schemaVersion": 1,
    "flights": [],
    "preferences": {},
    "clientUpdatedAt": "2026-08-30T05:00:00Z"
  }
}`}</pre>
      </div>
    </main>
  );
}
