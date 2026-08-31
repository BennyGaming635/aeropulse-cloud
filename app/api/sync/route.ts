import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { accountForRequest } from "@/lib/sessions";

const payloadSchema = z.object({
  schemaVersion: z.literal(1),
  flights: z.array(z.unknown()),
  preferences: z.record(z.string(), z.unknown()),
  clientUpdatedAt: z.string().datetime().optional(),
}).passthrough();

const writeSchema = z.object({
  baseVersion: z.number().int().nonnegative(),
  payload: payloadSchema,
});

type SnapshotRow = { version: string | number; payload: unknown; updated_at: string | Date };

function responseFor(row?: SnapshotRow) {
  return {
    version: row ? Number(row.version) : 0,
    payload: row?.payload ?? { schemaVersion: 1, flights: [], preferences: {} },
    updatedAt: row
      ? (row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at)).toISOString()
      : null,
  };
}

async function currentSnapshot(userID: string): Promise<SnapshotRow | undefined> {
  const rows = (await sql`
    SELECT version, payload, updated_at FROM sync_snapshots WHERE user_id = ${userID} LIMIT 1
  `) as SnapshotRow[];
  return rows[0];
}

export async function GET(request: NextRequest) {
  const account = await accountForRequest(request);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(responseFor(await currentSnapshot(account.id)));
}

export async function PUT(request: NextRequest) {
  const account = await accountForRequest(request);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let input: z.infer<typeof writeSchema>;
  let payloadJSON: string;
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > 2_100_000) {
      return NextResponse.json({ error: "Sync snapshot exceeds 2 MB" }, { status: 413 });
    }
    input = writeSchema.parse(JSON.parse(rawBody));
    payloadJSON = JSON.stringify(input.payload);
    if (Buffer.byteLength(payloadJSON, "utf8") > 2_000_000) {
      return NextResponse.json({ error: "Sync snapshot exceeds 2 MB" }, { status: 413 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid sync snapshot" }, { status: 400 });
  }

  try {
    let rows: SnapshotRow[] = [];

    if (input.baseVersion === 0) {
      rows = (await sql`
        INSERT INTO sync_snapshots (user_id, version, payload)
        VALUES (${account.id}, 1, ${payloadJSON}::jsonb)
        ON CONFLICT (user_id) DO NOTHING
        RETURNING version, payload, updated_at
      `) as SnapshotRow[];
    } else {
      rows = (await sql`
        UPDATE sync_snapshots
        SET version = version + 1, payload = ${payloadJSON}::jsonb, updated_at = NOW()
        WHERE user_id = ${account.id} AND version = ${input.baseVersion}
        RETURNING version, payload, updated_at
      `) as SnapshotRow[];
    }

    if (rows[0]) return NextResponse.json(responseFor(rows[0]));
    return NextResponse.json(
      { error: "Sync version conflict", current: responseFor(await currentSnapshot(account.id)) },
      { status: 409 },
    );
  } catch (error) {
    console.error("Sync snapshot write failed", error);
    return NextResponse.json({ error: "Aero is temporarily unavailable" }, { status: 503 });
  }
}
