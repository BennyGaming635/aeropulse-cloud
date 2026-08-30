"use client";

import { useEffect, useState } from "react";

const providers = [
  { id: "airLabs", name: "AirLabs", primary: "API access key" },
  { id: "aviationstack", name: "Aviationstack", primary: "API access key" },
  { id: "aeroDataBox", name: "AeroDataBox", primary: "RapidAPI key" },
  { id: "lufthansa", name: "Lufthansa Open API", primary: "Client ID", secondary: "Client secret" },
] as const;

type ProviderID = typeof providers[number]["id"];
type Draft = { primary: string; secondary: string };
type Drafts = Record<ProviderID, Draft>;

const emptyDrafts: Drafts = {
  airLabs: { primary: "", secondary: "" },
  aviationstack: { primary: "", secondary: "" },
  aeroDataBox: { primary: "", secondary: "" },
  lufthansa: { primary: "", secondary: "" },
};

export default function APIKeysPanel() {
  const [drafts, setDrafts] = useState<Drafts>(emptyDrafts);
  const [saved, setSaved] = useState<Set<ProviderID>>(new Set());
  const [busy, setBusy] = useState<ProviderID | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [versions, setVersions] = useState<Record<ProviderID, number>>({ airLabs: 0, aviationstack: 0, aeroDataBox: 0, lufthansa: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/provider-credentials")
      .then(async (response) => {
        const result = await response.json() as {
          credentials?: Array<{
            providerID: ProviderID;
            primary: string;
            secondary: string;
            version: number;
            isDeleted: boolean;
          }>;
          error?: string;
        };
        if (!response.ok) throw new Error(result.error || "Could not load API keys");
        const next = { ...emptyDrafts };
        const connected = new Set<ProviderID>();
        const nextVersions = { airLabs: 0, aviationstack: 0, aeroDataBox: 0, lufthansa: 0 };
        for (const credential of result.credentials || []) {
          if (!credential.isDeleted) {
            next[credential.providerID] = { primary: credential.primary, secondary: credential.secondary };
            connected.add(credential.providerID);
          }
          nextVersions[credential.providerID] = credential.version;
        }
        setDrafts(next);
        setSaved(connected);
        setVersions(nextVersions);
      })
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setIsLoading(false));
  }, []);

  function update(providerID: ProviderID, field: keyof Draft, value: string) {
    setDrafts((current) => ({ ...current, [providerID]: { ...current[providerID], [field]: value } }));
  }

  async function save(providerID: ProviderID) {
    setBusy(providerID);
    setMessage(null);
    try {
      const response = await fetch("/api/provider-credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerID, ...drafts[providerID], baseVersion: versions[providerID] }),
      });
      const result = await response.json() as { error?: string; version?: number; currentVersion?: number };
      if (response.status === 409 && result.currentVersion !== undefined) {
        setVersions((current) => ({ ...current, [providerID]: result.currentVersion! }));
      }
      if (!response.ok) throw new Error(result.error || "Could not save API key");
      setSaved((current) => new Set(current).add(providerID));
      setVersions((current) => ({ ...current, [providerID]: result.version || current[providerID] }));
      setMessage("API key saved and ready to sync.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save API key");
    } finally {
      setBusy(null);
    }
  }

  async function remove(providerID: ProviderID) {
    setBusy(providerID);
    setMessage(null);
    try {
      const response = await fetch("/api/provider-credentials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerID, baseVersion: versions[providerID] }),
      });
      const result = await response.json() as { error?: string; version?: number; currentVersion?: number };
      if (response.status === 409 && result.currentVersion !== undefined) {
        setVersions((current) => ({ ...current, [providerID]: result.currentVersion! }));
      }
      if (!response.ok) throw new Error(result.error || "Could not remove API key");
      setDrafts((current) => ({ ...current, [providerID]: { primary: "", secondary: "" } }));
      setSaved((current) => {
        const next = new Set(current);
        next.delete(providerID);
        return next;
      });
      setVersions((current) => ({ ...current, [providerID]: result.version || current[providerID] }));
      setMessage("API key removed from AeroPulse Cloud.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove API key");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="keys-card">
      <div className="keys-heading">
        <div><p className="eyebrow">FLIGHT DATA SOURCES</p><h2>Synced API keys</h2></div>
        <span>Encrypted at rest</span>
      </div>
      <p className="keys-intro">Manage the same provider credentials used by AeroPulse on your devices.</p>
      <div className="provider-list">
        {providers.map((provider) => (
          <article className="provider-editor" key={provider.id}>
            <div className="provider-title">
              <strong>{provider.name}</strong>
              <span className={saved.has(provider.id) ? "connected" : ""}>{saved.has(provider.id) ? "Connected" : "Not connected"}</span>
            </div>
            <label>{provider.primary}<input autoComplete="off" disabled={isLoading} type="password" value={drafts[provider.id].primary} onChange={(event) => update(provider.id, "primary", event.target.value)} /></label>
            {"secondary" in provider && (
              <label>{provider.secondary}<input autoComplete="off" disabled={isLoading} type="password" value={drafts[provider.id].secondary} onChange={(event) => update(provider.id, "secondary", event.target.value)} /></label>
            )}
            <div className="provider-actions">
              <button disabled={isLoading || busy === provider.id || !drafts[provider.id].primary.trim()} onClick={() => save(provider.id)}>Save</button>
              {saved.has(provider.id) && <button className="remove-key" disabled={busy === provider.id} onClick={() => remove(provider.id)}>Remove</button>}
            </div>
          </article>
        ))}
      </div>
      {message && <p className="key-message" role="status">{message}</p>}
    </section>
  );
}
