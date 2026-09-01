"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPanel({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(isCreating ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, displayName: displayName || undefined }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Account request failed");
      if (nextPath) router.push(nextPath);
      else router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Account request failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div aria-label="Account action" className="auth-tabs" role="group">
        <button aria-pressed={!isCreating} className={!isCreating ? "active" : ""} type="button" onClick={() => { setIsCreating(false); setError(null); }}>Sign in</button>
        <button aria-pressed={isCreating} className={isCreating ? "active" : ""} type="button" onClick={() => { setIsCreating(true); setError(null); }}>Create account</button>
      </div>
      <form aria-busy={isSubmitting} className="auth-form" onSubmit={submit}>
        {isCreating && (
          <label>
            Display name <span>optional</span>
            <input autoComplete="name" maxLength={100} name="displayName" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </label>
        )}
        <label>
          Username
          <input
            autoCapitalize="none"
            autoComplete="username"
            maxLength={24}
            minLength={3}
            name="username"
            pattern="[A-Za-z0-9_]+"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            aria-describedby={isCreating ? "account-requirements" : undefined}
            autoComplete={isCreating ? "new-password" : "current-password"}
            minLength={isCreating ? 10 : 1}
            maxLength={128}
            name="password"
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {isCreating && <p className="field-hint" id="account-requirements">At least 10 characters. Usernames use letters, numbers, and underscores.</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="auth-submit" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Please wait..." : isCreating ? "Create Aero ID" : "Sign in"}
        </button>
      </form>
    </>
  );
}
