import Image from "next/image";
import { Link } from "@/i18n/client";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/marketing/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { coverFor } from "@/lib/covers";
import { localize } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import { getI18n } from "@/i18n/server";

export async function generateMetadata() {
  const { m, locale } = await getI18n();
  return pageMeta({ title: m.services.metaTitle, description: m.services.metaDescription, path: "/services", locale });
}

export default async function ServicesPage() {
  const { m, locale } = await getI18n();
  const services = await db.service.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" }, include: { projects: { where: { status: "PUBLISHED" }, select: { slug: true }, take: 1 } } });
  return (
    <>
      <PageHeader eyebrow={m.services.eyebrow} title={m.services.title} actions={<><ButtonLink href="/consultation">{m.footer.bookConsultation}</ButtonLink><ButtonLink href="/pricing" variant="secondary">{m.services.seePricing}</ButtonLink></>}>
        {m.services.intro}
      </PageHeader>
      <div className="container grid gap-x-6 gap-y-14 py-16 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((raw) => {
          const s = localize(raw, ["name", "tagline"], locale);
          const cover = raw.projects[0] ? coverFor(raw.projects[0].slug) : null;
          return (
            <Link key={s.id} href={`/services/${s.slug}`} className="group">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border hairline bg-surface">
                {cover && <Image src={cover} alt="" fill sizes="(min-width:1024px) 33vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />}
              </div>
              <h2 className="mt-4 font-display text-2xl text-ink group-hover:text-accent-ink">{s.name}</h2>
              <p className="mt-1 text-sm text-muted">{s.tagline}</p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
