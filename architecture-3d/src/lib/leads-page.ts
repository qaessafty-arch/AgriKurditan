import "server-only";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { tr } from "@/lib/content";
import type { Locale } from "@/i18n/config";

/** Shared server data for consultation/quote pages: prefill, services, and owned attachments. */
export async function leadPageData(sp: { design?: string; brief?: string }, locale: Locale = "en") {
  const user = await getCurrentUser();
  const rows = await db.service.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" }, select: { slug: true, name: true, translations: true } });
  const services = rows.map((s) => ({ slug: s.slug, name: tr(s, "name", locale) }));
  const design = sp.design && user ? await db.design.findFirst({ where: { id: sp.design, userId: user.id }, select: { id: true, name: true } }) : null;
  const brief = sp.brief ? await db.aiBrief.findFirst({ where: { id: sp.brief, OR: [{ userId: null }, { userId: user?.id ?? "-" }] }, select: { id: true } }) : null;
  return { user, services, design, brief, prefill: { name: user?.name, email: user?.email, phone: user?.phone } };
}
