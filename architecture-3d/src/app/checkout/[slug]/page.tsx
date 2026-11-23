import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { getSetting } from "@/lib/settings";
import { availableMethods } from "@/lib/payments/methods";
import { intervalLabel, money } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { CheckoutForm } from "@/components/commerce/CheckoutForm";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requirePageUser(`/checkout/${slug}`);
  const o = await db.offering.findUnique({ where: { slug } });
  if (!o || !o.published) notFound();
  const payments = await getSetting("payments");
  const methods = availableMethods(payments).map((m) => ({ id: m.id, label: m.label, note: m.note(payments) }));
  const eligible = o.audience.length === 0 || o.audience.includes(user.role) || user.role === "ADMIN";

  return (
    <div className="container max-w-3xl py-16">
      <p className="eyebrow">Checkout</p>
      <h1 className="mt-3 text-display-md text-ink">{o.name}</h1>
      <p className="mt-3 text-muted">{o.summary}</p>
      <div className="card mt-8 p-6">
        <div className="flex items-baseline justify-between">
          <span className="text-muted">Total</span>
          <span><span className="font-display text-3xl">{money(o.price, o.currency)}</span>{o.price !== null && <span className="ml-2 text-sm text-muted">{intervalLabel(o.interval)}</span>}</span>
        </div>
        {o.interval !== "ONE_TIME" && <p className="mt-2 text-xs text-muted">Each period is paid separately; access runs for the period you have paid for. There is no automatic charge.</p>}
      </div>
      <div className="mt-8">
        {o.price === null ? (
          <p className="text-muted">This offer is priced on request. <Link className="text-accent-ink hover:underline" href={`/quote?offering=${o.slug}`}>Request a quote</Link>.</p>
        ) : !eligible ? (
          <div className="space-y-3"><p className="text-muted">This plan is for {o.audience.map((r) => ROLE_LABELS[r].toLowerCase()).join(" or ")} accounts. Your account type is {ROLE_LABELS[user.role].toLowerCase()}.</p><ButtonLink href="/contact" variant="secondary">Contact us to change your account type</ButtonLink></div>
        ) : methods.length === 0 ? (
          <div className="space-y-3">
            <p className="text-muted">Online ordering is not open yet because payment details have not been configured. Please contact us and we will arrange this order with you directly.</p>
            <ButtonLink href={`/consultation?topic=${encodeURIComponent(`Order: ${o.name}`)}`}>Contact us about this order</ButtonLink>
          </div>
        ) : (
          <CheckoutForm offeringSlug={o.slug} methods={methods} />
        )}
      </div>
    </div>
  );
}
