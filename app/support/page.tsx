import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support",
  description: "Help with Aero flight tracking, Aero ID, sync, provider connections, widgets, and account controls.",
};

export default function SupportPage() {
  return (
    <main className="privacy-shell" id="main-content">
      <article className="privacy-content">
        <p className="eyebrow">AERO SUPPORT</p>
        <h1>Get back on course.</h1>
        <p className="privacy-lede">Start with the checks below. Aero keeps guest data on-device, so deleting the app can remove trips and attachments that were not synced.</p>
        <div className="privacy-grid">
          <section><h2>Flight not found</h2><p>Confirm the airline code, flight number, and departure date. Connected providers have different schedule windows. You can enter the flight manually and Aero will begin matching it 11 hours before departure.</p></section>
          <section><h2>Status looks stale</h2><p>Open Aero and pull down on Today, or use Refresh now under Settings → Flight data. iOS background refresh is opportunistic, and airline or airport displays remain authoritative.</p></section>
          <section><h2>Aero ID and sync</h2><p>Open Settings → Aero ID to check sync status, sign in again, or sync manually. The account portal shows active devices and lets you revoke sessions.</p></section>
          <section><h2>Widgets and Watch</h2><p>Open Aero once after updating a trip, then refresh the widget or Watch app. Confirm the App Group and companion app are enabled if you are using a development build.</p></section>
          <section><h2>Attachments and boarding passes</h2><p>Attachment files stay on the iPhone where they were added. They do not sync to another device and are removed when their flight or local app data is deleted.</p></section>
          <section><h2>Account deletion</h2><p>Settings → Aero ID includes permanent account deletion. You can also sign in to the web portal to review devices and shared trips before deleting your account.</p></section>
        </div>
        <div className="privacy-note">
          <p>For account controls, open the <Link href="/account">Aero ID portal</Link>. Review <Link href="/privacy">Aero privacy</Link> for data handling and deletion details.</p>
        </div>
      </article>
    </main>
  );
}
