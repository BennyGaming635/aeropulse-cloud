function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function httpsURL(name: string): string {
  const value = required(name).replace(/\/$/, "");
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error(`${name} must use HTTPS`);
  return value;
}

export const env = {
  get databaseURL() {
    return required("DATABASE_URL");
  },
  get appBaseURL() {
    return httpsURL("APP_BASE_URL");
  },
  get appleWebClientID() {
    return required("APPLE_WEB_CLIENT_ID");
  },
  get appleNativeClientID() {
    return required("APPLE_NATIVE_CLIENT_ID");
  },
  get appleWebRedirectURI() {
    const value = httpsURL("APPLE_WEB_REDIRECT_URI");
    if (!value.endsWith("/api/auth/apple/callback")) {
      throw new Error("APPLE_WEB_REDIRECT_URI must end with /api/auth/apple/callback");
    }
    return value;
  },
  get appleTeamID() {
    return required("APPLE_TEAM_ID");
  },
  get appleKeyID() {
    return required("APPLE_KEY_ID");
  },
  get applePrivateKey() {
    return required("APPLE_PRIVATE_KEY").replace(/\\n/g, "\n");
  },
  get appleTokenEncryptionKey() {
    const key = Buffer.from(required("APPLE_TOKEN_ENCRYPTION_KEY"), "base64");
    if (key.length !== 32) throw new Error("APPLE_TOKEN_ENCRYPTION_KEY must decode to 32 bytes");
    return key;
  },
};
