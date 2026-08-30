import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AeroPulse Cloud",
  description: "Carry your flights, preferences, and journey history across AeroPulse devices.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link className="brand" href="/">
            <span className="brand-mark">AP</span>
            <span>AeroPulse Cloud</span>
          </Link>
          <nav>
            <Link href="/docs">API</Link>
            <Link className="nav-account" href="/account">Account</Link>
          </nav>
        </header>
        {children}
        <footer>
          <span>AeroPulse Cloud</span>
          <span>Your journey, ready on your next device.</span>
        </footer>
      </body>
    </html>
  );
}
