import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { optionalText } from "@/lib/validation";
import { LIMITS } from "@/lib/security/rate-limit";
import { humanReference } from "@/lib/security/tokens";
import { draftKey } from "@/lib/leads";

/** Records that a visitor started a quote request (used for abandoned-quote analytics). */
export const POST = route({ rate: ["form", LIMITS.publicForm] }, async (req) => {
  const input = await readJson(req, z.object({ serviceSlug: optionalText(80) }));
  const user = await getCurrentUser();
  const service = input.serviceSlug ? await db.service.findUnique({ where: { slug: input.serviceSlug }, select: { id: true } }) : null;
  const q = await db.quoteRequest.create({ data: { reference: humanReference("Q"), userId: user?.id, serviceId: service?.id, status: "DRAFT" } });
  return { id: q.id, key: draftKey(q.id) };
});
