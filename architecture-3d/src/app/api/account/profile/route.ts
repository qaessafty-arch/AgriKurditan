import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { optionalText, phone, text } from "@/lib/validation";
import { LIMITS } from "@/lib/security/rate-limit";

const schema = z.object({ name: text(80, 2), phone, company: optionalText(120), bio: optionalText(1000), marketingOptIn: z.boolean() });

export const PATCH = route({ rate: ["write", LIMITS.write] }, async (req) => {
  const user = await requireUser();
  const input = await readJson(req, schema);
  await db.user.update({ where: { id: user.id }, data: { name: input.name, phone: input.phone ?? null, company: input.company ?? null, bio: input.bio ?? null, marketingOptIn: input.marketingOptIn } });
  return { ok: true };
});
