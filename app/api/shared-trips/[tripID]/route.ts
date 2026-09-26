import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateSharedTrip, deleteSharedTrip } from "@/lib/shared-trips";
import { accountForRequest, isTrustedMutation } from "@/lib/sessions";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use an ISO date").refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, "Use a valid date");
const updateSchema = z.object({
  baseVersion: z.number().int().positive(),
  name: z.string().trim().min(1, "Enter a trip name").max(120).optional(),
  startDate: dateSchema.nullable().optional(),
  endDate: dateSchema.nullable().optional(),
}).refine((value) => [value.name, value.startDate, value.endDate].some((field) => field !== undefined), {
  message: "Include a trip field to update",
}).refine((value) => !value.startDate || !value.endDate || value.endDate >= value.startDate, {
  message: "End date must be on or after the start date",
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ tripID: string }> }) {
  if (!isTrustedMutation(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const account = await accountForRequest(request);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { tripID } = await context.params;
    z.string().uuid().parse(tripID);
    const { baseVersion, ...input } = updateSchema.parse(await request.json());
    const result = await updateSharedTrip(account.id, tripID, baseVersion, input);
    if (result.status === "conflict") {
      return NextResponse.json({ error: "Trip version conflict", currentVersion: result.currentVersion }, { status: 409 });
    }
    if (result.status === "forbidden") return NextResponse.json({ error: "Only the trip owner can update it" }, { status: 403 });
    return NextResponse.json({ updated: true, version: result.version, updatedAt: result.updatedAt });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    if ((error as { code?: string }).code === "23514") {
      return NextResponse.json({ error: "Trip dates are not valid" }, { status: 400 });
    }
    console.error("Shared trip update failed", error);
    return NextResponse.json({ error: "Could not update this shared trip" }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ tripID: string }> }) {
  if (!isTrustedMutation(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const account = await accountForRequest(request);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { tripID } = await context.params;
    z.string().uuid().parse(tripID);
    if (!await deleteSharedTrip(account.id, tripID)) {
      return NextResponse.json({ error: "Trip not found or you are not its owner" }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid trip ID" }, { status: 400 });
    console.error("Shared trip deletion failed", error);
    return NextResponse.json({ error: "Could not delete this shared trip" }, { status: 503 });
  }
}
