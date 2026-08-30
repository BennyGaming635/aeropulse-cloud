import { NextRequest, NextResponse } from "next/server";
import {
  exchangeAppleAuthorizationCode,
  revokeAppleRefreshToken,
  verifyAppleIdentityToken,
} from "@/lib/apple";
import { upsertAppleAccount } from "@/lib/accounts";
import { env } from "@/lib/env";
import { createSession, setSessionCookie } from "@/lib/sessions";
import { z } from "zod";

const appleUserSchema = z.object({
  name: z.object({
    firstName: z.string().max(50).optional(),
    lastName: z.string().max(50).optional(),
  }).optional(),
}).passthrough();

export async function POST(request: NextRequest) {
  let issuedRefreshToken: string | undefined;
  try {
    const form = await request.formData();
    const state = String(form.get("state") || "");
    const identityToken = String(form.get("id_token") || "");
    const authorizationCode = String(form.get("code") || "");
    const expectedState = request.cookies.get("apple_oauth_state")?.value;
    const rawNonce = request.cookies.get("apple_oauth_nonce")?.value;
    if (!state || state !== expectedState || !identityToken || !authorizationCode || !rawNonce) {
      return NextResponse.redirect(`${env.appBaseURL}/account?error=invalid_apple_response`, 303);
    }

    const token = await verifyAppleIdentityToken(identityToken, env.appleWebClientID, rawNonce);
    const appleTokens = await exchangeAppleAuthorizationCode(
      authorizationCode,
      env.appleWebClientID,
      env.appleWebRedirectURI,
    );
    issuedRefreshToken = appleTokens.refresh_token;
    const exchangedIdentity = await verifyAppleIdentityToken(
      appleTokens.id_token,
      env.appleWebClientID,
      rawNonce,
    );
    if (exchangedIdentity.sub !== token.sub) throw new Error("Apple authorization identities did not match");
    let suppliedUser: z.infer<typeof appleUserSchema> | null = null;
    const userJSON = form.get("user");
    if (typeof userJSON === "string" && userJSON) {
      suppliedUser = appleUserSchema.parse(JSON.parse(userJSON));
    }
    const displayName = [suppliedUser?.name?.firstName, suppliedUser?.name?.lastName].filter(Boolean).join(" ") || null;
    const account = await upsertAppleAccount({
      appleSubject: token.sub!,
      email: typeof token.email === "string" ? token.email : null,
      displayName,
      appleRefreshToken: appleTokens.refresh_token,
      appleClientID: env.appleWebClientID,
    });
    const session = await createSession(account.id);
    const response = NextResponse.redirect(`${env.appBaseURL}/account`, 303);
    setSessionCookie(response, session.token, session.expiresAt);
    response.cookies.delete("apple_oauth_state");
    response.cookies.delete("apple_oauth_nonce");
    return response;
  } catch (error) {
    console.error("Web Apple sign-in failed", error);
    if (issuedRefreshToken) {
      try { await revokeAppleRefreshToken(issuedRefreshToken, env.appleWebClientID); } catch {}
    }
    return NextResponse.redirect(`${env.appBaseURL}/account?error=apple_sign_in_failed`, 303);
  }
}
