import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { LIMITS } from "@/lib/security/rate-limit";

/** Consent-gated first-party analytics. The client only calls this after the visitor opts in. */
const schema = z.object({
  type: z.enum(["page_view", "project_view", "cta_click", "studio_open", "assistant_open", "explorer_open"]),
  path: z.string().max(300).regex(/^\//),
  subject: z.string().max(120).optional(),
  visitorId: z.string().uuid(),
});

export const POST = route({ rate: ["analytics", LIMITS.analytics] }, async (req) => {
  const e = await readJson(req, schema, 2048);
  await db.analyticsEvent.create({ data: { type: e.type, path: e.path.split("?")[0]!, subject: e.subject, visitorId: e.visitorId } });
  return new Response(null, { status: 204 });
});
