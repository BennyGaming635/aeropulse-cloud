import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

export class RateLimitError extends Error {}

function keyHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function consume(key: string, maximum: number, windowSeconds: number) {
  const rows = (await sql`
    INSERT INTO auth_rate_limits (key_hash, window_start, attempts)
    VALUES (${keyHash(key)}, NOW(), 1)
    ON CONFLICT (key_hash) DO UPDATE SET
      attempts = CASE
        WHEN auth_rate_limits.window_start < NOW() - (${windowSeconds} * INTERVAL '1 second') THEN 1
        ELSE auth_rate_limits.attempts + 1
      END,
      window_start = CASE
        WHEN auth_rate_limits.window_start < NOW() - (${windowSeconds} * INTERVAL '1 second') THEN NOW()
        ELSE auth_rate_limits.window_start
      END
    RETURNING attempts
  `) as { attempts: number }[];
  if (Number(rows[0].attempts) > maximum) throw new RateLimitError("Too many attempts");
}

export async function enforceAuthRateLimit(request: NextRequest, username: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  await consume(`ip:${forwarded}`, 20, 15 * 60);
  await consume(`username:${username.trim().toLowerCase()}`, 10, 15 * 60);
}
