import { Link } from "@/i18n/client";
import { CinematicExperience } from "@/components/cinematic/CinematicExperience";
import { ProjectCard } from "@/components/marketing/ProjectCard";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { ReviewsStrip } from "@/components/marketing/Reviews";
import { ButtonLink } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { coverFor } from "@/lib/covers";
import { localize } from "@/lib/content";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/config";
import { num } from "@/i18n/labels";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";

export async function generateMetadata() {
  const { m, locale } = await getI18n();
  return pageMeta({ title: `${SITE.name} — ${m.meta.tagline}`, description: m.meta.description, path: "/", locale });
}

const CAP_HREFS = ["/explore", "/studio", "/assistant", "/consultation"];

export default async function HomePage() {
  const { m, locale } = await getI18n();
  const H = m.home;
  const [projects, services] = await Promise.all([
    db.project.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ featured: "desc" }, { updatedAt: "desc" }], take: 3 }),
    db.service.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" }, take: 8 }),
  ]);

  return (
    <>
      <CinematicExperience />

      <section className="border-t hairline py-24" aria-labelledby="capabilities-heading">
        <div className="container">
          <SectionHeading eyebrow={H.platformEyebrow} title={H.platformTitle} />
          <h2 id="capabilities-heading" className="sr-only">{H.platformEyebrow}</h2>
          <div className="mt-14 grid gap-px overflow-hidden rounded-lg border hairline bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
            {H.capabilities.map((c, i) => (
              <Link key={c.title} href={CAP_HREFS[i]!} className="group bg-canvas p-7 transition-colors hover:bg-surface">
                <span className="font-mono text-xs text-muted">0{i + 1}</span>
                <h3 className="mt-6 font-display text-2xl text-ink">{c.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{c.body}</p>
                <span className="mt-6 inline-block text-sm text-accent-ink transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">{m.common.open} {m.common.arrow}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {projects.length > 0 && (
        <section className="border-t hairline py-24" aria-labelledby="projects-heading">
          <div className="container">
            <SectionHeading eyebrow={H.portfolioEyebrow} title={H.portfolioTitle} action={<ButtonLink href="/projects" variant="secondary">{H.viewAllProjects}</ButtonLink>}>
              <span id="projects-heading">{H.portfolioBody}</span>
            </SectionHeading>
            <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p, i) => <ProjectCard key={p.id} m={m} locale={locale} priority={i === 0} p={{ ...localize(p, ["title", "summary"], locale), cover: coverFor(p.slug) }} />)}
            </div>
          </div>
        </section>
      )}

      {services.length > 0 && (
        <section className="border-t hairline bg-surface/40 py-24" aria-labelledby="services-heading">
          <div className="container">
            <SectionHeading eyebrow={H.servicesEyebrow} title={H.servicesTitle} action={<ButtonLink href="/services" variant="secondary">{H.allServices}</ButtonLink>} />
            <h2 id="services-heading" className="sr-only">{H.servicesEyebrow}</h2>
            <ul className="mt-12 divide-y divide-[var(--line)] border-y hairline">
              {services.map((raw) => {
                const s = localize(raw, ["name", "tagline"], locale);
                return (
                  <li key={s.id}>
                    <Link href={`/services/${s.slug}`} className="group grid gap-2 py-6 md:grid-cols-[1fr_1.4fr_auto] md:items-center md:gap-8">
                      <span className="font-display text-2xl text-ink transition-colors group-hover:text-accent-ink">{s.name}</span>
                      <span className="text-sm text-muted">{s.tagline}</span>
                      <span className="text-sm text-accent-ink" aria-hidden>{m.common.arrow}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      <section className="border-t hairline py-24" aria-labelledby="process-heading">
        <div className="container">
          <SectionHeading eyebrow={H.processEyebrow} title={H.processTitle} />
          <h2 id="process-heading" className="sr-only">{H.processEyebrow}</h2>
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {H.process.map((p, i) => (
              <li key={p.title} className="border-t-2 border-accent/60 pt-5">
                <span className="font-mono text-xs text-muted">{fmt(H.step, { n: num(locale, i + 1) })}</span>
                <h3 className="mt-2 font-display text-2xl text-ink">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-12 max-w-3xl rounded border hairline bg-surface/60 p-4 text-xs leading-relaxed text-muted">{H.disclaimer}</p>
        </div>
      </section>

      <ReviewsStrip />

      <section className="border-t hairline py-24">
        <div className="container flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">{H.ctaEyebrow}</p>
            <h2 className="mt-3 text-display-lg text-ink text-balance">{H.ctaTitle}</h2>
            <p className="mt-4 text-muted">{H.ctaBody}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/consultation" size="lg">{H.bookConsultation}</ButtonLink>
            <ButtonLink href="/quote" size="lg" variant="secondary">{H.requestQuote}</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
