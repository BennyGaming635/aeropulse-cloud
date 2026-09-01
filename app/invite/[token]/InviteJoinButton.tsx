"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InviteJoinButton({ token }: { token: string }) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setJoining(true);
    setError(null);
    try {
      const response = await fetch(`/api/shared-trip-invites/${encodeURIComponent(token)}/join`, { method: "POST" });
      const result = await response.json() as { error?: string; tripID?: string };
      if (!response.ok || !result.tripID) throw new Error(result.error || "Could not join this shared trip");
      router.push(`/account?trip=${encodeURIComponent(result.tripID)}#shared-trips`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not join this shared trip");
      setJoining(false);
    }
  }

  return (
    <div aria-busy={joining} className="invite-action">
      <button className="button primary" disabled={joining} onClick={join} type="button">{joining ? "Joining trip..." : "Join shared trip"}</button>
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}
