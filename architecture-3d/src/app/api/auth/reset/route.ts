import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { password } from "@/lib/validation";
import { LIMITS } from "@/lib/security/rate-limit";
import { hashToken } from "@/lib/security/tokens";
import { hashPassword } from "@/lib/auth/password";
import { destroyAllSessions } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { badRequest } from "@/lib/errors";

const schema = z.object({ token: z.string().min(20).max(200), password });

export const POST = route({ rate: ["reset", LIMITS.passwordReset] }, async (req, { ip }) => {
  const input = await readJson(req, schema);
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(input.token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) throw badRequest("This reset link is invalid or has expired. Request a new one.");
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(input.password), failedLoginCount: 0, lockedUntil: null } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  await destroyAllSessions(record.userId);
  await audit("auth.password_reset", { actorId: record.userId, ip });
  return { ok: true };
});
