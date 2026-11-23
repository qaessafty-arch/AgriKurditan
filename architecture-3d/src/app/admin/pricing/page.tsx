import { db } from "@/lib/db";
import { requirePageCapability } from "@/lib/auth/session";
import { PatchForm, type FieldSpec } from "@/components/admin/PatchForm";
import { intervalLabel, money, titleCase } from "@/lib/format";

const INTERVALS = ["ONE_TIME", "MONTHLY", "YEARLY"].map((v) => ({ value: v, label: titleCase(v) }));
const KINDS = ["SERVICE_PACKAGE", "VISUALIZATION_PACKAGE", "PREMIUM_FEATURE", "CONSULTATION", "ARCHITECT_SUBSCRIPTION", "PARTNERSHIP", "FEATURED_PLACEMENT", "CUSTOM_COMMISSION"].map((v) => ({ value: v, label: titleCase(v) }));

export default async function AdminPricing() {
  await requirePageCapability("admin:catalog", "/admin/pricing");
  const offerings = await db.offering.findMany({ orderBy: { sortOrder: "asc" } });
  const fields = (o?: (typeof offerings)[number]): FieldSpec[] => [
    { name: "name", label: "Name", type: "text", value: o?.name },
    { name: "summary", label: "Summary", type: "textarea", value: o?.summary },
    { name: "features", label: "Features (one per line)", type: "textarea", value: o?.features.join("\n") },
    { name: "price", label: "Price (empty = quote on request)", type: "number", value: o?.price ? Number(o.price) : null },
    { name: "currency", label: "Currency (ISO code)", type: "text", value: o?.currency ?? "USD" },
    { name: "interval", label: "Billing", type: "select", value: o?.interval ?? "ONE_TIME", options: INTERVALS },
    { name: "sortOrder", label: "Order", type: "number", value: o?.sortOrder ?? 50 },
    { name: "highlighted", label: "Highlight", type: "checkbox", value: o?.highlighted },
    { name: "published", label: "Published", type: "checkbox", value: o?.published ?? true },
  ];
  return (
    <div>
      <h1 className="text-display-md text-ink">Pricing</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">Prices apply to new orders only; existing orders keep the amount agreed at checkout.</p>
      <div className="mt-6 space-y-4">
        {offerings.map((o) => (
          <details key={o.id} className="card p-5">
            <summary className="flex cursor-pointer flex-wrap justify-between gap-2"><span className="font-medium text-ink">{o.name} {!o.published && <span className="text-xs text-muted">(hidden)</span>}</span><span className="text-sm text-muted">{money(o.price, o.currency)} {o.price !== null && intervalLabel(o.interval)} · {titleCase(o.kind)}{o.entitlement && ` · grants ${o.entitlement}`}</span></summary>
            <div className="mt-4 max-w-2xl"><PatchForm url={`/api/admin/offerings/${o.id}`} fields={fields(o)} /></div>
          </details>
        ))}
        <details className="card p-5">
          <summary className="cursor-pointer font-medium text-accent-ink">Add an offering</summary>
          <div className="mt-4 max-w-2xl"><PatchForm url="/api/admin/offerings" method="POST" submitLabel="Create" fields={[
            { name: "slug", label: "Slug (URL id)", type: "text" },
            { name: "kind", label: "Type", type: "select", value: "SERVICE_PACKAGE", options: KINDS },
            ...fields(),
          ]} /></div>
        </details>
      </div>
    </div>
  );
}
