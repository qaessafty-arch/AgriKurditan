import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/** Append-only audit trail for security-relevant and administrative actions. Never throws. */
export async function audit(action: string, data: { actorId?: string | null; target?: string; meta?: Prisma.InputJsonValue; ip?: string } = {}) {
  try {
    await db.auditLog.create({ data: { action, actorId: data.actorId ?? null, target: data.target, meta: data.meta, ip: data.ip } });
  } catch (err) {
    console.error("[audit] failed to record", action, err);
  }
}
