export default function DocsPage() {
  return (
    <main className="docs-shell">
      <p className="eyebrow">AEROPULSE CLOUD API / V1</p>
      <h1>Native sync contract</h1>
      <p className="docs-lede">The iOS app signs up or logs in with a username and password, then uses the returned session as a bearer token.</p>

      <section className="endpoint"><code>POST /api/auth/signup</code><p>Create an AeroPulse ID and return a 30-day session.</p></section>
      <section className="endpoint"><code>POST /api/auth/login</code><p>Authenticate an existing username and return a session.</p></section>
      <section className="endpoint"><code>GET /api/account</code><p>Restore the current account and AeroPulse ID.</p></section>
      <section className="endpoint"><code>GET / PUT / DELETE /api/provider-credentials</code><p>Read, save, or remove encrypted flight-provider credentials.</p></section>
      <section className="endpoint"><code>GET / PUT /api/sync</code><p>Read or write the version-protected flight and preference snapshot.</p></section>
      <section className="endpoint"><code>DELETE /api/account</code><p>Permanently remove the account, sessions, keys, and synced data.</p></section>

      <div className="code-card">
        <span>Account request</span>
        <pre>{`{
  "username": "cloud_traveller",
  "password": "a-long-private-password",
  "displayName": "Taylor"
}`}</pre>
      </div>
      <div className="code-card">
        <span>Provider credential write</span>
        <pre>{`{
  "providerID": "aeroDataBox",
  "primary": "rapid-api-key",
  "secondary": "",
  "baseVersion": 0
}`}</pre>
      </div>
    </main>
  );
}
