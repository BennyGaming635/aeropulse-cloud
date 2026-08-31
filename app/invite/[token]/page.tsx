import Link from "next/link";
import { accountForPage } from "@/lib/sessions";
import { sharedTripInvitePreview } from "@/lib/shared-trips";
import InviteJoinButton from "./InviteJoinButton";

export const dynamic = "force-dynamic";

export default async function SharedTripInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [invite, account] = await Promise.all([sharedTripInvitePreview(token), accountForPage()]);

  if (!invite) {
    return (
      <main className="invite-shell">
        <section className="invite-card invalid-invite">
          <p className="eyebrow">AERO ID INVITE</p>
          <h1>This link is no longer boarding.</h1>
          <p>The invite is invalid, expired, revoked, or has reached its member limit.</p>
          <Link className="button secondary" href="/account">Open Aero ID</Link>
        </section>
      </main>
    );
  }

  const ownerName = invite.owner.displayName || `@${invite.owner.username}`;
  const invitePath = `/invite/${token}`;
  return (
    <main className="invite-shell">
      <section className="invite-card">
        <p className="eyebrow">AERO ID SHARED TRIP</p>
        <span className="invite-route-mark"><i /> INVITATION ACTIVE</span>
        <h1>{invite.tripName}</h1>
        <p><strong>{ownerName}</strong> invited you to coordinate this trip in Aero.</p>
        <div className="invite-owner">
          <span>{ownerName.slice(0, 2).toUpperCase()}</span>
          <div><small>TRIP OWNER</small><strong>{ownerName}</strong><em>{invite.owner.aeroID}</em></div>
        </div>
        <div className="invite-privacy">
          Joining shares your Aero ID, username, and display name with trip members. Shared flights contain only flight number, airline, route, and scheduled times. Private booking data is never copied.
        </div>
        {account ? (
          <InviteJoinButton token={token} />
        ) : (
          <Link className="button primary" href={`/account?next=${encodeURIComponent(invitePath)}`}>Sign in with Aero ID to join</Link>
        )}
        <small className="invite-expiry">Expires {new Date(invite.expiresAt).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}</small>
      </section>
    </main>
  );
}
