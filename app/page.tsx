import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">AEROPULSE ID / ONE TRAVEL PROFILE</p>
          <h1>Pick up your journey <em>anywhere.</em></h1>
          <p className="hero-lede">
            AeroPulse Cloud keeps your trips, preferences, and travel history together under one
            memorable AeroPulse ID.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/account">Open your account</Link>
            <Link className="button secondary" href="/docs">Explore the sync API</Link>
          </div>
          <p className="fine-print">Sign in with Apple. No password. Guest mode stays available in the app.</p>
        </div>
        <div className="orbit-card" aria-label="Illustration of cloud flight sync">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="cloud-core">
            <span className="pulse-dot" />
            <strong>AP-7K9M-2WQF</strong>
            <small>SYNCED JUST NOW</small>
          </div>
          <span className="airport-node node-sfo">SFO</span>
          <span className="airport-node node-lhr">LHR</span>
          <span className="airport-node node-syd">SYD</span>
        </div>
      </section>

      <section className="signal-strip" aria-label="Cloud features">
        <article><span>01</span><h2>One identity</h2><p>A stable AeroPulse ID follows your Apple account.</p></article>
        <article><span>02</span><h2>Version-safe sync</h2><p>Changes are checked before another device can replace them.</p></article>
        <article><span>03</span><h2>You stay in control</h2><p>Sign out, use guest mode, or remove cloud data at any time.</p></article>
      </section>

      <section className="privacy-panel">
        <p className="eyebrow">BUILT FOR PERSONAL TRAVEL DATA</p>
        <h2>Cloud convenience without turning your itinerary into a profile for advertisers.</h2>
        <p>AeroPulse ID is used for account access and sync. Provider API keys remain on your device.</p>
      </section>
    </main>
  );
}
