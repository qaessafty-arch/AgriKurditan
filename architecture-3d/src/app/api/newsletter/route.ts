import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { email, optionalText } from "@/lib/validation";
import { LIMITS } from "@/lib/security/rate-limit";
import { hashToken, randomToken } from "@/lib/security/tokens";
import { sendLocalizedEmail } from "@/lib/notify";
import { requestLocale } from "@/i18n/errors";
import { env } from "@/lib/env";

/** Double opt-in: subscribers are only "confirmed" after clicking the emailed link. */
export const POST = route({ rate: ["form", LIMITS.publicForm] }, async (req) => {
  const input = await readJson(req, z.object({ email, source: optionalText(40) }));
  const existing = await db.newsletterSubscriber.findUnique({ where: { email: input.email } });
  if (existing?.confirmedAt && !existing.unsubscribedAt) return { message: "You are already subscribed. Thank you." };
  const token = randomToken();
  await db.newsletterSubscriber.upsert({
    where: { email: input.email },
    create: { email: input.email, tokenHash: hashToken(token), source: input.source },
    update: { tokenHash: hashToken(token), unsubscribedAt: null },
  });
  const mail = await sendLocalizedEmail(requestLocale(req.headers), input.email, "newsletterConfirm", { link: `${env.appUrl}/api/newsletter/confirm?token=${token}` });
  return {
    message: mail.sent
      ? "Almost done: check your inbox and confirm your subscription."
      : "Thank you. Your address is saved, and we will ask you to confirm by email before sending anything.",
  };
});
