import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { createSession, requestMeta } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { email, optionalText, password, text } from "@/lib/validation";
import { LIMITS } from "@/lib/security/rate-limit";
import { audit } from "@/lib/audit";
import { conflict } from "@/lib/errors";
import { notifyUser } from "@/lib/notify";

const schema = z.object({
  name: text(80, 2),
  email,
  password,
  accountType: z.enum(["CUSTOMER", "ARCHITECT", "PARTNER"]).default("CUSTOMER"),
  company: optionalText(120),
  marketingOptIn: z.boolean().default(false),
  acceptTerms: z.literal(true, { error: "You must accept the terms to create an account" }),
  locale: z.enum(["en", "ar", "ckb"]).default("en"),
});

export const POST = route({ rate: ["auth", LIMITS.auth] }, async (req, { ip }) => {
  const input = await readJson(req, schema);
  if (await db.user.findUnique({ where: { email: input.email }, select: { id: true } })) {
    throw conflict("An account with this email already exists. Sign in or reset your password.");
  }
  const user = await db.user.create({
    data: {
      name: input.name, email: input.email, passwordHash: await hashPassword(input.password),
      role: input.accountType, company: input.company, marketingOptIn: input.marketingOptIn, locale: input.locale,
    },
  });
  await createSession(user.id, await requestMeta());
  await audit("auth.register", { actorId: user.id, ip, meta: { role: user.role } });
  await notifyUser(user.id, "welcome", {}, "/account");
  return { ok: true };
});
