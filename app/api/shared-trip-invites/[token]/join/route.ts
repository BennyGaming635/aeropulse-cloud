import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { joinSharedTripInvite } from "@/lib/shared-trips";
import { accountForRequest, isTrustedMutation } from "@/lib/sessions";

export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  if (!isTrustedMutation(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const account = await accountForRequest(request);
  if (!account) return NextResponse.json({ error: "Sign in with your Aero ID to join" }, { status: 401 });
  try {
    const { token } = await context.params;
    z.string().min(20).max(100).regex(/^[A-Za-z0-9_-]+$/).parse(token);
    const result = await joinSharedTripInvite(account.id, token);
    if (!result) return NextResponse.json({ error: "This invite is invalid, expired, or full" }, { status: 410 });
    return NextResponse.json({ joined: result.joined, alreadyMember: !result.joined, tripID: result.tripID });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
    console.error("Shared trip join failed", error);
    return NextResponse.json({ error: "Could not join this shared trip" }, { status: 503 });
  }
}
