import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { sql } from "@/lib/db";
import { env } from "@/lib/env";

export const providerIDs = ["airLabs", "aviationstack", "aeroDataBox", "lufthansa"] as const;
export type ProviderID = typeof providerIDs[number];

export type SyncedProviderCredentials = {
  providerID: ProviderID;
  primary: string;
  secondary: string;
  version: number;
  isDeleted: boolean;
  updatedAt: string;
};

function context(userID: string, providerID: ProviderID): Buffer {
  return Buffer.from(`${userID}:${providerID}`, "utf8");
}

function encrypt(value: { primary: string; secondary: string }, userID: string, providerID: ProviderID): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", env.credentialEncryptionKey, iv);
  cipher.setAAD(context(userID, providerID));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return ["v1", iv, cipher.getAuthTag(), ciphertext].map((part) =>
    typeof part === "string" ? part : part.toString("base64url")
  ).join(".");
}

function decrypt(value: string, userID: string, providerID: ProviderID) {
  const parts = value.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") throw new Error("Invalid encrypted provider credentials");
  const [iv, tag, ciphertext] = parts.slice(1).map((part) => Buffer.from(part, "base64url"));
  if (iv.length !== 12 || tag.length !== 16 || ciphertext.length === 0) {
    throw new Error("Invalid encrypted provider credentials");
  }
  const decipher = createDecipheriv("aes-256-gcm", env.credentialEncryptionKey, iv);
  decipher.setAAD(context(userID, providerID));
  decipher.setAuthTag(tag);
  const result = JSON.parse(Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")) as {
    primary: string;
    secondary: string;
  };
  if (typeof result.primary !== "string" || typeof result.secondary !== "string") {
    throw new Error("Invalid provider credential payload");
  }
  return result;
}

export async function providerCredentialsForUser(userID: string): Promise<SyncedProviderCredentials[]> {
  const rows = (await sql`
    SELECT provider_id, encrypted_credentials, is_deleted, version, updated_at
    FROM provider_credentials WHERE user_id = ${userID} ORDER BY provider_id
  `) as {
    provider_id: ProviderID;
    encrypted_credentials: string | null;
    is_deleted: boolean;
    version: number;
    updated_at: string | Date;
  }[];
  return rows.map((row) => {
    const credentials = row.is_deleted
      ? { primary: "", secondary: "" }
      : decrypt(row.encrypted_credentials!, userID, row.provider_id);
    const updatedAt = row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at);
    return {
      providerID: row.provider_id,
      ...credentials,
      version: Number(row.version),
      isDeleted: row.is_deleted,
      updatedAt: updatedAt.toISOString(),
    };
  });
}

export async function saveProviderCredentials(
  userID: string,
  providerID: ProviderID,
  credentials: { primary: string; secondary: string },
  baseVersion: number,
): Promise<number | null> {
  const encrypted = encrypt(credentials, userID, providerID);
  const rows = baseVersion === 0
    ? await sql`
        INSERT INTO provider_credentials (user_id, provider_id, encrypted_credentials, version)
        VALUES (${userID}, ${providerID}, ${encrypted}, 1)
        ON CONFLICT (user_id, provider_id) DO NOTHING
        RETURNING version
      `
    : await sql`
        UPDATE provider_credentials
        SET encrypted_credentials = ${encrypted}, is_deleted = FALSE, version = version + 1, updated_at = NOW()
        WHERE user_id = ${userID} AND provider_id = ${providerID} AND version = ${baseVersion}
        RETURNING version
      `;
  return rows[0] ? Number((rows[0] as { version: number }).version) : null;
}

export async function deleteProviderCredentials(userID: string, providerID: ProviderID, baseVersion: number) {
  if (baseVersion === 0) {
    const rows = await sql`
      INSERT INTO provider_credentials (user_id, provider_id, encrypted_credentials, is_deleted, version)
      VALUES (${userID}, ${providerID}, NULL, TRUE, 1)
      ON CONFLICT (user_id, provider_id) DO NOTHING
      RETURNING version
    `;
    return rows[0] ? Number((rows[0] as { version: number }).version) : null;
  }
  const rows = await sql`
    UPDATE provider_credentials
    SET encrypted_credentials = NULL, is_deleted = TRUE, version = version + 1, updated_at = NOW()
    WHERE user_id = ${userID} AND provider_id = ${providerID} AND version = ${baseVersion}
    RETURNING version
  `;
  return rows[0] ? Number((rows[0] as { version: number }).version) : null;
}

export async function providerCredentialVersion(userID: string, providerID: ProviderID): Promise<number> {
  const rows = await sql`
    SELECT version FROM provider_credentials WHERE user_id = ${userID} AND provider_id = ${providerID}
  `;
  return rows[0] ? Number((rows[0] as { version: number }).version) : 0;
}
