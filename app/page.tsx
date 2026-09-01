import Link from "next/link";

export default function Home() {
  return (
    <main className="landing" id="main-content">
      <section aria-labelledby="hero-title" className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <p className="live-kicker"><span aria-hidden="true" /> Aero is ready</p>
          <h1 id="hero-title">Your flight life.<br /><em>Cleared everywhere.</em></h1>
          <p className="hero-lede">
            One Aero ID carries your trips, preferences, and flight-data connections from one device to the next.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/account">Open your Aero ID <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="trust-line">
            <span><i aria-hidden="true" /> Encrypted credentials</span>
            <span><i aria-hidden="true" /> Version-safe sync</span>
            <span><i aria-hidden="true" /> Guest mode available</span>
          </div>
        </div>

        <aside className="flight-console" aria-labelledby="journey-preview-title">
          <h2 className="sr-only" id="journey-preview-title">Example synchronized journey</h2>
          <div className="console-header">
            <div><span aria-hidden="true" className="pulse-dot" /> LIVE JOURNEY</div>
            <span>UA 901</span>
          </div>
          <div className="route-board">
            <div><strong>SFO</strong><span>San Francisco</span><small>18:42</small></div>
            <div aria-hidden="true" className="route-track"><i className="plane-mark">✦</i><span /></div>
            <div className="route-destination"><strong>LHR</strong><span>London</span><small>13:03</small></div>
          </div>
          <div className="journey-facts">
            <div><span>STATUS</span><strong className="delay-state">Delayed 12 min</strong></div>
            <div><span>GATE</span><strong>G6</strong></div>
            <div><span>SEAT</span><strong>12A</strong></div>
          </div>
          <div className="sync-feed">
            <div className="feed-title"><span>SYNC ACTIVITY</span><small>Now</small></div>
            <div className="feed-row"><i className="feed-icon flight" /><span>Trip board updated</span><small>iPhone</small></div>
            <div className="feed-row"><i className="feed-icon key" /><span>AirLabs key secured</span><small>Cloud</small></div>
            <div className="feed-row"><i className="feed-icon watch" /><span>Watch snapshot ready</span><small>Synced</small></div>
          </div>
          <div className="console-watermark">AP-7K9M-2WQF</div>
        </aside>
      </section>

      <section className="continuity-strip" aria-label="Aero across your devices">
        <div>
          <p className="eyebrow">ONE JOURNEY, EVERY SCREEN</p>
          <h2>Aero moves with you.</h2>
        </div>
        <div className="platform-list">
          <article><span>01</span><strong>iPhone</strong><small>Plan and follow</small></article>
          <article><span>02</span><strong>Lock Screen</strong><small>Glance and go</small></article>
          <article><span>03</span><strong>Apple Watch</strong><small>Gate on wrist</small></article>
          <article><span>04</span><strong>Aero ID</strong><small>Resume securely</small></article>
        </div>
      </section>

      <section className="manifest">
        <div className="manifest-heading">
          <p className="eyebrow">BUILT AROUND THE JOURNEY</p>
          <h2>Continuity without the clutter.</h2>
          <p>Everything you need to resume a trip. Nothing added for engagement, advertising, or noise.</p>
        </div>
        <div className="feature-grid">
          <article className="feature-card feature-identity">
            <span className="feature-number">01</span>
            <div className="identity-demo"><span>AP</span><strong>AP-7K9M-2WQF</strong><i /></div>
            <h3>One travel identity</h3>
            <p>Your Aero ID links the journey, not an advertising profile.</p>
          </article>
          <article className="feature-card feature-sync">
            <span className="feature-number">02</span>
            <div className="sync-demo"><i /><i /><i /><span>03</span></div>
            <h3>Conflict-aware sync</h3>
            <p>Version checks and durable retry queues protect newer changes across devices.</p>
          </article>
          <article className="feature-card feature-control">
            <span className="feature-number">03</span>
            <div className="control-demo"><i /><i /><i /><span>REVOKE</span></div>
            <h3>Access stays visible</h3>
            <p>See every active device and revoke sessions directly from your portal.</p>
          </article>
        </div>
      </section>

      <section className="security-band">
        <div>
          <p className="eyebrow">PRIVATE BY DESIGN</p>
          <h2>Your provider keys are cargo.<br />We treat them accordingly.</h2>
        </div>
        <div className="security-copy">
          <p>Flight-provider credentials are encrypted separately before database storage. Shared trips copy only a flight's number, airline, route, and scheduled times. Seats, confirmation codes, private notes, attachments, and provider keys are never shared.</p>
          <Link href="/account">Manage your account <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
    </main>
  );
}
