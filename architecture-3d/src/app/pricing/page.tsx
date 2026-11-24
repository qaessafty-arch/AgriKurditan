import type { OfferingKind } from "@prisma/client";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/marketing/PageHeader";
import { OfferingCard } from "@/components/marketing/OfferingCard";
import { ButtonLink } from "@/components/ui/Button";
import { pageMeta } from "@/lib/seo";
import { getI18n } from "@/i18n/server";

export const revalidate = 120;
export async function generateMetadata() {
  const { m, locale } = await getI18n();
  return pageMeta({ title: m.pricing.metaTitle, description: m.pricing.metaDescription, path: "/pricing", locale });
}

const GROUPS: { id: string; key: "clients" | "studio" | "architects" | "partners"; kinds: OfferingKind[] }[] = [
  { id: "clients", key: "clients", kinds: ["CONSULTATION", "SERVICE_PACKAGE", "VISUALIZATION_PACKAGE"] },
  { id: "studio-pro", key: "studio", kinds: ["PREMIUM_FEATURE"] },
  { id: "architects", key: "architects", kinds: ["ARCHITECT_SUBSCRIPTION", "FEATURED_PLACEMENT"] },
  { id: "partners", key: "partners", kinds: ["PARTNERSHIP", "CUSTOM_COMMISSION"] },
];

export default async function PricingPage() {
  const { m, locale } = await getI18n();
  const P = m.pricing;
  const offerings = await db.offering.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" } });
  return (
    <>
      <PageHeader eyebrow={P.eyebrow} title={P.title}>{P.intro}</PageHeader>
      <div className="container space-y-20 py-16">
        {GROUPS.map((g) => {
          const items = offerings.filter((o) => g.kinds.includes(o.kind));
          if (!items.length) return null;
          return (
            <section key={g.id} id={g.id} aria-labelledby={`${g.id}-h`} className="scroll-mt-24">
              <h2 id={`${g.id}-h`} className="font-display text-3xl text-ink">{P.groups[g.key].title}</h2>
              <p className="mt-2 text-muted">{P.groups[g.key].intro}</p>
              <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{items.map((o) => <OfferingCard key={o.id} o={o} m={m} locale={locale} />)}</div>
            </section>
          );
        })}
        <div className="card flex flex-col gap-4 p-8 md:flex-row md:items-center md:justify-between">
          <div><h2 className="font-display text-2xl text-ink">{P.notSure}</h2><p className="mt-1 text-sm text-muted">{P.notSureBody}</p></div>
          <ButtonLink href="/consultation">{m.footer.bookConsultation}</ButtonLink>
        </div>
      </div>
    </>
  );
}
