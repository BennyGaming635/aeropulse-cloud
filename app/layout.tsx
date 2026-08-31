import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aero | Account and sync",
  description: "Carry your flights, preferences, and journey history across Aero devices with Aero ID.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="header-inner">
            <Link className="brand" href="/">
              <span className="brand-mark"><i /><i /><i /></span>
              <span><strong>Aero</strong><small>Account &amp; sync</small></span>
            </Link>
            <nav>
              <span className="network-status"><i /> Systems online</span>
              <Link className="nav-account" href="/account">Account <span>↗</span></Link>
            </nav>
          </div>
        </header>
        {children}
        <footer>
          <div className="footer-inner">
            <span className="footer-brand">Aero</span>
            <span>Your journey, ready on your next device.</span>
            <span>Private by design</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
