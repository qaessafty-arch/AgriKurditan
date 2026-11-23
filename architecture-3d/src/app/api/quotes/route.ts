import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { email, optionalText, phone, text } from "@/lib/validation";
import { LIMITS } from "@/lib/security/rate-limit";
import { humanReference } from "@/lib/security/tokens";
import { notifyAdmins, notifyUser } from "@/lib/notify";
import { sendEmail } from "@/lib/email";
import { ownedBriefId, ownedDesignId, verifyDraftKey } from "@/lib/leads";
import { badRequest } from "@/lib/errors";

const money = z.union([z.number(), z.string()]).optional().transform((v, ctx) => {
  if (v === undefined || v === "") return undefined;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 1e11) { ctx.addIssue({ code: "custom", message: "Enter a valid amount" }); return z.NEVER; }
  return n;
});

const schema = z.object({
  draftId: optionalText(40),
  draftKey: optionalText(100),
  name: text(80, 2),
  email,
  phone,
  serviceSlug: optionalText(80),
  designId: optionalText(40),
  briefId: optionalText(40),
  siteLocation: optionalText(200),
  areaM2: z.union([z.number(), z.string()]).optional().transform((v) => (v === undefined || v === "" ? undefined : Math.round(Number(v)))).pipe(z.number().int().min(10).max(1_000_000).optional()),
  budgetMin: money,
  budgetMax: money,
  currency: z.enum(["USD", "IQD", "EUR"]).default("USD"),
  timeline: optionalText(120),
  details: text(5000, 20),
  website: z.string().max(0).optional(),
});

export const POST = route({ rate: ["form", LIMITS.publicForm] }, async (req) => {
  const input = await readJson(req, schema);
  if (input.budgetMin !== undefined && input.budgetMax !== undefined && input.budgetMin > input.budgetMax) {
    throw badRequest("The minimum budget is higher than the maximum.", { budgetMax: "Must be at least the minimum" });
  }
  const user = await getCurrentUser();
  const service = input.serviceSlug ? await db.service.findUnique({ where: { slug: input.serviceSlug }, select: { id: true, name: true } }) : null;
  const data = {
    userId: user?.id, name: input.name, email: input.email, phone: input.phone, serviceId: service?.id,
    designId: await ownedDesignId(user, input.designId), briefId: await ownedBriefId(user, input.briefId),
    siteLocation: input.siteLocation, areaM2: input.areaM2, budgetMin: input.budgetMin, budgetMax: input.budgetMax,
    currency: input.currency, timeline: input.timeline, details: input.details, status: "SUBMITTED" as const, submittedAt: new Date(),
  };
  const draft = input.draftId && input.draftKey && verifyDraftKey(input.draftId, input.draftKey)
    ? await db.quoteRequest.findFirst({ where: { id: input.draftId, status: "DRAFT" } })
    : null;
  const q = draft
    ? await db.quoteRequest.update({ where: { id: draft.id }, data })
    : await db.quoteRequest.create({ data: { ...data, reference: humanReference("Q") } });

  await notifyAdmins(`Quote request ${q.reference}`, `${q.name} (${q.email})${service ? ` — ${service.name}` : ""}${q.designId ? " · design attached" : ""}`, "/admin/quotes");
  if (user) await notifyUser(user.id, "Quote request received", `Reference ${q.reference}. We will reply with a quote or questions.`, "/account/quotes");
  const mail = await sendEmail(q.email!, `Your quote request ${q.reference}`, `Hello ${q.name},\n\nWe received your quote request and will reply with a proposal or questions.\n\nReference: ${q.reference}`);
  return { reference: q.reference, emailed: mail.sent };
});
