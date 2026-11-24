import { notFound } from "next/navigation";
import { Link } from "@/i18n/client";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { getSetting } from "@/lib/settings";
import { PAYMENT_METHODS } from "@/lib/payments/methods";
import { dateLabel, money } from "@/lib/format";
import { StatusBadge } from "@/components/account/StatusBadge";
import { ActionButton } from "@/components/account/AccountActions";
import { PaymentForm } from "@/components/commerce/PaymentForm";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/config";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { m, locale } = await getI18n();
  const O = m.order;
  const user = await requirePageUser(`/account/orders/${id}`);
  const order = await db.order.findUnique({ where: { id }, include: { payments: { orderBy: { createdAt: "desc" } }, offering: { select: { translations: true, name: true } } } });
  if (!order || order.userId !== user.id) notFound();
  const settings = await getSetting("payments");
  const method = PAYMENT_METHODS.find((x) => x.id === order.method);
  const lastRejected = order.payments.find((p) => p.status === "REJECTED");
  const itemName = (order.offering.translations as Record<string, { name?: string }> | null)?.[locale]?.name ?? order.itemName;
  const cur = (v: unknown) => money(v as number, order.currency, locale);
  const note = order.method === "bank_transfer" ? settings.instructions || m.checkout.defaultBankNote : settings.cashInstructions || m.checkout.defaultCashNote;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/account/orders" className="text-sm text-muted hover:text-ink">{m.common.back} {O.back}</Link>
        <div className="mt-3 flex flex-wrap items-center gap-3"><h1 className="text-display-md text-ink">{itemName}</h1><StatusBadge status={order.status} /></div>
        <p className="mt-1 text-sm text-muted">{fmt(O.reference, { ref: "" })}<span className="font-mono">{order.reference}</span> · {dateLabel(order.createdAt, false, locale)}</p>
      </div>
      <div className="card grid gap-4 p-6 sm:grid-cols-3">
        <div><p className="text-xs text-muted">{O.amountDue}</p><p className="font-display text-3xl">{cur(order.amount)}</p><p className="text-xs text-muted">{m.pricing.interval[order.interval]}</p></div>
        <div><p className="text-xs text-muted">{O.method}</p><p className="mt-1">{method ? m.checkout.methods[method.id] : order.method}</p></div>
        <div><p className="text-xs text-muted">{O.paid}</p><p className="mt-1">{order.paidAt ? dateLabel(order.paidAt, true, locale) : O.notYet}</p></div>
      </div>

      {order.status === "PENDING_PAYMENT" && method && (
        <section className="space-y-6">
          {lastRejected && <p role="alert" className="rounded border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{fmt(O.rejected, { reason: lastRejected.rejectReason ?? "" })}</p>}
          <div className="card p-6">
            <h2 className="font-display text-2xl text-ink">{fmt(O.step1, { amount: cur(order.amount) })}</h2>
            {method.instructions(settings).length > 0 && (
              <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
                {method.instructions(settings).map((i) => <div key={i.label} className="contents"><dt className="text-muted">{O.bankFields[i.label] ?? i.label}</dt><dd className="font-mono text-ink">{i.value}</dd></div>)}
                <dt className="text-muted">{O.paymentRef}</dt><dd className="font-mono text-accent-ink">{order.reference}</dd>
              </dl>
            )}
            <p className="mt-4 whitespace-pre-line text-sm text-muted" dir="auto">{note}</p>
          </div>
          <div className="card p-6">
            <h2 className="font-display text-2xl text-ink">{O.step2}</h2>
            <p className="mt-1 text-sm text-muted">{O.step2Body}</p>
            <div className="mt-5"><PaymentForm orderId={order.id} amount={Number(order.amount)} currency={order.currency} /></div>
          </div>
          <ActionButton url={`/api/orders/${order.id}/cancel`} label={O.cancel} variant="ghost" confirm={O.cancelConfirm} />
        </section>
      )}
      {order.status === "AWAITING_VERIFICATION" && <p className="rounded border border-accent/50 bg-accent/10 p-4 text-sm">{O.awaiting}</p>}

      {order.payments.length > 0 && (
        <section>
          <h2 className="font-display text-2xl text-ink">{O.history}</h2>
          <table className="table-base mt-4"><thead><tr><th>{O.submitted}</th><th>{O.amount}</th><th>{O.ref}</th><th>{O.status}</th></tr></thead>
            <tbody>{order.payments.map((p) => <tr key={p.id}><td>{dateLabel(p.createdAt, true, locale)}</td><td>{money(p.amount, p.currency, locale)}</td><td className="font-mono text-xs">{p.reference}</td><td><StatusBadge status={p.status} /></td></tr>)}</tbody>
          </table>
        </section>
      )}
    </div>
  );
}
