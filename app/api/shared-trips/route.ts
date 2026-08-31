import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSharedTrip, sharedTripsForUser } from "@/lib/shared-trips";
import { accountForRequest, isTrustedMutation } from "@/lib/sessions";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use an ISO date").refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, "Use a valid date");
const createSchema = z.object({
  name: z.string().trim().min(1, "Enter a trip name").max(120),
  startDate: dateSchema.optional().nullable(),
  endDate: dateSchema.optional().nullable(),
}).refine((value) => !value.startDate || !value.endDate || value.endDate >= value.startDate, {
  message: "End date must be on or after the start date",
});

export async function GET(request: NextRequest) {
  const account = await accountForRequest(request);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const response = NextResponse.json({ trips: await sharedTripsForUser(account.id) });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Shared trip read failed", error);
    return NextResponse.json({ error: "Could not load shared trips" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const account = await accountForRequest(request);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const input = createSchema.parse(await request.json());
    return NextResponse.json({ trip: await createSharedTrip(account.id, input) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    console.error("Shared trip creation failed", error);
    return NextResponse.json({ error: "Could not create this shared trip" }, { status: 503 });
  }
}
