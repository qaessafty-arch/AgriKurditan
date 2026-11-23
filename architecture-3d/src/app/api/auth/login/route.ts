import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { createSession, requestMeta } from "@/lib/auth/session";
import { DUMMY_HASH, verifyPassword } from "@/lib/auth/password";
import { email } from "@/lib/validation";
import { LIMITS } from "@/lib/security/rate-limit";
import { audit } from "@/lib/audit";
import { HttpError } from "@/lib/errors";

const schema = z.object({ email, password: z.string().min(1).max(200) });
const MAX_FAILURES = 5;
const LOCK_MINUTES = 15;

export const POST = route({ rate: ["auth", LIMITS.auth] }, async (req, { ip }) => {
  const { email, password } = await readJson(req, schema);
  const user = await db.user.findUnique({ where: { email } });
  const invalid = new HttpError(401, "Email or password is incorrect.");

  if (!user) {
    await verifyPassword(password, DUMMY_HASH); // equalise timing
    await audit("auth.login_failed", { ip, meta: { reason: "unknown_email" } });
    throw invalid;
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new HttpError(423, "Too many failed attempts. The account is locked for a few minutes; try again later or reset your password.");
  }
  if (user.disabled) throw new HttpError(403, "This account has been disabled. Contact support.");

  if (!(await verifyPassword(password, user.passwordHash))) {
    const failures = user.failedLoginCount + 1;
    await db.user.update({
      where: { id: user.id },
      data: { failedLoginCount: failures >= MAX_FAILURES ? 0 : failures, lockedUntil: failures >= MAX_FAILURES ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null },
    });
    await audit(failures >= MAX_FAILURES ? "auth.locked" : "auth.login_failed", { actorId: user.id, ip });
    throw invalid;
  }

  await db.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null } });
  await createSession(user.id, await requestMeta());
  await audit("auth.login", { actorId: user.id, ip });
  return { ok: true, role: user.role };
});
