import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How Aero handles local trips, optional Aero ID sync, provider credentials, attachments, and shared trips.",
};

const sections = [
  [
    "01",
    "Guest mode",
    "Aero works without an account. Flights, preferences, reminders, and provider credentials remain on your device. Documents, screenshots, and boarding passes stay in local app storage and are excluded from backup.",
  ],
  [
    "02",
    "Aero ID sync",
    "If you sign in, Aero syncs your flights, travel history, display preferences, and encrypted provider credentials. Passwords are salted and hashed. Device names and session times support device access controls.",
  ],
  [
    "03",
    "Connected providers",
    "Schedule providers receive the flight number and selected date you request. Live tracking services receive a callsign or aircraft identifier. Weather services receive airport coordinates. Apple supplies map functionality.",
  ],
  [
    "04",
    "Apple system features",
    "Siri, widgets, Spotlight, Live Activities. Seats, confirmation codes, private notes, credentials, and attachment contents are excluded.",
  ],
  [
    "05",
    "Shared identity",
    "Trip members can see each other's Aero ID, username, display name, membership role, and join time. An unused invite page shows only the trip name, owner's public Aero identity, and invite expiry.",
  ],
  [
    "06",
    "Shared flight snapshot",
    "A snapshot contains only flight number, optional airline name, origin and destination airport codes, and scheduled departure and arrival times.",
  ],
  [
    "07",
    "Never copied",
    "Provider credentials, booking confirmation codes, seats, private notes, attachments, and the rest of your private sync snapshot are not modeled in shared trips and cannot be returned by sharing APIs.",
  ],
  [
    "08",
    "Your controls",
    "Trip owners can invite and remove members. Members can leave. Flight contributors can remove their own snapshots, and owners can remove any flight from their trip.",
  ],
  [
    "09",
    "Retention and deletion",
    "Local data remains until you remove it or delete the app. Aero ID data remains while the account exists. Permanent account deletion is available in the app and removes server-side account data through the deletion workflow.",
  ],
  [
    "10",
    "No tracking",
    "Aero contains no advertising or third-party analytics SDK. Aero does not sell personal data or use cross-app tracking.",
  ],
];

export default function PrivacyPage() {
  return (
    <main
      id="main-content"
      style={{
        background: "#f4f5ef",
        minHeight: "calc(100vh - 82px)",
        color: "#08191f",
      }}
    >
      <style>{`
        .legal-wrap {
          width: min(1080px, 100%);
          margin: auto;
          padding: clamp(60px, 9vw, 110px) 28px 100px;
        }

        .legal-hero {
          display: grid;
          grid-template-columns: 1fr .55fr;
          gap: 70px;
          align-items: end;
          padding-bottom: 54px;
          border-bottom: 1px solid rgba(8,25,31,.13);
        }

        .legal-eyebrow {
          color: #1b8268;
          font: 500 10px "DM Mono", monospace;
          letter-spacing: .18em;
          text-transform: uppercase;
        }

        .legal-title {
          margin: 16px 0 20px;
          font-size: clamp(48px, 7vw, 82px);
          line-height: .93;
          letter-spacing: -.065em;
          font-weight: 600;
        }

        .legal-lede {
          margin: 0;
          color: #5b7074;
          font-size: 16px;
          line-height: 1.75;
          max-width: 680px;
        }

        .legal-meta {
          padding: 18px;
          border-left: 2px solid #1b8268;
          color: #617477;
          font: 500 10px "DM Mono", monospace;
          line-height: 1.7;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .legal-meta strong {
          display: block;
          color: #08191f;
          font: 600 14px "Manrope", sans-serif;
          letter-spacing: 0;
          text-transform: none;
          margin-top: 5px;
        }

        .legal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-top: 30px;
        }

        .legal-card {
          padding: 27px;
          border: 1px solid rgba(8,25,31,.13);
          border-radius: 9px;
          background: #fbfcf8;
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .legal-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 38px rgba(8,25,31,.07);
        }

        .legal-number {
          display: inline-flex;
          width: 30px;
          height: 30px;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #e6eee9;
          color: #1b8268;
          font: 500 9px "DM Mono", monospace;
        }

        .legal-card h2 {
          margin: 22px 0 9px;
          font-size: 19px;
          letter-spacing: -.025em;
        }

        .legal-card p {
          margin: 0;
          color: #607477;
          font-size: 12px;
          line-height: 1.8;
        }

        .legal-note {
          margin-top: 14px;
          padding: 23px 27px;
          border-radius: 9px;
          background: #0b2932;
          color: #c5d5d3;
          font-size: 12px;
          line-height: 1.75;
        }

        .legal-note strong {
          color: #9cf4ca;
        }

        .legal-back {
          display: inline-flex;
          margin-top: 34px;
          color: #1b8268;
          font: 600 11px "DM Mono", monospace;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        @media (max-width: 700px) {
          .legal-wrap {
            padding: 52px 18px 72px;
          }

          .legal-hero {
            grid-template-columns: 1fr;
            gap: 28px;
            padding-bottom: 38px;
          }

          .legal-title {
            font-size: clamp(45px, 14vw, 62px);
          }

          .legal-grid {
            grid-template-columns: 1fr;
          }

          .legal-card {
            padding: 22px;
          }

          .legal-note {
            padding: 20px;
          }
        }
      `}</style>

      <div className="legal-wrap">
        <div className="legal-hero">
          <div>
            <div className="legal-eyebrow">AERO · PRIVACY</div>

            <h1 className="legal-title">
              Share the route,
              <br />
              not the booking.
            </h1>

            <p className="legal-lede">
              Your travel data should stay yours. Aero works without an
              account, and every cloud or sharing feature is optional and
              explicit.
            </p>
          </div>

          <div className="legal-meta">
            Privacy policy
            <strong>Your data, your controls.</strong>
          </div>
        </div>

        <div className="legal-grid">
          {sections.map(([number, title, text]) => (
            <section className="legal-card" key={number}>
              <span className="legal-number">{number}</span>

              <h2>{title}</h2>

              <p>{text}</p>
            </section>
          ))}
        </div>

        <div className="legal-note">
          <strong>Invite links:</strong> Invite links expire and may be used by
          multiple people until their use limit is reached. Treat an active
          link as access to join the trip. Aero stores only a one-way hash of
          the invite token.
        </div>

        <Link className="legal-back" href="/">
          ← Back to Aero
        </Link>
      </div>
    </main>
  );
}