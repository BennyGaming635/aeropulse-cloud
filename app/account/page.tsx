import type { Metadata } from "next";
import { accountForPage } from "@/lib/sessions";
import APIKeysPanel from "./APIKeysPanel";
import AuthPanel from "./AuthPanel";
import DevicesPanel from "./DevicesPanel";
import SharedTripsPanel from "./SharedTripsPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aero ID",
  description: "Manage your Aero ID, devices, shared trips, and flight-data connections.",
  robots: { index: false, follow: false },
};

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ next?: string; trip?: string }> }) {
  const account = await accountForPage();
  const query = await searchParams;
  const nextPath = query.next?.startsWith("/invite/") ? query.next : undefined;

  if (!account) {
    return (
      <main className="account-shell auth-shell" id="main-content">
        <div className="auth-layout">
          <aside className="auth-visual">
            <p className="eyebrow">AERO ID</p>
            <h1>Resume your journey.</h1>
            <p>Trips, preferences, and encrypted provider keys ready wherever Aero is installed.</p>
            <div aria-label="Sample route from San Francisco to London" className="auth-route">
              <div><strong>SFO</strong><span>18:42</span></div>
              <i aria-hidden="true"><span /></i>
              <div><strong>LHR</strong><span>13:03</span></div>
            </div>
            <div className="auth-signal"><i aria-hidden="true" /> Waiting for secure sign-in</div>
          </aside>
          <section className="sign-in-card">
            <p className="eyebrow">ACCOUNT ACCESS</p>
            <h2>Welcome aboard.</h2>
            <p>Sign in with your Aero username or create a new Aero ID.</p>
            <AuthPanel nextPath={nextPath} />
            <div className="guest-note">
              <strong>Not ready to sync?</strong>
              <span>Continue as a guest in the Aero app. Your data stays on that device.</span>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="portal-shell" id="main-content">
      <div className="portal-heading">
        <div>
          <p className="eyebrow">ACCOUNT CONTROL</p>
          <h1>{account.displayName || account.username}</h1>
          <p>@{account.username} · Synced with Aero</p>
        </div>
        <span className="status-pill"><i aria-hidden="true" /> Cloud ready</span>
      </div>

      <div className="account-stack">
        <div className="portal-grid">
          <section className="account-card">
            <div className="card-label"><span>IDENTITY</span><small>Created {new Date(account.createdAt).toLocaleDateString("en", { dateStyle: "medium" })}</small></div>
            <div className="id-ticket">
              <span>YOUR AERO ID</span>
              <strong>{account.aeroPulseID}</strong>
              <small>Use the same username on every Aero device.</small>
            </div>
            <div className="account-grid">
              <div><span>Username</span><strong>@{account.username}</strong></div>
              <div><span>Sync protocol</span><strong>Version protected</strong></div>
            </div>
            <div className="account-actions">
              <form action="/api/auth/logout" method="post"><button className="button secondary" type="submit">Sign out</button></form>
              <details className="delete-control">
                <summary>Delete cloud account</summary>
                <form action="/api/account/delete" method="post">
                  <button className="text-danger" type="submit">Confirm permanent deletion</button>
                </form>
              </details>
            </div>
          </section>
          <DevicesPanel />
        </div>
        <SharedTripsPanel initialTripID={query.trip} />
        <APIKeysPanel />
      </div>
    </main>
  );
}
