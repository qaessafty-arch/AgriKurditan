import "server-only";
import { createHmac } from "node:crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { safeEqual } from "@/lib/security/tokens";
import type { SessionUser } from "@/lib/auth/session";

/** Signed key that lets an anonymous visitor finish the quote draft they started. */
export const draftKey = (id: string) => createHmac("sha256", env.authSecret).update(`quote-draft:${id}`).digest("base64url");
export const verifyDraftKey = (id: string, key: string) => safeEqual(draftKey(id), key);

/** Only attach a design/brief the requester owns (or an anonymous brief). */
export async function ownedDesignId(user: SessionUser | null, id?: string | null) {
  if (!id || !user) return null;
  const d = await db.design.findUnique({ where: { id }, select: { userId: true } });
  return d?.userId === user.id ? id : null;
}

export async function ownedBriefId(user: SessionUser | null, id?: string | null) {
  if (!id) return null;
  const b = await db.aiBrief.findUnique({ where: { id }, select: { userId: true } });
  if (!b) return null;
  return b.userId === null || b.userId === user?.id ? id : null;
}
