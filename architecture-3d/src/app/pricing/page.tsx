import type { OfferingKind } from "@prisma/client";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/marketing/PageHeader";
import { OfferingCard } from "@/components/marketing/OfferingCard";
import { ButtonLink } from "@/components/ui/Button";
import { pageMeta } from "@/lib/seo";

export const revalidate = 120;
export const metadata = pageMeta({ title: "Pricing", description: "Consultations, design and visualization packages, Studio Pro, architect plans and partnerships.", path: "/pricing" });

const GROUPS: { id: string; title: string; intro: string; kinds: OfferingKind[] }[] = [
  { id: "clients", title: "For clients", intro: "Start with a consultation or a fixed-scope package.", kinds: ["CONSULTATION", "SERVICE_PACKAGE", "VISUALIZATION_PACKAGE"] },
  { id: "studio-pro", title: "Design studio", intro: "Advanced features for the interactive studio.", kinds: ["PREMIUM_FEATURE"] },
  { id: "architects", title: "For architects", intro: "Publish your projects with interactive 3D previews.", kinds: ["ARCHITECT_SUBSCRIPTION", "FEATURED_PLACEMENT"] },
  { id: "partners", title: "Partners and commissions", intro: "Priced to scope after a conversation.", kinds: ["PARTNERSHIP", "CUSTOM_COMMISSION"] },
];

export default async function PricingPage() {
  const offerings = await db.offering.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" } });
  return (
    <>
      <PageHeader eyebrow="Pricing" title="Clear prices, confirmed before work begins.">
        Orders are paid by bank transfer or at our office, and confirmed once payment is verified. Larger commissions are quoted after a consultation.
      </PageHeader>
      <div className="container space-y-20 py-16">
        {GROUPS.map((g) => {
          const items = offerings.filter((o) => g.kinds.includes(o.kind));
          if (!items.length) return null;
          return (
            <section key={g.id} id={g.id} aria-labelledby={`${g.id}-h`} className="scroll-mt-24">
              <h2 id={`${g.id}-h`} className="font-display text-3xl text-ink">{g.title}</h2>
              <p className="mt-2 text-muted">{g.intro}</p>
              <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{items.map((o) => <OfferingCard key={o.id} o={o} />)}</div>
            </section>
          );
        })}
        <div className="card flex flex-col gap-4 p-8 md:flex-row md:items-center md:justify-between">
          <div><h2 className="font-display text-2xl text-ink">Not sure where to start?</h2><p className="mt-1 text-sm text-muted">A consultation clarifies scope, budget and the right package.</p></div>
          <ButtonLink href="/consultation">Book a consultation</ButtonLink>
        </div>
      </div>
    </>
  );
}
