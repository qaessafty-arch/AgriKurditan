import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { LazyProjectViewer } from "@/components/projects/LazyProjectViewer";
import { ProjectCard } from "@/components/marketing/ProjectCard";
import { ButtonLink } from "@/components/ui/Button";
import { coverFor } from "@/lib/covers";
import { titleCase } from "@/lib/format";
import { jsonLd, pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { coerceConfig } from "@/three/config";
import { encodeConfig } from "@/three/share";
import { existsSync } from "node:fs";
import path from "node:path";

async function load(slug: string) {
  return db.project.findFirst({ where: { slug, status: "PUBLISHED" }, include: { service: { select: { slug: true, name: true } } } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await load((await params).slug);
  if (!p) return {};
  return pageMeta({ title: p.title, description: p.summary, path: `/projects/${p.slug}`, image: coverFor(p.slug) ?? undefined });
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await load((await params).slug);
  if (!p) notFound();
  // Aggregate view counter: no personal data, so it does not need analytics consent.
  await db.project.update({ where: { id: p.id }, data: { viewCount: { increment: 1 } } });

  const cover = coverFor(p.slug);
  const gallery = ["interior", "aerial", "night"].map((v) => `/renders/${p.slug}-${v}.jpg`).filter((rel) => existsSync(path.join(process.cwd(), "public", rel)));
  const specs = (p.specs as { label: string; value: string }[]) ?? [];
  const related = await db.project.findMany({
    where: { status: "PUBLISHED", id: { not: p.id }, OR: [{ styles: { hasSome: p.styles } }, { categories: { hasSome: p.categories } }] },
    take: 3, orderBy: { featured: "desc" },
  });
  const studioHref = `/studio?plan=${p.presetId}&config=${encodeConfig(coerceConfig(p.config))}`;

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "CreativeWork", name: p.title, description: p.description, url: `${SITE.url}/projects/${p.slug}`, ...(cover ? { image: `${SITE.url}${cover}` } : {}), creator: { "@type": "Organization", name: SITE.name }, keywords: [...p.styles, ...p.categories].join(", ") }) }} />
      <header className="container pt-12 sm:pt-16">
        <nav aria-label="Breadcrumb" className="text-sm text-muted"><Link href="/projects" className="hover:text-ink">Projects</Link> <span aria-hidden>/</span> <span className="text-ink">{p.title}</span></nav>
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="eyebrow">{[...p.styles, ...p.categories].map(titleCase).join(" · ")}</p>
            <h1 className="mt-3 text-display-lg text-ink">{p.title}</h1>
            <p className="mt-4 text-lg leading-relaxed text-muted">{p.summary}</p>
            {p.isConcept && <p className="mt-3 inline-block rounded border hairline px-2.5 py-1 text-xs text-muted">Concept study: a design exploration, not a built commission.</p>}
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={`/quote?project=${p.slug}${p.service ? `&service=${p.service.slug}` : ""}`}>Enquire about a project like this</ButtonLink>
            <ButtonLink href={studioHref} variant="secondary">Customise in studio</ButtonLink>
          </div>
        </div>
      </header>

      <div className="container mt-10"><LazyProjectViewer presetId={p.presetId} config={p.config} title={p.title} poster={cover} /></div>

      <div className="container grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-10">
          <p className="text-lg leading-relaxed text-ink/90">{p.description}</p>
          {(p.challenge || p.solution || p.outcome) && (
            <section aria-labelledby="case-study" className="grid gap-6 sm:grid-cols-3">
              <h2 id="case-study" className="sr-only">Case study</h2>
              {[["Challenge", p.challenge], ["Approach", p.solution], ["Outcome", p.outcome]].map(([k, v]) => v && (
                <div key={k} className="border-t-2 border-accent/50 pt-4"><p className="eyebrow">{k}</p><p className="mt-2 text-sm leading-relaxed text-ink/90">{v}</p></div>
              ))}
            </section>
          )}
          {gallery.length > 0 && (
            <section aria-labelledby="gallery">
              <h2 id="gallery" className="font-display text-3xl text-ink">Gallery</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {gallery.map((src) => (
                  <div key={src} className="relative aspect-[16/10] overflow-hidden rounded-lg border hairline">
                    <Image src={src} alt={`${p.title}: ${src.split("-").pop()?.replace(".jpg", "")} view rendered from the 3D model`} fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className="card h-fit p-6">
          <h2 className="font-display text-2xl text-ink">Specifications</h2>
          <dl className="mt-4 divide-y divide-[var(--line)] text-sm">
            {p.showLocation && p.location && <div className="flex justify-between py-2.5"><dt className="text-muted">Location</dt><dd>{p.location}</dd></div>}
            {p.year && <div className="flex justify-between py-2.5"><dt className="text-muted">Year</dt><dd>{p.year}</dd></div>}
            <div className="flex justify-between py-2.5"><dt className="text-muted">Style</dt><dd>{p.styles.map(titleCase).join(", ")}</dd></div>
            {specs.map((s) => <div key={s.label} className="flex justify-between py-2.5"><dt className="text-muted">{s.label}</dt><dd>{s.value}</dd></div>)}
            {p.service && <div className="flex justify-between py-2.5"><dt className="text-muted">Service</dt><dd><Link href={`/services/${p.service.slug}`} className="text-accent-ink hover:underline">{p.service.name}</Link></dd></div>}
          </dl>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="border-t hairline py-16">
          <div className="container">
            <h2 className="font-display text-3xl text-ink">Related projects</h2>
            <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{related.map((r) => <ProjectCard key={r.id} p={{ ...r, cover: coverFor(r.slug) }} />)}</div>
          </div>
        </section>
      )}
    </article>
  );
}
