function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function appURL(name: string): string {
  const value = required(name).replace(/\/$/, "");
  const url = new URL(value);
  const localDevelopment = process.env.NODE_ENV !== "production"
    && url.protocol === "http:"
    && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  if (url.protocol !== "https:" && !localDevelopment) throw new Error(`${name} must use HTTPS`);
  return value;
}

export const env = {
  get databaseURL() {
    return required("DATABASE_URL");
  },
  get appBaseURL() {
    return appURL("APP_BASE_URL");
  },
  get credentialEncryptionKey() {
    const key = Buffer.from(required("CREDENTIAL_ENCRYPTION_KEY"), "base64");
    if (key.length !== 32) throw new Error("CREDENTIAL_ENCRYPTION_KEY must decode to 32 bytes");
    return key;
  },
};
