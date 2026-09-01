import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Aero handles local trips, optional Aero ID sync, provider credentials, attachments, and shared trips.",
};

export default function PrivacyPage() {
  return (
    <main className="privacy-shell" id="main-content">
      <article className="privacy-content">
        <p className="eyebrow">AERO PRIVACY</p>
        <h1>Share the route, not the booking.</h1>
        <p className="privacy-lede">Aero works without an account. Aero ID sync and shared trips are optional, explicit features with separate controls.</p>
        <div className="privacy-grid">
          <section><h2>Guest mode</h2><p>Flights, preferences, reminders, and provider credentials remain on your device. Documents, screenshots, and boarding passes stay in local app storage and are excluded from backup.</p></section>
          <section><h2>Aero ID sync</h2><p>If you sign in, Aero syncs your flights, travel history, display preferences, and encrypted provider credentials. Passwords are salted and hashed. Device names and session times support device access controls.</p></section>
          <section><h2>Connected providers</h2><p>Schedule providers receive the flight number and selected date you request. Live tracking services receive a callsign or aircraft identifier. Weather services receive airport coordinates. Apple supplies map functionality.</p></section>
          <section><h2>Apple system features</h2><p>Siri, widgets, Spotlight, Live Activities, and Apple Watch receive a limited operational snapshot. Seats, confirmation codes, private notes, credentials, and attachment contents are excluded.</p></section>
          <section><h2>Shared identity</h2><p>Trip members can see each other's Aero ID, username, display name, membership role, and join time. An unused invite page shows only the trip name, owner's public Aero identity, and invite expiry.</p></section>
          <section><h2>Shared flight snapshot</h2><p>A snapshot contains only flight number, optional airline name, origin and destination airport codes, and scheduled departure and arrival times.</p></section>
          <section><h2>Never copied</h2><p>Provider credentials, booking confirmation codes, seats, private notes, attachments, and the rest of your private sync snapshot are not modeled in shared trips and cannot be returned by sharing APIs.</p></section>
          <section><h2>Your controls</h2><p>Trip owners can invite and remove members. Members can leave. Flight contributors can remove their own snapshots, and owners can remove any flight from their trip.</p></section>
          <section><h2>Retention and deletion</h2><p>Local data remains until you remove it or delete the app. Aero ID data remains while the account exists. Permanent account deletion is available in the app and removes server-side account data through the deletion workflow.</p></section>
          <section><h2>No tracking</h2><p>Aero contains no advertising or third-party analytics SDK. Aero does not sell personal data or use cross-app tracking.</p></section>
        </div>
        <p className="privacy-note">Invite links expire and may be used by multiple people until their use limit is reached. Treat an active link as access to join the trip. Aero stores only a one-way hash of the invite token.</p>
      </article>
    </main>
  );
}
