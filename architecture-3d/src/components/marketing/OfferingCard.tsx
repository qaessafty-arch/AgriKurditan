import Link from "next/link";
import type { Offering } from "@prisma/client";
import { intervalLabel, money } from "@/lib/format";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export function OfferingCard({ o }: { o: Pick<Offering, "slug" | "name" | "summary" | "features" | "price" | "currency" | "interval" | "highlighted"> }) {
  return (
    <div id={o.slug} className={cn("card flex flex-col p-6", o.highlighted && "border-accent/60 ring-1 ring-accent/40")}>
      {o.highlighted && <span className="mb-3 self-start rounded bg-accent px-2 py-0.5 text-[11px] font-semibold text-[#101114]">Most chosen</span>}
      <h3 className="font-display text-2xl text-ink">{o.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{o.summary}</p>
      <p className="mt-5">
        <span className="font-display text-4xl text-ink">{money(o.price, o.currency)}</span>
        {o.price !== null && <span className="ml-2 text-sm text-muted">{intervalLabel(o.interval)}</span>}
      </p>
      <ul className="mt-5 flex-1 space-y-2 text-sm">
        {o.features.map((f) => (
          <li key={f} className="flex gap-2 text-ink/90"><span className="text-accent" aria-hidden>—</span>{f}</li>
        ))}
      </ul>
      <Link href={o.price === null ? `/quote?offering=${o.slug}` : `/checkout/${o.slug}`} className={buttonClass(o.highlighted ? "primary" : "secondary", "md", "mt-6 w-full")}>
        {o.price === null ? "Request a quote" : "Choose"}
      </Link>
    </div>
  );
}
