import { createHash, randomBytes } from "node:crypto";
import { sql } from "@/lib/db";
import { env } from "@/lib/env";

type DateValue = string | Date;

export type SharedTripMember = {
  id: string;
  aeroID: string;
  username: string;
  displayName: string | null;
  role: "owner" | "member";
  joinedAt: string;
  isCurrent: boolean;
};

export type SharedFlight = {
  id: string;
  flightNumber: string;
  airlineName: string | null;
  originCode: string;
  destinationCode: string;
  scheduledDeparture: string;
  scheduledArrival: string | null;
  version: number;
  addedAt: string;
  addedBy: { aeroID: string; username: string; displayName: string | null } | null;
  canRemove: boolean;
};

export type SharedTripView = {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  role: "owner" | "member";
  canManage: boolean;
  members: SharedTripMember[];
  flights: SharedFlight[];
};

export type SharedTripInput = {
  name: string;
  startDate?: string | null;
  endDate?: string | null;
};

export type SharedFlightInput = {
  flightNumber: string;
  airlineName?: string | null;
  originCode: string;
  destinationCode: string;
  scheduledDeparture: string;
  scheduledArrival?: string | null;
};

type TripRow = {
  id: string;
  name: string;
  start_date: DateValue | null;
  end_date: DateValue | null;
  version: string | number;
  created_at: DateValue;
  updated_at: DateValue;
  role: "owner" | "member";
};

type MemberRow = {
  id: string;
  trip_id: string;
  aero_pulse_id: string;
  username: string;
  display_name: string | null;
  role: "owner" | "member";
  joined_at: DateValue;
  is_current: boolean;
};

type FlightRow = {
  id: string;
  trip_id: string;
  flight_number: string;
  airline_name: string | null;
  origin_code: string;
  destination_code: string;
  scheduled_departure: DateValue;
  scheduled_arrival: DateValue | null;
  version: string | number;
  created_at: DateValue;
  aero_pulse_id: string | null;
  username: string | null;
  display_name: string | null;
  can_remove: boolean;
};

function iso(value: DateValue): string {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function dateOnly(value: DateValue | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
}

function publicFlight(row: FlightRow): SharedFlight {
  return {
    id: row.id,
    flightNumber: row.flight_number,
    airlineName: row.airline_name,
    originCode: row.origin_code.trim(),
    destinationCode: row.destination_code.trim(),
    scheduledDeparture: iso(row.scheduled_departure),
    scheduledArrival: row.scheduled_arrival ? iso(row.scheduled_arrival) : null,
    version: Number(row.version),
    addedAt: iso(row.created_at),
    addedBy: row.aero_pulse_id && row.username ? {
      aeroID: row.aero_pulse_id,
      username: row.username,
      displayName: row.display_name,
    } : null,
    canRemove: row.can_remove,
  };
}

export async function sharedTripsForUser(userID: string): Promise<SharedTripView[]> {
  const [tripResult, memberResult, flightResult] = await Promise.all([
    sql`
      SELECT t.id, t.name, t.start_date, t.end_date, t.version,
        t.created_at, t.updated_at, mine.role
      FROM shared_trips t
      JOIN shared_trip_memberships mine ON mine.trip_id = t.id AND mine.user_id = ${userID}
      ORDER BY COALESCE(t.start_date, t.created_at::date), t.created_at
    `,
    sql`
      SELECT m.id, m.trip_id, u.aero_pulse_id, u.username, u.display_name, m.role, m.joined_at,
        m.user_id = ${userID} AS is_current
      FROM shared_trip_memberships m
      JOIN users u ON u.id = m.user_id
      WHERE EXISTS (
        SELECT 1 FROM shared_trip_memberships mine
        WHERE mine.trip_id = m.trip_id AND mine.user_id = ${userID}
      )
      ORDER BY CASE m.role WHEN 'owner' THEN 0 ELSE 1 END, m.joined_at
    `,
    sql`
      SELECT f.id, f.trip_id, f.flight_number, f.airline_name, f.origin_code, f.destination_code,
        f.scheduled_departure, f.scheduled_arrival, f.version, f.created_at,
        u.aero_pulse_id, u.username, u.display_name,
        (f.added_by_user_id = ${userID} OR t.owner_user_id = ${userID}) AS can_remove
      FROM shared_flight_snapshots f
      JOIN shared_trips t ON t.id = f.trip_id
      LEFT JOIN shared_trip_memberships contributor
        ON contributor.trip_id = f.trip_id AND contributor.user_id = f.added_by_user_id
      LEFT JOIN users u ON u.id = contributor.user_id
      WHERE EXISTS (
        SELECT 1 FROM shared_trip_memberships mine
        WHERE mine.trip_id = f.trip_id AND mine.user_id = ${userID}
      )
      ORDER BY f.scheduled_departure, f.created_at
    `,
  ]);
  const tripRows = tripResult as TripRow[];
  const memberRows = memberResult as MemberRow[];
  const flightRows = flightResult as FlightRow[];

  const membersByTrip = new Map<string, SharedTripMember[]>();
  for (const row of memberRows) {
    const member: SharedTripMember = {
      id: row.id,
      aeroID: row.aero_pulse_id,
      username: row.username,
      displayName: row.display_name,
      role: row.role,
      joinedAt: iso(row.joined_at),
      isCurrent: row.is_current,
    };
    membersByTrip.set(row.trip_id, [...(membersByTrip.get(row.trip_id) || []), member]);
  }

  const flightsByTrip = new Map<string, SharedFlight[]>();
  for (const row of flightRows) {
    flightsByTrip.set(row.trip_id, [...(flightsByTrip.get(row.trip_id) || []), publicFlight(row)]);
  }

  return tripRows.map((row) => ({
    id: row.id,
    name: row.name,
    startDate: dateOnly(row.start_date),
    endDate: dateOnly(row.end_date),
    version: Number(row.version),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    role: row.role,
    canManage: row.role === "owner",
    members: membersByTrip.get(row.id) || [],
    flights: flightsByTrip.get(row.id) || [],
  }));
}

export async function createSharedTrip(userID: string, input: SharedTripInput) {
  const rows = (await sql`
    WITH trip AS (
      INSERT INTO shared_trips (owner_user_id, name, start_date, end_date)
      VALUES (${userID}, ${input.name}, ${input.startDate ?? null}, ${input.endDate ?? null})
      RETURNING id, name, start_date, end_date, version, created_at, updated_at
    ), membership AS (
      INSERT INTO shared_trip_memberships (trip_id, user_id, role)
      SELECT id, ${userID}, 'owner' FROM trip
      RETURNING trip_id
    )
    SELECT trip.id, trip.name, trip.start_date, trip.end_date,
      trip.version, trip.created_at, trip.updated_at
    FROM trip JOIN membership ON membership.trip_id = trip.id
  `) as Array<Omit<TripRow, "role">>;
  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    startDate: dateOnly(row.start_date),
    endDate: dateOnly(row.end_date),
    version: Number(row.version),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export async function updateSharedTrip(
  userID: string,
  tripID: string,
  baseVersion: number,
  input: Partial<SharedTripInput>,
) {
  const rows = (await sql`
    UPDATE shared_trips
    SET name = CASE WHEN ${input.name !== undefined} THEN ${input.name ?? ""} ELSE name END,
      start_date = CASE WHEN ${input.startDate !== undefined} THEN ${input.startDate ?? null} ELSE start_date END,
      end_date = CASE WHEN ${input.endDate !== undefined} THEN ${input.endDate ?? null} ELSE end_date END,
      version = version + 1,
      updated_at = NOW()
    WHERE id = ${tripID} AND owner_user_id = ${userID} AND version = ${baseVersion}
    RETURNING version, updated_at
  `) as Array<{ version: string | number; updated_at: DateValue }>;
  if (rows[0]) return { status: "updated" as const, version: Number(rows[0].version), updatedAt: iso(rows[0].updated_at) };

  const current = (await sql`
    SELECT version, owner_user_id = ${userID} AS is_owner FROM shared_trips WHERE id = ${tripID} LIMIT 1
  `) as Array<{ version: string | number; is_owner: boolean }>;
  if (current[0]?.is_owner) return { status: "conflict" as const, currentVersion: Number(current[0].version) };
  return { status: "forbidden" as const };
}

export async function addSharedFlight(userID: string, tripID: string, input: SharedFlightInput) {
  const rows = (await sql`
    INSERT INTO shared_flight_snapshots (
      trip_id, added_by_user_id, flight_number, airline_name, origin_code,
      destination_code, scheduled_departure, scheduled_arrival
    )
    SELECT ${tripID}, ${userID}, ${input.flightNumber}, ${input.airlineName ?? null},
      ${input.originCode}, ${input.destinationCode}, ${input.scheduledDeparture}, ${input.scheduledArrival ?? null}
    WHERE EXISTS (
      SELECT 1 FROM shared_trip_memberships WHERE trip_id = ${tripID} AND user_id = ${userID}
    )
    RETURNING id, trip_id, flight_number, airline_name, origin_code, destination_code,
      scheduled_departure, scheduled_arrival, version, created_at
  `) as Array<Omit<FlightRow, "aero_pulse_id" | "username" | "display_name" | "can_remove">>;
  if (!rows[0]) return null;
  return publicFlight({
    ...rows[0],
    aero_pulse_id: null,
    username: null,
    display_name: null,
    can_remove: true,
  });
}

export async function removeSharedFlight(userID: string, tripID: string, flightID: string): Promise<boolean> {
  const rows = (await sql`
    DELETE FROM shared_flight_snapshots f
    USING shared_trips t
    WHERE f.id = ${flightID} AND f.trip_id = ${tripID} AND t.id = f.trip_id
      AND (f.added_by_user_id = ${userID} OR t.owner_user_id = ${userID})
    RETURNING f.id
  `) as Array<{ id: string }>;
  return Boolean(rows[0]);
}

function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSharedTripInvite(userID: string, tripID: string, expiresInHours: number, maxUses: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1_000);
  const rows = (await sql`
    INSERT INTO shared_trip_invites (trip_id, token_hash, created_by_user_id, expires_at, max_uses)
    SELECT ${tripID}, ${hashInviteToken(token)}, ${userID}, ${expiresAt.toISOString()}, ${maxUses}
    FROM shared_trips
    WHERE id = ${tripID} AND owner_user_id = ${userID}
    RETURNING id
  `) as Array<{ id: string }>;
  if (!rows[0]) return null;
  return {
    id: rows[0].id,
    url: `${env.appBaseURL}/invite/${token}`,
    expiresAt: expiresAt.toISOString(),
    maxUses,
  };
}

export type InvitePreview = {
  tripName: string;
  owner: { aeroID: string; username: string; displayName: string | null };
  expiresAt: string;
};

export async function sharedTripInvitePreview(token: string): Promise<InvitePreview | null> {
  if (token.length < 20 || token.length > 100) return null;
  const rows = (await sql`
    SELECT t.name, u.aero_pulse_id, u.username, u.display_name, i.expires_at
    FROM shared_trip_invites i
    JOIN shared_trips t ON t.id = i.trip_id
    JOIN users u ON u.id = t.owner_user_id
    WHERE i.token_hash = ${hashInviteToken(token)} AND i.revoked_at IS NULL
      AND i.expires_at > NOW() AND i.use_count < i.max_uses
    LIMIT 1
  `) as Array<{
    name: string;
    aero_pulse_id: string;
    username: string;
    display_name: string | null;
    expires_at: DateValue;
  }>;
  if (!rows[0]) return null;
  return {
    tripName: rows[0].name,
    owner: {
      aeroID: rows[0].aero_pulse_id,
      username: rows[0].username,
      displayName: rows[0].display_name,
    },
    expiresAt: iso(rows[0].expires_at),
  };
}

export async function joinSharedTripInvite(userID: string, token: string) {
  if (token.length < 20 || token.length > 100) return null;
  const rows = (await sql`
    WITH existing AS (
      SELECT i.trip_id
      FROM shared_trip_invites i
      JOIN shared_trip_memberships m ON m.trip_id = i.trip_id AND m.user_id = ${userID}
      WHERE i.token_hash = ${hashInviteToken(token)} AND i.revoked_at IS NULL AND i.expires_at > NOW()
    ), claimed AS (
      UPDATE shared_trip_invites i
      SET use_count = use_count + 1
      WHERE i.token_hash = ${hashInviteToken(token)} AND i.revoked_at IS NULL AND i.expires_at > NOW()
        AND i.use_count < i.max_uses
        AND NOT EXISTS (
          SELECT 1 FROM shared_trip_memberships m WHERE m.trip_id = i.trip_id AND m.user_id = ${userID}
        )
      RETURNING i.trip_id
    ), added AS (
      INSERT INTO shared_trip_memberships (trip_id, user_id, role)
      SELECT trip_id, ${userID}, 'member' FROM claimed
      ON CONFLICT (trip_id, user_id) DO NOTHING
      RETURNING trip_id
    )
    SELECT trip_id, FALSE AS joined FROM existing
    UNION ALL
    SELECT claimed.trip_id, EXISTS (SELECT 1 FROM added) AS joined FROM claimed
    LIMIT 1
  `) as Array<{ trip_id: string; joined: boolean }>;
  return rows[0] ? { tripID: rows[0].trip_id, joined: rows[0].joined } : null;
}

export async function removeSharedTripMembership(userID: string, tripID: string, membershipID: string) {
  const rows = (await sql`
    DELETE FROM shared_trip_memberships target
    USING shared_trip_memberships actor
    WHERE target.id = ${membershipID} AND target.trip_id = ${tripID}
      AND actor.trip_id = target.trip_id AND actor.user_id = ${userID}
      AND target.role = 'member'
      AND (target.user_id = ${userID} OR actor.role = 'owner')
    RETURNING target.user_id = ${userID} AS left_trip
  `) as Array<{ left_trip: boolean }>;
  return rows[0] ? { removed: true, leftTrip: rows[0].left_trip } : { removed: false, leftTrip: false };
}
