import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    await sql`SELECT 1 FROM users LIMIT 1`;
    return NextResponse.json({ status: "ok", service: "AeroPulse Cloud", version: 1 });
  } catch {
    return NextResponse.json(
      { status: "unavailable", service: "AeroPulse Cloud", version: 1 },
      { status: 503 },
    );
  }
}
