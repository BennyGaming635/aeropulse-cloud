import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addSharedFlight, removeSharedFlight } from "@/lib/shared-trips";
import { accountForRequest, isTrustedMutation } from "@/lib/sessions";

import { sharedFlightSchema as flightSchema } from "@/lib/shared-flight-content";

const deleteSchema = z.object({ flightID: z.string().uuid() });

export async function POST(request: NextRequest, context: { params: Promise<{ tripID: string }> }) {
  if (!isTrustedMutation(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const account = await accountForRequest(request);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { tripID } = await context.params;
    z.string().uuid().parse(tripID);
    const flight = await addSharedFlight(account.id, tripID, flightSchema.parse(await request.json()));
    if (!flight) return NextResponse.json({ error: "Shared trip not found" }, { status: 404 });
    return NextResponse.json({ flight }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "You already shared this flight. Remove your existing share before choosing different contents." }, { status: 409 });
    }
    if ((error as { code?: string }).code === "23514") {
      return NextResponse.json({ error: "Flight schedule is not valid" }, { status: 400 });
    }
    console.error("Shared flight creation failed", error);
    return NextResponse.json({ error: "Could not share this flight" }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ tripID: string }> }) {
  if (!isTrustedMutation(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const account = await accountForRequest(request);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { tripID } = await context.params;
    z.string().uuid().parse(tripID);
    const input = deleteSchema.parse(await request.json());
    if (!await removeSharedFlight(account.id, tripID, input.flightID)) {
      return NextResponse.json({ error: "Flight not found or cannot be removed" }, { status: 404 });
    }
    return NextResponse.json({ removed: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid shared flight" }, { status: 400 });
    console.error("Shared flight removal failed", error);
    return NextResponse.json({ error: "Could not remove this shared flight" }, { status: 503 });
  }
}
