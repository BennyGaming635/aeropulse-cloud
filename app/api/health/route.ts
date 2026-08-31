import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { env } from "@/lib/env";

export async function GET() {
  try {
    const rows = await sql`SELECT version FROM schema_metadata WHERE singleton = TRUE LIMIT 1`;
    if (Number((rows[0] as { version?: number } | undefined)?.version) !== 3) throw new Error("Schema mismatch");
    void env.credentialEncryptionKey;
    return NextResponse.json({ status: "ok", service: "Aero", version: 1 });
  } catch {
    return NextResponse.json(
      { status: "unavailable", service: "Aero", version: 1 },
      { status: 503 },
    );
  }
}
