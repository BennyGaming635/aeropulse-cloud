import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { createRemoteJWKSet, importPKCS8, jwtVerify, SignJWT } from "jose";
import { env } from "@/lib/env";

const appleKeys = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function verifyAppleIdentityToken(
  identityToken: string,
  audience: string,
  rawNonce: string,
) {
  const { payload } = await jwtVerify(identityToken, appleKeys, {
    issuer: "https://appleid.apple.com",
    audience,
    algorithms: ["RS256"],
  });

  if (!payload.sub) throw new Error("Apple identity token has no subject");
  if (payload.nonce !== sha256(rawNonce)) throw new Error("Apple identity nonce did not match");
  return payload;
}

async function appleClientSecret(clientID: string): Promise<string> {
  const key = await importPKCS8(env.applePrivateKey, "ES256");
  const now = Math.floor(Date.now() / 1_000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: env.appleKeyID })
    .setIssuer(env.appleTeamID)
    .setSubject(clientID)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt(now)
    .setExpirationTime(now + 5 * 60)
    .sign(key);
}

type AppleTokenResponse = {
  refresh_token?: string;
  id_token: string;
};

export async function exchangeAppleAuthorizationCode(
  code: string,
  clientID: string,
  redirectURI?: string,
): Promise<AppleTokenResponse> {
  const body = new URLSearchParams({
    client_id: clientID,
    client_secret: await appleClientSecret(clientID),
    code,
    grant_type: "authorization_code",
  });
  if (redirectURI) body.set("redirect_uri", redirectURI);
  const response = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Apple authorization code exchange failed");
  return response.json() as Promise<AppleTokenResponse>;
}

export async function revokeAppleRefreshToken(refreshToken: string, clientID: string) {
  const response = await fetch("https://appleid.apple.com/auth/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientID,
      client_secret: await appleClientSecret(clientID),
      token: refreshToken,
      token_type_hint: "refresh_token",
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Apple token revocation failed");
}

export function encryptAppleToken(token: string, context: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", env.appleTokenEncryptionKey, iv);
  cipher.setAAD(Buffer.from(context, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((value) => value.toString("base64url")).join(".");
}

export function decryptAppleToken(value: string, context: string): string {
  const [iv, tag, ciphertext] = value.split(".").map((part) => Buffer.from(part, "base64url"));
  if (!iv || !tag || !ciphertext) throw new Error("Invalid encrypted Apple token");
  const decipher = createDecipheriv("aes-256-gcm", env.appleTokenEncryptionKey, iv);
  decipher.setAAD(Buffer.from(context, "utf8"));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
