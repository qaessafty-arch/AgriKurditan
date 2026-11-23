import "server-only";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";

export type Entitlement = "studio_pro" | "architect_pro" | "featured_placement";

/** Active entitlements from subscriptions (or one-time purchases recorded as subscriptions). */
export async function getEntitlements(user: Pick<SessionUser, "id" | "role"> | null): Promise<Set<Entitlement>> {
  const out = new Set<Entitlement>();
  if (!user) return out;
  if (user.role === "ADMIN") return new Set(["studio_pro", "architect_pro", "featured_placement"]);
  const now = new Date();
  const subs = await db.subscription.findMany({
    where: { userId: user.id, status: "ACTIVE", startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    select: { entitlement: true },
  });
  for (const s of subs) if (s.entitlement) out.add(s.entitlement as Entitlement);
  if (out.has("architect_pro")) out.add("studio_pro");
  return out;
}

export async function hasEntitlement(user: Pick<SessionUser, "id" | "role"> | null, e: Entitlement) {
  return (await getEntitlements(user)).has(e);
}
