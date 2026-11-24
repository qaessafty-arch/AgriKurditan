import type { Offering } from "@prisma/client";
import { Link } from "@/i18n/client";
import { money } from "@/lib/format";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { tr } from "@/lib/content";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

export function OfferingCard({ o, m, locale }: { o: Pick<Offering, "slug" | "name" | "summary" | "features" | "price" | "currency" | "interval" | "highlighted" | "translations">; m: Messages; locale: Locale }) {
  const P = m.pricing;
  return (
    <div id={o.slug} className={cn("card flex flex-col p-6", o.highlighted && "border-accent/60 ring-1 ring-accent/40")}>
      {o.highlighted && <span className="mb-3 self-start rounded bg-accent px-2 py-0.5 text-[11px] font-semibold text-[#101114]">{P.mostChosen}</span>}
      <h3 className="font-display text-2xl text-ink">{tr(o, "name", locale)}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{tr(o, "summary", locale)}</p>
      <p className="mt-5">
        <span className="font-display text-4xl text-ink">{money(o.price, o.currency, locale, P.onRequest)}</span>
        {o.price !== null && <span className="ms-2 text-sm text-muted">{P.interval[o.interval]}</span>}
      </p>
      <ul className="mt-5 flex-1 space-y-2 text-sm">
        {(tr(o, "features", locale) as string[]).map((f) => <li key={f} className="flex gap-2 text-ink/90"><span className="text-accent" aria-hidden>—</span>{f}</li>)}
      </ul>
      <Link href={o.price === null ? `/quote?offering=${o.slug}` : `/checkout/${o.slug}`} className={buttonClass(o.highlighted ? "primary" : "secondary", "md", "mt-6 w-full")}>
        {o.price === null ? P.requestQuote : P.choose}
      </Link>
    </div>
  );
}
