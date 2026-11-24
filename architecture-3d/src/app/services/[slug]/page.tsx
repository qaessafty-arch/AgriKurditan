import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/marketing/PageHeader";
import { OfferingCard } from "@/components/marketing/OfferingCard";
import { ProjectCard } from "@/components/marketing/ProjectCard";
import { ButtonLink } from "@/components/ui/Button";
import { coverFor } from "@/lib/covers";
import { localize, tr } from "@/lib/content";
import { jsonLd, pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { getI18n } from "@/i18n/server";
import { fmt, localePath } from "@/i18n/config";
import { num } from "@/i18n/labels";

async function load(slug: string) {
  return db.service.findFirst({
    where: { slug, published: true },
    include: { offerings: { where: { published: true }, orderBy: { sortOrder: "asc" } }, projects: { where: { status: "PUBLISHED" }, orderBy: { featured: "desc" }, take: 3 } },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { locale } = await getI18n();
  const s = await load((await params).slug);
  return s ? pageMeta({ title: tr(s, "name", locale), description: tr(s, "tagline", locale), path: `/services/${s.slug}`, locale }) : {};
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { m, locale } = await getI18n();
  const raw = await load((await params).slug);
  if (!raw) notFound();
  const s = localize(raw, ["name", "tagline", "description", "benefits", "process"], locale);
  const steps = (s.process as { title: string; detail: string }[]) ?? [];
  const hero = raw.projects[0] ? coverFor(raw.projects[0].slug) : null;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "Service", name: s.name, description: s.description, inLanguage: locale, provider: { "@type": "ProfessionalService", name: SITE.name, url: SITE.url }, url: `${SITE.url}${localePath(`/services/${s.slug}`, locale)}` }) }} />
      <PageHeader eyebrow={m.services.serviceEyebrow} title={s.name} actions={<><ButtonLink href={`/quote?service=${s.slug}`}>{m.footer.requestQuote}</ButtonLink><ButtonLink href={`/consultation?service=${s.slug}`} variant="secondary">{m.footer.bookConsultation}</ButtonLink></>}>
        {s.tagline}
      </PageHeader>
      {hero && (
        <div className="container pt-10">
          <div className="relative aspect-[21/9] overflow-hidden rounded-xl border hairline">
            <Image src={hero} alt={fmt(m.projects.renderedAlt, { title: tr(raw.projects[0]!, "title", locale) })} fill sizes="100vw" className="object-cover" priority />
          </div>
        </div>
      )}
      <div className="container grid gap-12 py-16 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="text-lg leading-relaxed text-ink/90">{s.description}</p>
          <h2 className="mt-12 font-display text-3xl text-ink">{m.services.process}</h2>
          <ol className="mt-6 space-y-6">
            {steps.map((p, i) => (
              <li key={p.title} className="grid grid-cols-[2.5rem_1fr] gap-3">
                <span className="font-mono text-sm text-accent-ink">{num(locale, i + 1).padStart(2, locale === "en" ? "0" : "٠")}</span>
                <div><p className="font-medium text-ink">{p.title}</p><p className="mt-1 text-sm text-muted">{p.detail}</p></div>
              </li>
            ))}
          </ol>
        </div>
        <aside className="card h-fit p-6">
          <h2 className="font-display text-2xl text-ink">{m.services.benefits}</h2>
          <ul className="mt-4 space-y-3 text-sm">{s.benefits.map((b) => <li key={b} className="flex gap-2"><span className="text-accent" aria-hidden>✓</span><span className="text-ink/90">{b}</span></li>)}</ul>
        </aside>
      </div>
      {raw.offerings.length > 0 && (
        <section className="border-t hairline py-16">
          <div className="container">
            <h2 className="font-display text-3xl text-ink">{m.services.packages}</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{raw.offerings.map((o) => <OfferingCard key={o.id} o={o} m={m} locale={locale} />)}</div>
          </div>
        </section>
      )}
      {raw.projects.length > 0 && (
        <section className="border-t hairline py-16">
          <div className="container">
            <h2 className="font-display text-3xl text-ink">{m.services.related}</h2>
            <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{raw.projects.map((p) => <ProjectCard key={p.id} m={m} locale={locale} p={{ ...localize(p, ["title", "summary"], locale), cover: coverFor(p.slug) }} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
