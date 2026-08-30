import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { sha256 } from "@/lib/apple";
import { sql } from "@/lib/db";

export async function POST() {
  const rawNonce = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1_000);
  const rows = (await sql`
    INSERT INTO auth_challenges (nonce_hash, expires_at)
    VALUES (${sha256(rawNonce)}, ${expiresAt.toISOString()})
    RETURNING id
  `) as { id: string }[];
  return NextResponse.json({ challengeID: rows[0].id, rawNonce, expiresAt: expiresAt.toISOString() });
}
