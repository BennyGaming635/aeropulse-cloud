import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { sha256 } from "@/lib/apple";
import { env } from "@/lib/env";

export function GET(request: Request) {
  if (new URL(request.url).origin !== env.appBaseURL) {
    return NextResponse.redirect(`${env.appBaseURL}/api/auth/apple/start`);
  }
  const state = randomBytes(24).toString("base64url");
  const rawNonce = randomBytes(24).toString("base64url");
  const url = new URL("https://appleid.apple.com/auth/authorize");
  url.searchParams.set("client_id", env.appleWebClientID);
  url.searchParams.set("redirect_uri", env.appleWebRedirectURI);
  url.searchParams.set("response_type", "code id_token");
  url.searchParams.set("response_mode", "form_post");
  url.searchParams.set("scope", "name email");
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", sha256(rawNonce));

  const response = NextResponse.redirect(url);
  const options = { httpOnly: true, secure: true, sameSite: "none" as const, maxAge: 600, path: "/" };
  response.cookies.set("apple_oauth_state", state, options);
  response.cookies.set("apple_oauth_nonce", rawNonce, options);
  return response;
}
