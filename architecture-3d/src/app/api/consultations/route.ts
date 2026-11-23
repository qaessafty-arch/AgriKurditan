import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { email, optionalText, phone, text } from "@/lib/validation";
import { LIMITS } from "@/lib/security/rate-limit";
import { humanReference } from "@/lib/security/tokens";
import { notifyAdmins, notifyUser } from "@/lib/notify";
import { sendEmail } from "@/lib/email";
import { ownedBriefId, ownedDesignId } from "@/lib/leads";
import { badRequest } from "@/lib/errors";

const schema = z.object({
  name: text(80, 2),
  email,
  phone,
  topic: text(120, 2),
  message: text(4000, 10),
  channel: z.enum(["video", "phone", "in_person"]).default("video"),
  preferredDate: z.string().max(40).optional().transform((v) => (v ? new Date(v) : undefined)),
  serviceSlug: optionalText(80),
  designId: optionalText(40),
  briefId: optionalText(40),
  website: z.string().max(0, "Leave this field empty").optional(), // honeypot
});

export const POST = route({ rate: ["form", LIMITS.publicForm] }, async (req) => {
  const input = await readJson(req, schema);
  const user = await getCurrentUser();
  if (input.preferredDate && (Number.isNaN(input.preferredDate.getTime()) || input.preferredDate < new Date(Date.now() - 86400_000))) {
    throw badRequest("Choose a date in the future.", { preferredDate: "Choose a date in the future" });
  }
  const service = input.serviceSlug ? await db.service.findUnique({ where: { slug: input.serviceSlug }, select: { id: true, name: true } }) : null;
  const c = await db.consultation.create({
    data: {
      reference: humanReference("C"), userId: user?.id, name: input.name, email: input.email, phone: input.phone,
      topic: input.topic, message: input.message, channel: input.channel, preferredDate: input.preferredDate,
      serviceId: service?.id, designId: await ownedDesignId(user, input.designId), briefId: await ownedBriefId(user, input.briefId),
      source: req.headers.get("referer")?.slice(0, 200),
    },
  });
  await notifyAdmins(`Consultation request ${c.reference}`, `${c.name} (${c.email}) — ${c.topic}${service ? ` · ${service.name}` : ""}`, `/admin/consultations`);
  if (user) await notifyUser(user.id, "Consultation requested", `Reference ${c.reference}. An architect will contact you to confirm a time.`, "/account/consultations");
  const mail = await sendEmail(c.email, `We received your consultation request (${c.reference})`,
    `Hello ${c.name},\n\nThank you for your request about "${c.topic}". An architect will contact you to confirm a time.\n\nReference: ${c.reference}`);
  return { reference: c.reference, emailed: mail.sent };
});
