import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { email } from "@/lib/validation";
import { LIMITS } from "@/lib/security/rate-limit";
import { hashToken, randomToken } from "@/lib/security/tokens";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { audit } from "@/lib/audit";
import { HttpError } from "@/lib/errors";

const schema = z.object({ email });
const GENERIC = "If an account exists for that email, a reset link is on its way. It expires in one hour.";

export const POST = route({ rate: ["reset", LIMITS.passwordReset] }, async (req, { ip }) => {
  const input = await readJson(req, schema);
  if (!env.smtpConfigured && env.isProduction) {
    throw new HttpError(503, "Password reset by email is not available at the moment. Please contact us and we will help you regain access.");
  }
  const user = await db.user.findUnique({ where: { email: input.email } });
  if (!user || user.disabled) return { message: GENERIC };

  await db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
  const token = randomToken();
  await db.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 3600_000) } });
  const link = `${env.appUrl}/reset-password?token=${token}`;
  const result = await sendEmail(user.email, "Reset your Architecture 3D password",
    `Someone asked to reset the password for this account.\n\nReset it here (valid for one hour):\n${link}\n\nIf this was not you, ignore this email; your password stays the same.`);
  await audit("auth.reset_requested", { actorId: user.id, ip, meta: { emailed: result.sent } });
  if (!result.sent && !env.isProduction) {
    return { message: "Development mode: email is not configured, so the reset link was written to the server log." };
  }
  return { message: GENERIC };
});
