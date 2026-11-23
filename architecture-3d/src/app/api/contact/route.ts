import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { email, phone, text } from "@/lib/validation";
import { LIMITS } from "@/lib/security/rate-limit";
import { notifyAdmins } from "@/lib/notify";

const schema = z.object({ name: text(80, 2), email, phone, subject: text(150, 2), message: text(4000, 10), website: z.string().max(0).optional() });

export const POST = route({ rate: ["form", LIMITS.publicForm] }, async (req) => {
  const input = await readJson(req, schema);
  const m = await db.contactMessage.create({ data: { name: input.name, email: input.email, phone: input.phone, subject: input.subject, message: input.message } });
  await notifyAdmins(`New message: ${m.subject}`, `${m.name} (${m.email})`, "/admin/messages");
  return { ok: true };
});
