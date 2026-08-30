import { NextRequest, NextResponse } from "next/server";
import { deleteAccountAndRevokeApple } from "@/lib/accounts";
import { accountForRequest, clearSessionCookie, isTrustedMutation } from "@/lib/sessions";

export async function GET(request: NextRequest) {
  const account = await accountForRequest(request);
  return account
    ? NextResponse.json({ account })
    : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function DELETE(request: NextRequest) {
  if (!isTrustedMutation(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const account = await accountForRequest(request);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await deleteAccountAndRevokeApple(account.id);
    const response = NextResponse.json({ deleted: true });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error("Account deletion could not revoke Apple access", error);
    return NextResponse.json({ error: "Could not revoke Apple access. Please try again." }, { status: 503 });
  }
}
