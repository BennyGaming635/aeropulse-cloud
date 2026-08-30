"use client";

import { useEffect, useState } from "react";

type DeviceSession = {
  id: string;
  deviceName: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

function deviceKind(name: string): string {
  const value = name.toLowerCase();
  if (value.includes("iphone")) return "phone";
  if (value.includes("ipad")) return "tablet";
  if (value.includes("mac")) return "laptop";
  return "browser";
}

function lastSeen(value: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 2) return "Active now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return new Date(value).toLocaleDateString("en", { dateStyle: "medium" });
}

export default function DevicesPanel() {
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const response = await fetch("/api/sessions", { cache: "no-store" });
      const result = await response.json() as { sessions?: DeviceSession[]; error?: string };
      if (!response.ok) throw new Error(result.error || "Could not load devices");
      setSessions(result.sessions || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load devices");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function revoke(sessionID: string) {
    setRevoking(sessionID);
    setError(null);
    try {
      const response = await fetch("/api/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionID }),
      });
      const result = await response.json() as { error?: string; revokedCurrent?: boolean };
      if (!response.ok) throw new Error(result.error || "Could not revoke device");
      if (result.revokedCurrent) window.location.assign("/account");
      else setSessions((current) => current.filter((session) => session.id !== sessionID));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not revoke device");
    } finally {
      setRevoking(null);
    }
  }

  return (
    <section className="devices-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ACCESS CONTROL</p>
          <h2>Your devices</h2>
        </div>
        <span className="count-chip">{sessions.length || 0} active</span>
      </div>
      <p className="section-intro">Revoke any device you no longer recognize or use.</p>
      <div className="device-list">
        {isLoading && <div className="device-skeleton">Checking active sessions...</div>}
        {!isLoading && sessions.map((session) => (
          <article className="device-row" key={session.id}>
            <span className={`device-icon ${deviceKind(session.deviceName)}`} aria-hidden="true"><i /></span>
            <div className="device-copy">
              <strong>{session.deviceName}</strong>
              <span>{lastSeen(session.lastSeenAt)} · Added {new Date(session.createdAt).toLocaleDateString("en", { dateStyle: "medium" })}</span>
            </div>
            {session.isCurrent ? (
              <span className="current-device">This device</span>
            ) : (
              <button className="revoke-button" disabled={revoking === session.id} onClick={() => revoke(session.id)}>
                {revoking === session.id ? "Revoking" : "Revoke"}
              </button>
            )}
          </article>
        ))}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
  );
}
