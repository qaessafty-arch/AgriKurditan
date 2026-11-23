import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/marketing/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { coverFor } from "@/lib/covers";
import { pageMeta } from "@/lib/seo";

export const revalidate = 300;
export const metadata = pageMeta({ title: "Services", description: "Residential and commercial architecture, luxury villas, interiors, landscape, renovation, 3D visualization and construction consultation.", path: "/services" });

export default async function ServicesPage() {
  const services = await db.service.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" }, include: { projects: { where: { status: "PUBLISHED" }, select: { slug: true }, take: 1 } } });
  return (
    <>
      <PageHeader eyebrow="Services" title="One studio for architecture, interiors and landscape." actions={<><ButtonLink href="/consultation">Book a consultation</ButtonLink><ButtonLink href="/pricing" variant="secondary">See pricing</ButtonLink></>}>
        Every service includes interactive 3D models you can explore and adjust before decisions are made.
      </PageHeader>
      <div className="container grid gap-x-6 gap-y-14 py-16 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => {
          const cover = s.projects[0] ? coverFor(s.projects[0].slug) : null;
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
