import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

const csvCell = (v: string) => (/^[=+\-@]/.test(v) ? `'${v}` : v).replace(/"/g, '""'); // neutralise spreadsheet formulas

export const GET = route({}, async (_req, { ip }) => {
  const actor = await requireCapability("admin:content");
  const subs = await db.newsletterSubscriber.findMany({ where: { confirmedAt: { not: null }, unsubscribedAt: null }, orderBy: { createdAt: "asc" } });
  await audit("admin.newsletter.export", { actorId: actor.id, ip, meta: { count: subs.length } });
  const body = ["email,confirmed_at", ...subs.map((s) => `"${csvCell(s.email)}","${s.confirmedAt!.toISOString()}"`)].join("\n");
  return new NextResponse(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="newsletter-subscribers.csv"', "Cache-Control": "no-store" } });
});
