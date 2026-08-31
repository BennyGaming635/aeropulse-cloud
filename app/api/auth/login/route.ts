import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AccountError, authenticatePasswordAccount } from "@/lib/accounts";
import { env } from "@/lib/env";
import { createSession, sessionMetadata, setSessionCookie } from "@/lib/sessions";
import { enforceAuthRateLimit, RateLimitError } from "@/lib/rate-limit";

const bodySchema = z.object({
  username: z.string().trim().min(1).max(24),
  password: z.string().min(1).max(128),
  deviceName: z.string().trim().max(120).optional(),
});

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== env.appBaseURL) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }
  let input: z.infer<typeof bodySchema>;
  try {
    input = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Enter your username and password" }, { status: 400 });
  }
  try {
    await enforceAuthRateLimit(request, input.username);
    const account = await authenticatePasswordAccount(input.username, input.password);
    const session = await createSession(account.id, sessionMetadata(request, input.deviceName));
    const isNative = request.headers.get("x-aeropulse-client") === "ios";
    const response = NextResponse.json({
      account,
      ...(isNative ? { sessionToken: session.token } : {}),
      expiresAt: session.expiresAt.toISOString(),
    });
    setSessionCookie(response, session.token, session.expiresAt);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    if (error instanceof AccountError) {
      return NextResponse.json({ error: "Incorrect username or password" }, { status: 401 });
    }
    console.error("Account login failed", error);
    return NextResponse.json({ error: "Aero is temporarily unavailable" }, { status: 503 });
  }
}
