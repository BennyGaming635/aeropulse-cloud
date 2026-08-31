import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSharedTripInvite } from "@/lib/shared-trips";
import { accountForRequest, isTrustedMutation } from "@/lib/sessions";

const inviteSchema = z.object({
  expiresInHours: z.number().int().min(1).max(168).default(72),
  maxUses: z.number().int().min(1).max(50).default(25),
});

export async function POST(request: NextRequest, context: { params: Promise<{ tripID: string }> }) {
  if (!isTrustedMutation(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const account = await accountForRequest(request);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { tripID } = await context.params;
    z.string().uuid().parse(tripID);
    const input = inviteSchema.parse(await request.json());
    const invite = await createSharedTripInvite(account.id, tripID, input.expiresInHours, input.maxUses);
    if (!invite) return NextResponse.json({ error: "Only the trip owner can create invites" }, { status: 403 });
    return NextResponse.json({ invite }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    console.error("Shared trip invite creation failed", error);
    return NextResponse.json({ error: "Could not create an invite" }, { status: 503 });
  }
}
