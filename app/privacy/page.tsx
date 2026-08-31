export default function PrivacyPage() {
  return (
    <main className="privacy-shell">
      <article className="privacy-content">
        <p className="eyebrow">AERO PRIVACY</p>
        <h1>Share the route, not the booking.</h1>
        <p className="privacy-lede">Aero ID keeps account sync data private to you. A shared trip is a separate, deliberate copy visible only to Aero ID members who joined that trip.</p>
        <div className="privacy-grid">
          <section><h2>Shared identity</h2><p>Trip members can see each other's Aero ID, username, display name, membership role, and join time. An unused invite page shows only the trip name, owner's public Aero identity, and invite expiry.</p></section>
          <section><h2>Shared flight snapshot</h2><p>A snapshot contains only flight number, optional airline name, origin and destination airport codes, and scheduled departure and arrival times.</p></section>
          <section><h2>Never copied</h2><p>Provider credentials, booking confirmation codes, seats, private notes, attachments, and the rest of your private sync snapshot are not modeled in shared trips and cannot be returned by sharing APIs.</p></section>
          <section><h2>Your controls</h2><p>Trip owners can invite and remove members. Members can leave. Flight contributors can remove their own snapshots, and owners can remove any flight from their trip.</p></section>
        </div>
        <p className="privacy-note">Invite links expire and may be used by multiple people until their use limit is reached. Treat an active link as access to join the trip. Aero stores only a one-way hash of the invite token.</p>
      </article>
    </main>
  );
}
