import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { removeSharedTripMembership } from "@/lib/shared-trips";
import { accountForRequest, isTrustedMutation } from "@/lib/sessions";

const removeSchema = z.object({ membershipID: z.string().uuid() });

export async function DELETE(request: NextRequest, context: { params: Promise<{ tripID: string }> }) {
  if (!isTrustedMutation(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const account = await accountForRequest(request);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { tripID } = await context.params;
    z.string().uuid().parse(tripID);
    const input = removeSchema.parse(await request.json());
    const result = await removeSharedTripMembership(account.id, tripID, input.membershipID);
    if (!result.removed) {
      return NextResponse.json({ error: "Membership cannot be removed; owners cannot leave their trip" }, { status: 403 });
    }
    return NextResponse.json({ removed: true, leftTrip: result.leftTrip });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid membership" }, { status: 400 });
    console.error("Shared trip membership removal failed", error);
    return NextResponse.json({ error: "Could not remove this membership" }, { status: 503 });
  }
}
