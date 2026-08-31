import { randomBytes } from "node:crypto";
import { sql } from "@/lib/db";
import { hashPassword, normalizeUsername, verifyPassword } from "@/lib/passwords";

const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export type Account = {
  id: string;
  aeroPulseID: string;
  username: string;
  displayName: string | null;
  createdAt: string;
};

type AccountRow = {
  id: string;
  aero_pulse_id: string;
  username: string;
  display_name: string | null;
  created_at: string;
};

type LoginRow = AccountRow & { password_hash: string; password_salt: string };

export class AccountError extends Error {
  constructor(readonly code: "username_taken" | "invalid_credentials") {
    super(code);
  }
}

function newAeroPulseID(): string {
  const bytes = randomBytes(8);
  const value = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return `AP-${value.slice(0, 4)}-${value.slice(4)}`;
}

function accountFromRow(row: AccountRow): Account {
  return {
    id: row.id,
    aeroPulseID: row.aero_pulse_id,
    username: row.username,
    displayName: row.display_name,
    createdAt: row.created_at,
  };
}

export async function createPasswordAccount(input: {
  username: string;
  password: string;
  displayName?: string | null;
}): Promise<Account> {
  const password = await hashPassword(input.password);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const rows = (await sql`
        INSERT INTO users (
          aero_pulse_id, username, username_normalized, password_hash, password_salt, display_name
        ) VALUES (
          ${newAeroPulseID()}, ${input.username.trim()}, ${normalizeUsername(input.username)},
          ${password.hash}, ${password.salt}, ${input.displayName?.trim() || null}
        )
        RETURNING id, aero_pulse_id, username, display_name, created_at
      `) as AccountRow[];
      return accountFromRow(rows[0]);
    } catch (error) {
      const databaseError = error as { code?: string; constraint?: string };
      if (databaseError.code === "23505" && databaseError.constraint === "users_username_normalized_key") {
        throw new AccountError("username_taken");
      }
      const aeroPulseIDCollision = databaseError.code === "23505"
        && databaseError.constraint === "users_aero_pulse_id_key";
      if (!aeroPulseIDCollision || attempt === 3) throw error;
    }
  }
  throw new Error("Could not allocate an Aero ID");
}

export async function authenticatePasswordAccount(username: string, password: string): Promise<Account> {
  const rows = (await sql`
    SELECT id, aero_pulse_id, username, display_name, created_at, password_hash, password_salt
    FROM users WHERE username_normalized = ${normalizeUsername(username)} LIMIT 1
  `) as LoginRow[];
  const row = rows[0];
  if (!row) {
    await verifyPassword(
      password,
      `scrypt-v1$${Buffer.alloc(64).toString("base64")}`,
      Buffer.alloc(16).toString("base64"),
    );
    throw new AccountError("invalid_credentials");
  }
  if (!await verifyPassword(password, row.password_hash, row.password_salt)) {
    throw new AccountError("invalid_credentials");
  }
  return accountFromRow(row);
}

export async function accountByID(id: string): Promise<Account | null> {
  const rows = (await sql`
    SELECT id, aero_pulse_id, username, display_name, created_at
    FROM users WHERE id = ${id} LIMIT 1
  `) as AccountRow[];
  return rows[0] ? accountFromRow(rows[0]) : null;
}

export async function deleteAccount(userID: string) {
  await sql`DELETE FROM users WHERE id = ${userID}`;
}
