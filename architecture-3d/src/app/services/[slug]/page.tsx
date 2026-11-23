import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/marketing/PageHeader";
import { OfferingCard } from "@/components/marketing/OfferingCard";
import { ProjectCard } from "@/components/marketing/ProjectCard";
import { ButtonLink } from "@/components/ui/Button";
import { coverFor } from "@/lib/covers";
import { jsonLd, pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const revalidate = 300;

async function load(slug: string) {
  return db.service.findFirst({
    where: { slug, published: true },
    include: {
      offerings: { where: { published: true }, orderBy: { sortOrder: "asc" } },
      projects: { where: { status: "PUBLISHED" }, orderBy: { featured: "desc" }, take: 3 },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const s = await load((await params).slug);
  return s ? pageMeta({ title: s.name, description: s.tagline, path: `/services/${s.slug}` }) : {};
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const s = await load((await params).slug);
  if (!s) notFound();
  const process = (s.process as { title: string; detail: string }[]) ?? [];
  const hero = s.projects[0] ? coverFor(s.projects[0].slug) : null;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "Service", name: s.name, description: s.description, provider: { "@type": "ProfessionalService", name: SITE.name, url: SITE.url }, url: `${SITE.url}/services/${s.slug}` }) }} />
      <PageHeader eyebrow="Service" title={s.name} actions={<><ButtonLink href={`/quote?service=${s.slug}`}>Request a quote</ButtonLink><ButtonLink href={`/consultation?service=${s.slug}`} variant="secondary">Book a consultation</ButtonLink></>}>
        {s.tagline}
      </PageHeader>
      {hero && (
        <div className="container pt-10">
          <div className="relative aspect-[21/9] overflow-hidden rounded-xl border hairline">
            <Image src={hero} alt={`${s.projects[0]!.title}, rendered from its 3D model`} fill sizes="100vw" className="object-cover" priority />
          </div>
        </div>
      )}
      <div className="container grid gap-12 py-16 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="text-lg leading-relaxed text-ink/90">{s.description}</p>
          <h2 className="mt-12 font-display text-3xl text-ink">Process</h2>
          <ol className="mt-6 space-y-6">
            {process.map((p, i) => (
              <li key={p.title} className="grid grid-cols-[2.5rem_1fr] gap-3">
                <span className="font-mono text-sm text-accent-ink">{String(i + 1).padStart(2, "0")}</span>
                <div><p className="font-medium text-ink">{p.title}</p><p className="mt-1 text-sm text-muted">{p.detail}</p></div>
              </li>
            ))}
          </ol>
        </div>
        <aside className="card h-fit p-6">
          <h2 className="font-display text-2xl text-ink">Benefits</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {s.benefits.map((b) => <li key={b} className="flex gap-2"><span className="text-accent" aria-hidden>✓</span><span className="text-ink/90">{b}</span></li>)}
          </ul>
        </aside>
      </div>
      {s.offerings.length > 0 && (
        <section className="border-t hairline py-16">
          <div className="container">
            <h2 className="font-display text-3xl text-ink">Packages and pricing</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{s.offerings.map((o) => <OfferingCard key={o.id} o={o} />)}</div>
          </div>
        </section>
      )}
      {s.projects.length > 0 && (
        <section className="border-t hairline py-16">
          <div className="container">
            <h2 className="font-display text-3xl text-ink">Related projects</h2>
            <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{s.projects.map((p) => <ProjectCard key={p.id} p={{ ...p, cover: coverFor(p.slug) }} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
