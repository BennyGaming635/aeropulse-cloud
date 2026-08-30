import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { upsertAppleAccount } from "@/lib/accounts";
import {
  exchangeAppleAuthorizationCode,
  revokeAppleRefreshToken,
  sha256,
  verifyAppleIdentityToken,
} from "@/lib/apple";
import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import { createSession } from "@/lib/sessions";

const requestSchema = z.object({
  identityToken: z.string().min(100).max(20_000),
  authorizationCode: z.string().min(20).max(10_000),
  challengeID: z.string().uuid(),
  rawNonce: z.string().min(16).max(256),
  displayName: z.string().trim().min(1).max(100).optional(),
});

export async function POST(request: NextRequest) {
  let input: z.infer<typeof requestSchema>;
  try {
    input = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid native authorization request" }, { status: 400 });
  }

  let token: Awaited<ReturnType<typeof verifyAppleIdentityToken>>;
  try {
    token = await verifyAppleIdentityToken(input.identityToken, env.appleNativeClientID, input.rawNonce);
  } catch {
    return NextResponse.json({ error: "Apple authorization could not be verified" }, { status: 401 });
  }

  try {
    const consumed = (await sql`
      DELETE FROM auth_challenges
      WHERE id = ${input.challengeID}
        AND nonce_hash = ${sha256(input.rawNonce)}
        AND expires_at > NOW()
      RETURNING id
    `) as { id: string }[];
    if (!consumed[0]) {
      return NextResponse.json({ error: "Apple sign-in challenge expired or was already used" }, { status: 401 });
    }
  } catch (error) {
    console.error("Apple sign-in challenge validation failed", error);
    return NextResponse.json({ error: "AeroPulse Cloud is temporarily unavailable" }, { status: 503 });
  }

  let appleTokens: Awaited<ReturnType<typeof exchangeAppleAuthorizationCode>>;
  try {
    appleTokens = await exchangeAppleAuthorizationCode(input.authorizationCode, env.appleNativeClientID);
    const exchangedIdentity = await verifyAppleIdentityToken(
      appleTokens.id_token,
      env.appleNativeClientID,
      input.rawNonce,
    );
    if (exchangedIdentity.sub !== token.sub) throw new Error("Apple authorization identities did not match");
  } catch {
    return NextResponse.json({ error: "Apple authorization could not be verified" }, { status: 401 });
  }

  try {
    const account = await upsertAppleAccount({
      appleSubject: token.sub!,
      email: typeof token.email === "string" ? token.email : null,
      displayName: input.displayName,
      appleRefreshToken: appleTokens.refresh_token,
      appleClientID: env.appleNativeClientID,
    });
    const session = await createSession(account.id);
    return NextResponse.json({
      account,
      sessionToken: session.token,
      expiresAt: session.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Native Apple account creation failed", error);
    if (appleTokens.refresh_token) {
      try { await revokeAppleRefreshToken(appleTokens.refresh_token, env.appleNativeClientID); } catch {}
    }
    return NextResponse.json({ error: "AeroPulse Cloud is temporarily unavailable" }, { status: 503 });
  }
}
