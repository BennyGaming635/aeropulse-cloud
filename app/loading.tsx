export default function Loading() {
  return (
    <main className="system-shell" id="main-content">
      <section aria-busy="true" aria-live="polite" className="system-card">
        <p className="eyebrow">AERO ID</p>
        <h1>Preparing your route.</h1>
        <p>Loading the latest account and journey details.</p>
        <div aria-hidden="true" className="loading-line" />
      </section>
    </main>
  );
}
