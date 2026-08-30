import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { clearSessionCookie, deleteSession, isTrustedMutation, tokenForRequest } from "@/lib/sessions";

export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  await deleteSession(tokenForRequest(request));
  if (request.headers.get("authorization")?.startsWith("Bearer ")) {
    return NextResponse.json({ signedOut: true });
  }
  const response = NextResponse.redirect(`${env.appBaseURL}/account`, 303);
  clearSessionCookie(response);
  return response;
}
