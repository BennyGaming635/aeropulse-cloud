import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  accountForRequest,
  clearSessionCookie,
  isTrustedMutation,
  revokeDeviceSession,
  sessionsForUser,
  tokenForRequest,
} from "@/lib/sessions";

const revokeSchema = z.object({ sessionID: z.string().uuid() });

export async function GET(request: NextRequest) {
  const account = await accountForRequest(request);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessions = await sessionsForUser(account.id, tokenForRequest(request));
  return NextResponse.json({ sessions });
}

export async function DELETE(request: NextRequest) {
  if (!isTrustedMutation(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const account = await accountForRequest(request);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const input = revokeSchema.parse(await request.json());
    const result = await revokeDeviceSession(account.id, input.sessionID, tokenForRequest(request));
    if (!result.found) return NextResponse.json({ error: "Device session not found" }, { status: 404 });
    const response = NextResponse.json({ revoked: true, revokedCurrent: result.revokedCurrent });
    if (result.revokedCurrent) clearSessionCookie(response);
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid device session" }, { status: 400 });
    console.error("Device session revocation failed", error);
    return NextResponse.json({ error: "Could not revoke this device" }, { status: 503 });
  }
}
