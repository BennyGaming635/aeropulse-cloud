import { NextRequest, NextResponse } from "next/server";
import { deleteAccount } from "@/lib/accounts";
import { env } from "@/lib/env";
import { accountForRequest, clearSessionCookie, isTrustedMutation } from "@/lib/sessions";

export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const account = await accountForRequest(request);
  if (account) {
    try {
      await deleteAccount(account.id);
    } catch (error) {
      console.error("Account deletion failed", error);
      return NextResponse.redirect(`${env.appBaseURL}/account?error=account_deletion_failed`, 303);
    }
  }
  const response = NextResponse.redirect(`${env.appBaseURL}/account`, 303);
  clearSessionCookie(response);
  return response;
}
