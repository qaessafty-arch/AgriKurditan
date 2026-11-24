import "server-only";

/** Server-side environment access with production safety checks. Never import from client code. */
export const env = {
  get appUrl() {
    return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
  get authSecret() {
    const s = process.env.AUTH_SECRET ?? "";
    if (s.length < 32) {
      if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be at least 32 characters in production.");
      return "development-only-secret-do-not-use-in-production-000000";
    }
    return s;
  },
  get aiProvider(): "claude" | "rules" {
    return process.env.AI_PROVIDER === "claude" && process.env.ANTHROPIC_API_KEY ? "claude" : "rules";
  },
  get anthropicKey() {
    return process.env.ANTHROPIC_API_KEY ?? "";
  },
  get anthropicModel() {
    return process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
  },
  get smtpConfigured() {
    return Boolean(process.env.SMTP_HOST && process.env.EMAIL_FROM);
  },
  get storageDriver(): "local" | "s3" | "blob" {
    const d = process.env.STORAGE_DRIVER;
    return d === "s3" || d === "blob" ? d : "local";
  },
};
