import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Link } from "@/i18n/client";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { getSetting } from "@/lib/settings";
import { availableMethods } from "@/lib/payments/methods";
import { money } from "@/lib/format";
import { tr } from "@/lib/content";
import { CheckoutForm } from "@/components/commerce/CheckoutForm";
import { ButtonLink } from "@/components/ui/Button";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: m.checkout.title, robots: { index: false } };
}

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { m, locale } = await getI18n();
  const C = m.checkout;
  const user = await requirePageUser(`/checkout/${slug}`);
  const o = await db.offering.findUnique({ where: { slug } });
  if (!o || !o.published) notFound();
  const name = tr(o, "name", locale);
  const payments = await getSetting("payments");
  // Admin-entered instructions are shown as written; the defaults are translated.
  const methods = availableMethods(payments).map((x) => ({
    id: x.id,
    note: x.id === "bank_transfer" ? payments.instructions || C.defaultBankNote : payments.cashInstructions || C.defaultCashNote,
  }));
  const eligible = o.audience.length === 0 || o.audience.includes(user.role) || user.role === "ADMIN";

  return (
    <div className="container max-w-3xl py-16">
      <p className="eyebrow">{C.title}</p>
      <h1 className="mt-3 text-display-md text-ink">{name}</h1>
      <p className="mt-3 text-muted">{tr(o, "summary", locale)}</p>
      <div className="card mt-8 p-6">
        <div className="flex items-baseline justify-between">
          <span className="text-muted">{C.total}</span>
          <span><span className="font-display text-3xl">{money(o.price, o.currency, locale, m.pricing.onRequest)}</span>{o.price !== null && <span className="ms-2 text-sm text-muted">{m.pricing.interval[o.interval]}</span>}</span>
        </div>
        {o.interval !== "ONE_TIME" && <p className="mt-2 text-xs text-muted">{C.perPeriod}</p>}
      </div>
      <div className="mt-8">
        {o.price === null ? (
          <p className="text-muted">{C.onRequest} <Link className="text-accent-ink hover:underline" href={`/quote?offering=${o.slug}`}>{C.requestQuote}</Link>.</p>
        ) : !eligible ? (
          <div className="space-y-3">
            <p className="text-muted">{fmt(C.wrongAudience, { audience: o.audience.map((r) => m.roles[r]).join(" / "), role: m.roles[user.role] })}</p>
            <ButtonLink href="/contact" variant="secondary">{C.changeType}</ButtonLink>
          </div>
        ) : methods.length === 0 ? (
          <div className="space-y-3">
            <p className="text-muted">{C.closed}</p>
            <ButtonLink href={`/consultation?topic=${encodeURIComponent(fmt(C.orderTopic, { name }))}`}>{C.contactOrder}</ButtonLink>
          </div>
        ) : <CheckoutForm offeringSlug={o.slug} methods={methods} />}
      </div>
    </div>
  );
}
