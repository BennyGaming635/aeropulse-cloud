import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Aero | Account and sync",
    template: "%s | Aero",
  },
  description: "Carry your flights, preferences, and journey history across Aero devices with Aero ID.",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: "#08191f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <header className="site-header">
          <div className="header-inner">
            <Link aria-label="Aero home" className="brand" href="/">
              <span aria-hidden="true" className="brand-mark"><i /><i /><i /></span>
              <span><strong>Aero</strong><small>Account &amp; sync</small></span>
            </Link>
            <nav aria-label="Primary navigation">
              <span className="network-status"><i aria-hidden="true" /> Systems online</span>
              <Link className="nav-account" href="/account">Account <span aria-hidden="true">↗</span></Link>
            </nav>
          </div>
        </header>
        {children}
        <footer aria-label="Aero footer">
          <div className="footer-inner">
            <span className="footer-brand">Aero</span>
            <span>Your journey, ready on your next device.</span>
            <span><Link href="/support">Support</Link> / <Link href="/privacy">Privacy</Link></span>
          </div>
        </footer>
      </body>
    </html>
  );
}
