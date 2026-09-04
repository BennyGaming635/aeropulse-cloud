import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Help with Aero flight tracking, Aero ID, sync, provider connections, widgets, and account controls.",
};

const sections = [
  [
    "01",
    "Flight not found",
    "Confirm the airline code, flight number, and departure date. Connected providers have different schedule windows. You can enter the flight manually and Aero will begin matching it 11 hours before departure.",
  ],
  [
    "02",
    "Status looks stale",
    "Open Aero and pull down on Today, or use Refresh now under Settings → Flight data. iOS background refresh is opportunistic, and airline or airport displays remain authoritative.",
  ],
  [
    "03",
    "Aero ID and sync",
    "Open Settings → Aero ID to check sync status, sign in again, or sync manually. The account portal shows active devices and lets you revoke sessions.",
  ],
  [
    "04",
    "Widgets",
    "Open Aero once after updating a trip, then refresh the widget by tapping 'Refresh in Aero'.",
  ],
  [
    "05",
    "Attachments and boarding passes",
    "Attachment files stay on the iPhone where they were added. They do not sync to another device and are removed when their flight or local app data is deleted.",
  ],
  [
    "06",
    "Account deletion",
    "Settings → Aero ID includes permanent account deletion. You can also sign in to the web portal to review devices and shared trips before deleting your account.",
  ],
];

export default function SupportPage() {
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
        .support-wrap {
          width: min(1080px, 100%);
          margin: auto;
          padding: clamp(60px, 9vw, 110px) 28px 100px;
        }

        .support-hero {
          display: grid;
          grid-template-columns: 1fr .55fr;
          gap: 70px;
          align-items: end;
          padding-bottom: 54px;
          border-bottom: 1px solid rgba(8,25,31,.13);
        }

        .support-eyebrow {
          color: #1b8268;
          font: 500 10px "DM Mono", monospace;
          letter-spacing: .18em;
          text-transform: uppercase;
        }

        .support-title {
          margin: 16px 0 20px;
          font-size: clamp(48px, 7vw, 82px);
          line-height: .93;
          letter-spacing: -.065em;
          font-weight: 600;
        }

        .support-lede {
          margin: 0;
          color: #5b7074;
          font-size: 16px;
          line-height: 1.75;
          max-width: 680px;
        }

        .support-meta {
          padding: 18px;
          border-left: 2px solid #1b8268;
          color: #617477;
          font: 500 10px "DM Mono", monospace;
          line-height: 1.7;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .support-meta strong {
          display: block;
          color: #08191f;
          font: 600 14px "Manrope", sans-serif;
          letter-spacing: 0;
          text-transform: none;
          margin-top: 5px;
        }

        .support-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-top: 30px;
        }

        .support-card {
          padding: 27px;
          border: 1px solid rgba(8,25,31,.13);
          border-radius: 9px;
          background: #fbfcf8;
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .support-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 38px rgba(8,25,31,.07);
        }

        .support-number {
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

        .support-card h2 {
          margin: 22px 0 9px;
          font-size: 19px;
          letter-spacing: -.025em;
        }

        .support-card p {
          margin: 0;
          color: #607477;
          font-size: 12px;
          line-height: 1.8;
        }

        .support-note {
          margin-top: 14px;
          padding: 27px;
          border-radius: 9px;
          background: #0b2932;
          color: #c5d5d3;
        }

        .support-note h2 {
          margin: 0 0 7px;
          color: white;
          font-size: 24px;
          letter-spacing: -.03em;
        }

        .support-note p {
          margin: 0 0 20px;
          color: #aebfc0;
          font-size: 12px;
          line-height: 1.7;
          max-width: 650px;
        }

        .support-email {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 13px 18px;
          border-radius: 999px;
          background: #9cf4ca;
          color: #08191f;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          transition:
            transform .2s ease,
            background .2s ease;
        }

        .support-email:hover {
          background: white;
          transform: translateY(-1px);
        }

        .support-links {
          margin-top: 18px;
          padding: 18px 22px;
          border: 1px solid rgba(8,25,31,.13);
          border-radius: 9px;
          background: #e9eee8;
          color: #526a6d;
          font-size: 12px;
          line-height: 1.7;
        }

        .support-links a {
          color: #1b8268;
          font-weight: 700;
        }

        @media (max-width: 700px) {
          .support-wrap {
            padding: 52px 18px 72px;
          }

          .support-hero {
            grid-template-columns: 1fr;
            gap: 28px;
            padding-bottom: 38px;
          }

          .support-title {
            font-size: clamp(45px, 14vw, 62px);
          }

          .support-grid {
            grid-template-columns: 1fr;
          }

          .support-card {
            padding: 22px;
          }

          .support-note {
            padding: 22px;
          }

          .support-email {
            width: 100%;
          }
        }
      `}</style>

      <div className="support-wrap">
        <div className="support-hero">
          <div>
            <div className="support-eyebrow">AERO · SUPPORT</div>

            <h1 className="support-title">
              Get back
              <br />
              on course.
            </h1>

            <p className="support-lede">
              Having trouble? Start with the checks below. Aero keeps guest
              data on-device, so deleting the app can remove trips and
              attachments that were not synced.
            </p>
          </div>

          <div className="support-meta">
            Support desk
            <strong>Simple answers. No runaround.</strong>
          </div>
        </div>

        <div className="support-grid">
          {sections.map(([number, title, text]) => (
            <section className="support-card" key={number}>
              <span className="support-number">{number}</span>

              <h2>{title}</h2>

              <p>{text}</p>
            </section>
          ))}
        </div>

        <section className="support-note">
          <h2>Not fixed?</h2>

          <p>
            We're happy to help. Send us an email and tell us what happened,
            what you expected to happen, and which device or version of Aero
            you're using.
          </p>

          <a
            className="support-email"
            href="mailto:benjamingraetz@icloud.com?subject=Aero%20Support"
          >
            Email us <span>→</span>
          </a>
        </section>

        <div className="support-links">
          For account controls, open the{" "}
          <Link href="/account">Aero ID portal</Link>. Review{" "}
          <Link href="/privacy">Aero privacy</Link> for data handling and
          deletion details.
        </div>
      </div>
    </main>
  );
}