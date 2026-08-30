import { accountForPage } from "@/lib/sessions";
import APIKeysPanel from "./APIKeysPanel";
import AuthPanel from "./AuthPanel";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const account = await accountForPage();

  if (!account) {
    return (
      <main className="account-shell">
        <section className="sign-in-card">
          <p className="eyebrow">AEROPULSE ACCOUNT</p>
          <h1>Bring every trip into view.</h1>
          <p>Sign in with your AeroPulse username, or create an account to receive an AeroPulse ID.</p>
          <AuthPanel />
          <div className="guest-note">
            <strong>Prefer not to sign in?</strong>
            <span>Continue as a guest from the AeroPulse setup wizard. Guest data stays on that device.</span>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="account-shell">
      <div className="account-stack">
        <section className="account-card">
        <div className="account-heading">
          <div>
            <p className="eyebrow">SIGNED IN</p>
            <h1>{account.displayName || "AeroPulse traveller"}</h1>
            <p>@{account.username}</p>
          </div>
          <span className="status-pill"><i /> Cloud ready</span>
        </div>
        <div className="id-ticket">
          <span>YOUR AEROPULSE ID</span>
          <strong>{account.aeroPulseID}</strong>
          <small>Created {new Date(account.createdAt).toLocaleDateString("en", { dateStyle: "medium" })}</small>
        </div>
        <div className="account-grid">
          <div><span>Username</span><strong>@{account.username}</strong></div>
          <div><span>Sync</span><strong>Version protected</strong></div>
        </div>
        <div className="account-actions">
          <form action="/api/auth/logout" method="post"><button className="button secondary">Sign out</button></form>
          <details className="delete-control">
            <summary>Delete account and cloud data</summary>
            <form action="/api/account/delete" method="post">
              <button className="text-danger">Confirm permanent deletion</button>
            </form>
          </details>
        </div>
        </section>
        <APIKeysPanel />
      </div>
    </main>
  );
}
