import { NextRequest, NextResponse } from "next/server";
import { deleteAccountAndRevokeApple } from "@/lib/accounts";
import { env } from "@/lib/env";
import { accountForRequest, clearSessionCookie, isTrustedMutation } from "@/lib/sessions";

export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const account = await accountForRequest(request);
  if (account) {
    try {
      await deleteAccountAndRevokeApple(account.id);
    } catch (error) {
      console.error("Account deletion could not revoke Apple access", error);
      return NextResponse.redirect(`${env.appBaseURL}/account?error=apple_revocation_failed`, 303);
    }
  }
  const response = NextResponse.redirect(`${env.appBaseURL}/account`, 303);
  clearSessionCookie(response);
  return response;
}
