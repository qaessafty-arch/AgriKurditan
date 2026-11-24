import { notFound } from "next/navigation";
import Image from "next/image";
import { existsSync } from "node:fs";
import path from "node:path";
import { Link } from "@/i18n/client";
import { db } from "@/lib/db";
import { LazyProjectViewer } from "@/components/projects/LazyProjectViewer";
import { ProjectCard } from "@/components/marketing/ProjectCard";
import { ButtonLink } from "@/components/ui/Button";
import { coverFor } from "@/lib/covers";
import { localize, tr } from "@/lib/content";
import { jsonLd, pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { coerceConfig } from "@/three/config";
import { encodeConfig } from "@/three/share";
import { getI18n } from "@/i18n/server";
import { fmt, localePath } from "@/i18n/config";
import { num } from "@/i18n/labels";

async function load(slug: string) {
  return db.project.findFirst({ where: { slug, status: "PUBLISHED" }, include: { service: { select: { slug: true, name: true, translations: true } } } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { locale } = await getI18n();
  const p = await load((await params).slug);
  if (!p) return {};
  return pageMeta({ title: tr(p, "title", locale), description: tr(p, "summary", locale), path: `/projects/${p.slug}`, image: coverFor(p.slug) ?? undefined, locale });
}

/** Spec values like "245 m²" or "38%" are re-rendered with locale digits. */
function localSpec(value: string, locale: Parameters<typeof num>[0]) {
  return value.replace(/\d+(\.\d+)?/g, (d) => num(locale, Number(d), d.includes(".") ? 1 : 0));
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { m, locale } = await getI18n();
  const P = m.projects;
  const raw = await load((await params).slug);
  if (!raw) notFound();
  // Aggregate view counter: no personal data, so it does not need analytics consent.
  await db.project.update({ where: { id: raw.id }, data: { viewCount: { increment: 1 } } });
  const p = localize(raw, ["title", "summary", "description", "challenge", "solution", "outcome"], locale);

  const cover = coverFor(p.slug);
  const gallery = (["interior", "garden", "night"] as const).map((v) => ({ v, src: `/renders/${p.slug}-${v}.jpg` })).filter(({ src }) => existsSync(path.join(process.cwd(), "public", src)));
  const specs = (p.specs as { label: string; value: string }[]) ?? [];
  const related = await db.project.findMany({
    where: { status: "PUBLISHED", id: { not: p.id }, OR: [{ styles: { hasSome: p.styles } }, { categories: { hasSome: p.categories } }] },
    take: 3, orderBy: { featured: "desc" },
  });
  const studioHref = `/studio?plan=${p.presetId}&config=${encodeConfig(coerceConfig(p.config))}`;
  const tags = [...p.styles.map((s) => P.styles[s as keyof typeof P.styles] ?? s), ...p.categories.map((c) => P.categories[c as keyof typeof P.categories] ?? c)];

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "CreativeWork", name: p.title, description: p.description, inLanguage: locale, url: `${SITE.url}${localePath(`/projects/${p.slug}`, locale)}`, ...(cover ? { image: `${SITE.url}${cover}` } : {}), creator: { "@type": "Organization", name: SITE.name } }) }} />
      <header className="container pt-12 sm:pt-16">
        <nav aria-label={P.breadcrumb} className="text-sm text-muted"><Link href="/projects" className="hover:text-ink">{m.nav.projects}</Link> <span aria-hidden>/</span> <span className="text-ink">{p.title}</span></nav>
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="eyebrow">{tags.join(" · ")}</p>
            <h1 className="mt-3 text-display-lg text-ink">{p.title}</h1>
            <p className="mt-4 text-lg leading-relaxed text-muted">{p.summary}</p>
            {p.isConcept && <p className="mt-3 inline-block rounded border hairline px-2.5 py-1 text-xs text-muted">{P.conceptNote}</p>}
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={`/quote?project=${p.slug}${p.service ? `&service=${p.service.slug}` : ""}`}>{P.enquire}</ButtonLink>
            <ButtonLink href={studioHref} variant="secondary">{P.customise}</ButtonLink>
          </div>
        </div>
      </header>

      <div className="container mt-10"><LazyProjectViewer presetId={p.presetId} config={p.config} title={p.title} poster={cover} /></div>

      <div className="container grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-10">
          <p className="text-lg leading-relaxed text-ink/90">{p.description}</p>
          {(p.challenge || p.solution || p.outcome) && (
            <section aria-labelledby="case-study" className="grid gap-6 sm:grid-cols-3">
              <h2 id="case-study" className="sr-only">{P.caseStudy}</h2>
              {([[P.challenge, p.challenge], [P.approach, p.solution], [P.outcome, p.outcome]] as const).map(([k, v]) => v && (
                <div key={k} className="border-t-2 border-accent/50 pt-4"><p className="eyebrow">{k}</p><p className="mt-2 text-sm leading-relaxed text-ink/90">{v}</p></div>
              ))}
            </section>
          )}
          {gallery.length > 0 && (
            <section aria-labelledby="gallery">
              <h2 id="gallery" className="font-display text-3xl text-ink">{P.gallery}</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {gallery.map(({ v, src }) => (
                  <div key={src} className="relative aspect-[16/10] overflow-hidden rounded-lg border hairline">
                    <Image src={src} alt={fmt(P.viewAlt, { title: p.title, view: P.views[v] })} fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className="card h-fit p-6">
          <h2 className="font-display text-2xl text-ink">{P.specs}</h2>
          <dl className="mt-4 divide-y divide-[var(--line)] text-sm">
            {p.showLocation && p.location && <div className="flex justify-between gap-4 py-2.5"><dt className="text-muted">{P.location}</dt><dd dir="auto">{p.location}</dd></div>}
            {p.year && <div className="flex justify-between gap-4 py-2.5"><dt className="text-muted">{P.year}</dt><dd>{num(locale, p.year).replace(/[٬,]/g, "")}</dd></div>}
            <div className="flex justify-between gap-4 py-2.5"><dt className="text-muted">{P.style}</dt><dd>{p.styles.map((s) => P.styles[s as keyof typeof P.styles] ?? s).join("، ")}</dd></div>
            {specs.map((s) => <div key={s.label} className="flex justify-between gap-4 py-2.5"><dt className="text-muted">{P.specLabels[s.label] ?? s.label}</dt><dd>{localSpec(s.value, locale)}</dd></div>)}
            {p.service && <div className="flex justify-between gap-4 py-2.5"><dt className="text-muted">{P.service}</dt><dd><Link href={`/services/${p.service.slug}`} className="text-accent-ink hover:underline">{tr(p.service, "name", locale)}</Link></dd></div>}
          </dl>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="border-t hairline py-16">
          <div className="container">
            <h2 className="font-display text-3xl text-ink">{P.related}</h2>
            <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{related.map((r) => <ProjectCard key={r.id} m={m} locale={locale} p={{ ...localize(r, ["title", "summary"], locale), cover: coverFor(r.slug) }} />)}</div>
          </div>
        </section>
      )}
    </article>
  );
}
