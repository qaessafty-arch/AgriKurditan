import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/marketing/PageHeader";
import { ProjectCard } from "@/components/marketing/ProjectCard";
import { coverFor } from "@/lib/covers";
import { pageMeta } from "@/lib/seo";
import { cn } from "@/lib/cn";

export const metadata = pageMeta({ title: "Projects", description: "Residential, commercial, interior and landscape projects, each explorable as an interactive 3D model.", path: "/projects" });

const STYLES = ["modern", "minimalist", "brutalist", "classical", "luxury"] as const;
const CATEGORIES = ["residential", "commercial", "interior", "landscape"] as const;

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ style?: string; category?: string }> }) {
  const sp = await searchParams;
  const style = STYLES.find((s) => s === sp.style);
  const category = CATEGORIES.find((c) => c === sp.category);
  const where: Prisma.ProjectWhereInput = {
    status: "PUBLISHED",
    ...(style ? { styles: { has: style } } : {}),
    ...(category ? { categories: { has: category } } : {}),
  };
  const projects = await db.project.findMany({ where, orderBy: [{ featured: "desc" }, { updatedAt: "desc" }] });
  const href = (k: "style" | "category", v?: string) => {
    const p = new URLSearchParams();
    const next = { style, category, [k]: v };
    if (next.style) p.set("style", next.style);
    if (next.category) p.set("category", next.category);
    const q = p.toString();
    return `/projects${q ? `?${q}` : ""}`;
  };
  const chip = (active: boolean) => cn("rounded-full border px-3.5 py-1.5 text-sm capitalize transition-colors", active ? "border-accent bg-accent/15 text-ink" : "border-line text-muted hover:text-ink");

  return (
    <>
      <PageHeader eyebrow="Portfolio" title="Projects you can walk through.">
        Concept studies and commissions. Open any project to explore it in 3D, then adapt it in the design studio.
      </PageHeader>
      <div className="container py-10">
        <nav aria-label="Filter projects" className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-20 text-xs uppercase tracking-wider text-muted">Style</span>
            <Link href={href("style", undefined)} className={chip(!style)} aria-current={!style ? "true" : undefined}>All</Link>
            {STYLES.map((s) => <Link key={s} href={href("style", s)} className={chip(style === s)} aria-current={style === s ? "true" : undefined}>{s}</Link>)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-20 text-xs uppercase tracking-wider text-muted">Type</span>
            <Link href={href("category", undefined)} className={chip(!category)} aria-current={!category ? "true" : undefined}>All</Link>
            {CATEGORIES.map((c) => <Link key={c} href={href("category", c)} className={chip(category === c)} aria-current={category === c ? "true" : undefined}>{c}</Link>)}
          </div>
        </nav>
        <p className="mt-6 text-sm text-muted" role="status">{projects.length} project{projects.length === 1 ? "" : "s"}</p>
        {projects.length === 0 ? (
          <p className="mt-10 text-muted">No projects match these filters yet. <Link href="/projects" className="text-accent-ink hover:underline">Clear filters</Link></p>
        ) : (
          <div className="mt-8 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => <ProjectCard key={p.id} priority={i < 3} p={{ ...p, cover: coverFor(p.slug) }} />)}
          </div>
        )}
      </div>
    </>
  );
}
