import type { Prisma } from "@prisma/client";
import { Link } from "@/i18n/client";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/marketing/PageHeader";
import { ProjectCard } from "@/components/marketing/ProjectCard";
import { coverFor } from "@/lib/covers";
import { localize } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import { cn } from "@/lib/cn";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/config";
import { num } from "@/i18n/labels";

export async function generateMetadata() {
  const { m, locale } = await getI18n();
  return pageMeta({ title: m.projects.metaTitle, description: m.projects.metaDescription, path: "/projects", locale });
}

const STYLES = ["modern", "minimalist", "brutalist", "classical", "luxury"] as const;
const CATEGORIES = ["residential", "commercial", "interior", "landscape"] as const;

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ style?: string; category?: string }> }) {
  const { m, locale } = await getI18n();
  const P = m.projects;
  const sp = await searchParams;
  const style = STYLES.find((s) => s === sp.style);
  const category = CATEGORIES.find((c) => c === sp.category);
  const where: Prisma.ProjectWhereInput = { status: "PUBLISHED", ...(style ? { styles: { has: style } } : {}), ...(category ? { categories: { has: category } } : {}) };
  const projects = await db.project.findMany({ where, orderBy: [{ featured: "desc" }, { updatedAt: "desc" }] });
  const href = (k: "style" | "category", v?: string) => {
    const p = new URLSearchParams();
    const next = { style, category, [k]: v };
    if (next.style) p.set("style", next.style);
    if (next.category) p.set("category", next.category);
    const q = p.toString();
    return `/projects${q ? `?${q}` : ""}`;
  };
  const chip = (active: boolean) => cn("rounded-full border px-3.5 py-1.5 text-sm transition-colors", active ? "border-accent bg-accent/15 text-ink" : "border-line text-muted hover:text-ink");

  return (
    <>
      <PageHeader eyebrow={P.eyebrow} title={P.title}>{P.intro}</PageHeader>
      <div className="container py-10">
        <nav aria-label={P.filterLabel} className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-20 text-xs uppercase tracking-wider text-muted">{P.style}</span>
            <Link href={href("style", undefined)} className={chip(!style)} aria-current={!style ? "true" : undefined}>{P.all}</Link>
            {STYLES.map((s) => <Link key={s} href={href("style", s)} className={chip(style === s)} aria-current={style === s ? "true" : undefined}>{P.styles[s]}</Link>)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-20 text-xs uppercase tracking-wider text-muted">{P.type}</span>
            <Link href={href("category", undefined)} className={chip(!category)} aria-current={!category ? "true" : undefined}>{P.all}</Link>
            {CATEGORIES.map((c) => <Link key={c} href={href("category", c)} className={chip(category === c)} aria-current={category === c ? "true" : undefined}>{P.categories[c]}</Link>)}
          </div>
        </nav>
        <p className="mt-6 text-sm text-muted" role="status">{projects.length === 1 ? P.countOne : fmt(P.count, { n: num(locale, projects.length) })}</p>
        {projects.length === 0 ? (
          <p className="mt-10 text-muted">{P.none} <Link href="/projects" className="text-accent-ink hover:underline">{P.clear}</Link></p>
        ) : (
          <div className="mt-8 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => <ProjectCard key={p.id} m={m} locale={locale} priority={i < 3} p={{ ...localize(p, ["title", "summary"], locale), cover: coverFor(p.slug) }} />)}
          </div>
        )}
      </div>
    </>
  );
}
