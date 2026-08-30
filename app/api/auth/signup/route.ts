import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AccountError, createPasswordAccount, deleteAccount } from "@/lib/accounts";
import { env } from "@/lib/env";
import { isValidUsername } from "@/lib/passwords";
import { createSession, setSessionCookie } from "@/lib/sessions";
import { enforceAuthRateLimit, RateLimitError } from "@/lib/rate-limit";

const bodySchema = z.object({
  username: z.string().trim().refine(isValidUsername, "Use 3-24 letters, numbers, or underscores"),
  password: z.string().min(10).max(128),
  displayName: z.string().trim().max(100).optional(),
});

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== env.appBaseURL) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }
  let input: z.infer<typeof bodySchema>;
  try {
    input = bodySchema.parse(await request.json());
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : "Invalid account details";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  try {
    await enforceAuthRateLimit(request, input.username);
    const account = await createPasswordAccount(input);
    let session: Awaited<ReturnType<typeof createSession>>;
    try {
      session = await createSession(account.id);
    } catch (error) {
      await deleteAccount(account.id);
      throw error;
    }
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
    if (error instanceof AccountError && error.code === "username_taken") {
      return NextResponse.json({ error: "That username is already taken" }, { status: 409 });
    }
    console.error("Account creation failed", error);
    return NextResponse.json({ error: "AeroPulse Cloud is temporarily unavailable" }, { status: 503 });
  }
}
