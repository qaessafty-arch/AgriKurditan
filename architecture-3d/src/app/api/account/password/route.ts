import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { createSession, destroyAllSessions, requestMeta, requireUser } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { password } from "@/lib/validation";
import { LIMITS } from "@/lib/security/rate-limit";
import { audit } from "@/lib/audit";
import { badRequest } from "@/lib/errors";

const schema = z.object({ current: z.string().min(1).max(200), next: password });

export const POST = route({ rate: ["auth", LIMITS.auth] }, async (req, { ip }) => {
  const user = await requireUser();
  const input = await readJson(req, schema);
  const row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(input.current, row.passwordHash))) throw badRequest("Current password is incorrect.", { current: "Incorrect password" });
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(input.next) } });
  await destroyAllSessions(user.id);
  await createSession(user.id, await requestMeta());
  await audit("auth.password_changed", { actorId: user.id, ip });
  return { ok: true };
});
