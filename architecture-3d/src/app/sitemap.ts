import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, services] = await Promise.all([
    db.project.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    db.service.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
  ]);
  const staticPaths = ["", "/projects", "/services", "/explore", "/studio", "/assistant", "/pricing", "/consultation", "/quote", "/contact", "/reviews", "/privacy", "/terms"];
  return [
    ...staticPaths.map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...services.map((s) => ({ url: `${SITE.url}/services/${s.slug}`, lastModified: s.updatedAt, priority: 0.8 })),
    ...projects.map((p) => ({ url: `${SITE.url}/projects/${p.slug}`, lastModified: p.updatedAt, priority: 0.8 })),
  ];
}
