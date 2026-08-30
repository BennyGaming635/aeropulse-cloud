import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const scryptOptions = { N: 32_768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function scrypt(password: string, salt: Buffer, length: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, length, scryptOptions, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return /^[A-Za-z0-9_]{3,24}$/.test(username.trim());
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return { hash: `scrypt-v1$${hash.toString("base64")}`, salt: salt.toString("base64") };
}

export async function verifyPassword(password: string, encodedHash: string, encodedSalt: string): Promise<boolean> {
  const [algorithm, hash] = encodedHash.split("$", 2);
  if (algorithm !== "scrypt-v1" || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await scrypt(password, Buffer.from(encodedSalt, "base64"), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
