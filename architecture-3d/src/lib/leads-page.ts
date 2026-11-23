import "server-only";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

/** Shared server data for consultation/quote pages: prefill, services, and owned attachments. */
export async function leadPageData(sp: { design?: string; brief?: string }) {
  const user = await getCurrentUser();
  const services = await db.service.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } });
  const design = sp.design && user ? await db.design.findFirst({ where: { id: sp.design, userId: user.id }, select: { id: true, name: true } }) : null;
  const brief = sp.brief ? await db.aiBrief.findFirst({ where: { id: sp.brief, OR: [{ userId: null }, { userId: user?.id ?? "-" }] }, select: { id: true } }) : null;
  return { user, services, design, brief, prefill: { name: user?.name, email: user?.email, phone: user?.phone } };
}
