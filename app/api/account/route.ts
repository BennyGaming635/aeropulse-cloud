import { NextRequest, NextResponse } from "next/server";
import { deleteAccount } from "@/lib/accounts";
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
    await deleteAccount(account.id);
    const response = NextResponse.json({ deleted: true });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error("Account deletion failed", error);
    return NextResponse.json({ error: "Could not delete your account. Please try again." }, { status: 503 });
  }
}
