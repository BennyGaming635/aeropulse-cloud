import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { accountByID, type Account } from "@/lib/accounts";
import { sql } from "@/lib/db";
import { env } from "@/lib/env";

export const sessionCookieName = "aeropulse_session";
const sessionLifetimeSeconds = 60 * 60 * 24 * 30;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

type SessionMetadata = { deviceName: string; userAgent: string | null };

export type DeviceSession = {
  id: string;
  deviceName: string;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

export function sessionMetadata(request: NextRequest, suppliedName?: string): SessionMetadata {
  const userAgent = request.headers.get("user-agent");
  const trimmedName = suppliedName?.trim().slice(0, 120);
  if (trimmedName) return { deviceName: trimmedName, userAgent };
  if (!userAgent) return { deviceName: "Web browser", userAgent: null };
  const browser = userAgent.includes("Edg/") ? "Edge"
    : userAgent.includes("Chrome/") ? "Chrome"
    : userAgent.includes("Firefox/") ? "Firefox"
    : userAgent.includes("Safari/") ? "Safari"
    : "Web browser";
  const platform = userAgent.includes("iPhone") ? "iPhone"
    : userAgent.includes("iPad") ? "iPad"
    : userAgent.includes("Macintosh") ? "Mac"
    : userAgent.includes("Windows") ? "Windows PC"
    : userAgent.includes("Android") ? "Android device"
    : "device";
  return { deviceName: `${browser} on ${platform}`, userAgent };
}

export async function createSession(userID: string, metadata: SessionMetadata) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionLifetimeSeconds * 1_000);
  await sql`
    INSERT INTO sessions (token_hash, user_id, device_name, user_agent, expires_at)
    VALUES (
      ${hashToken(token)}, ${userID}, ${metadata.deviceName}, ${metadata.userAgent}, ${expiresAt.toISOString()}
    )
  `;
  return { token, expiresAt };
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    secure: env.appBaseURL.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    secure: env.appBaseURL.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

export async function deleteSession(token: string | null) {
  if (!token) return;
  await sql`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
}

async function accountForToken(token: string | null): Promise<Account | null> {
  if (!token) return null;
  const rows = (await sql`
    UPDATE sessions SET last_seen_at = NOW()
    WHERE token_hash = ${hashToken(token)} AND expires_at > NOW()
    RETURNING user_id
  `) as { user_id: string }[];
  return rows[0] ? accountByID(rows[0].user_id) : null;
}

export async function sessionsForUser(userID: string, currentToken: string | null): Promise<DeviceSession[]> {
  const currentHash = currentToken ? hashToken(currentToken) : "";
  const rows = (await sql`
    SELECT id, device_name, user_agent, created_at, last_seen_at, expires_at,
      token_hash = ${currentHash} AS is_current
    FROM sessions
    WHERE user_id = ${userID} AND expires_at > NOW()
    ORDER BY last_seen_at DESC
  `) as Array<{
    id: string;
    device_name: string;
    user_agent: string | null;
    created_at: string | Date;
    last_seen_at: string | Date;
    expires_at: string | Date;
    is_current: boolean;
  }>;
  return rows.map((row) => ({
    id: row.id,
    deviceName: row.device_name,
    userAgent: row.user_agent,
    createdAt: (row.created_at instanceof Date ? row.created_at : new Date(row.created_at)).toISOString(),
    lastSeenAt: (row.last_seen_at instanceof Date ? row.last_seen_at : new Date(row.last_seen_at)).toISOString(),
    expiresAt: (row.expires_at instanceof Date ? row.expires_at : new Date(row.expires_at)).toISOString(),
    isCurrent: row.is_current,
  }));
}

export async function revokeDeviceSession(userID: string, sessionID: string, currentToken: string | null) {
  const rows = (await sql`
    DELETE FROM sessions WHERE id = ${sessionID} AND user_id = ${userID}
    RETURNING token_hash
  `) as Array<{ token_hash: string }>;
  if (!rows[0]) return { found: false, revokedCurrent: false };
  return {
    found: true,
    revokedCurrent: currentToken ? rows[0].token_hash === hashToken(currentToken) : false,
  };
}

export async function accountForRequest(request: NextRequest): Promise<Account | null> {
  const authorization = request.headers.get("authorization");
  const bearer = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
  return accountForToken(bearer || request.cookies.get(sessionCookieName)?.value || null);
}

export async function accountForPage(): Promise<Account | null> {
  const cookieStore = await cookies();
  return accountForToken(cookieStore.get(sessionCookieName)?.value || null);
}

export function tokenForRequest(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7).trim();
  return request.cookies.get(sessionCookieName)?.value || null;
}

export function isTrustedMutation(request: NextRequest): boolean {
  if (request.headers.get("authorization")?.startsWith("Bearer ")) return true;
  return request.headers.get("origin") === env.appBaseURL;
}
