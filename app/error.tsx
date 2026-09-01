"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="system-shell" id="main-content">
      <section className="system-card">
        <p className="eyebrow">ROUTE INTERRUPTED</p>
        <h1>Aero could not load this page.</h1>
        <p>Your account data is unchanged. Check your connection and try again.</p>
        <button className="button primary" onClick={reset} type="button">Try again</button>
      </section>
    </main>
  );
}
