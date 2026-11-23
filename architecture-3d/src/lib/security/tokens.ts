import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

/** 256-bit random token, URL-safe. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Tokens are stored hashed so a database leak does not leak live sessions or reset links. */
export function hashToken(token: string): string {
  return createHmac("sha256", env.authSecret).update(token).digest("hex");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a), bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Short human-readable reference, e.g. "Q-7KD2-93XF". Unambiguous alphabet (no 0/O/1/I). */
export function humanReference(prefix: string): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[(bytes[i] as number) % alphabet.length];
  return `${prefix}-${out.slice(0, 4)}-${out.slice(4)}`;
}
