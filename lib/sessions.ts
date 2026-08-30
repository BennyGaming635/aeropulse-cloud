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

export async function createSession(userID: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionLifetimeSeconds * 1_000);
  await sql`
    INSERT INTO sessions (token_hash, user_id, expires_at)
    VALUES (${hashToken(token)}, ${userID}, ${expiresAt.toISOString()})
  `;
  return { token, expiresAt };
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    secure: true,
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
    SELECT user_id FROM sessions
    WHERE token_hash = ${hashToken(token)} AND expires_at > NOW()
    LIMIT 1
  `) as { user_id: string }[];
  return rows[0] ? accountByID(rows[0].user_id) : null;
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
