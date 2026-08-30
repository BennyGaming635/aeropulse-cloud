import { randomBytes } from "node:crypto";
import { sql } from "@/lib/db";
import { decryptAppleToken, encryptAppleToken, revokeAppleRefreshToken } from "@/lib/apple";

const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export type Account = {
  id: string;
  aeroPulseID: string;
  displayName: string | null;
  email: string | null;
  createdAt: string;
};

type AccountRow = {
  id: string;
  aero_pulse_id: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
};

function newAeroPulseID(): string {
  const bytes = randomBytes(8);
  const value = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return `AP-${value.slice(0, 4)}-${value.slice(4)}`;
}

function accountFromRow(row: AccountRow): Account {
  return {
    id: row.id,
    aeroPulseID: row.aero_pulse_id,
    displayName: row.display_name,
    email: row.email,
    createdAt: row.created_at,
  };
}

export async function upsertAppleAccount(input: {
  appleSubject: string;
  email?: string | null;
  displayName?: string | null;
  appleRefreshToken?: string | null;
  appleClientID?: string | null;
}): Promise<Account> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const rows = (await sql`
        INSERT INTO users (aero_pulse_id, apple_subject, email, display_name)
        VALUES (${newAeroPulseID()}, ${input.appleSubject}, ${input.email ?? null}, ${input.displayName ?? null})
        ON CONFLICT (apple_subject) DO UPDATE SET
          email = COALESCE(EXCLUDED.email, users.email),
          display_name = COALESCE(EXCLUDED.display_name, users.display_name),
          updated_at = NOW()
        RETURNING id, aero_pulse_id, display_name, email, created_at
      `) as AccountRow[];
      const account = accountFromRow(rows[0]);
      if (input.appleRefreshToken && input.appleClientID) {
        const context = `${account.id}:${input.appleClientID}`;
        const existing = (await sql`
          SELECT refresh_token FROM apple_grants
          WHERE user_id = ${account.id} AND client_id = ${input.appleClientID}
          LIMIT 1
        `) as { refresh_token: string }[];
        if (existing[0]) {
          await revokeAppleRefreshToken(
            decryptAppleToken(existing[0].refresh_token, context),
            input.appleClientID,
          );
          await sql`
            DELETE FROM apple_grants
            WHERE user_id = ${account.id} AND client_id = ${input.appleClientID}
          `;
        }
        await sql`
          INSERT INTO apple_grants (user_id, client_id, refresh_token)
          VALUES (${account.id}, ${input.appleClientID}, ${encryptAppleToken(input.appleRefreshToken, context)})
          ON CONFLICT (user_id, client_id) DO UPDATE SET
            refresh_token = EXCLUDED.refresh_token,
            updated_at = NOW()
        `;
      }
      return account;
    } catch (error) {
      const databaseError = error as { code?: string; constraint?: string };
      const aeroPulseIDCollision = databaseError.code === "23505"
        && databaseError.constraint === "users_aero_pulse_id_key";
      if (!aeroPulseIDCollision || attempt === 3) throw error;
    }
  }
  throw new Error("Could not allocate an AeroPulse ID");
}

export async function deleteAccountAndRevokeApple(userID: string) {
  const rows = (await sql`
    SELECT client_id, refresh_token FROM apple_grants WHERE user_id = ${userID}
  `) as { client_id: string; refresh_token: string }[];
  for (const grant of rows) {
    const context = `${userID}:${grant.client_id}`;
    await revokeAppleRefreshToken(decryptAppleToken(grant.refresh_token, context), grant.client_id);
  }
  await sql`DELETE FROM users WHERE id = ${userID}`;
}

export async function accountByID(id: string): Promise<Account | null> {
  const rows = (await sql`
    SELECT id, aero_pulse_id, display_name, email, created_at
    FROM users WHERE id = ${id} LIMIT 1
  `) as AccountRow[];
  return rows[0] ? accountFromRow(rows[0]) : null;
}
