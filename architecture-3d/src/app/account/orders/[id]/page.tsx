import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { getSetting } from "@/lib/settings";
import { PAYMENT_METHODS } from "@/lib/payments/methods";
import { dateLabel, intervalLabel, money, titleCase } from "@/lib/format";
import { StatusBadge } from "@/components/account/StatusBadge";
import { ActionButton } from "@/components/account/AccountActions";
import { PaymentForm } from "@/components/commerce/PaymentForm";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser(`/account/orders/${id}`);
  const order = await db.order.findUnique({ where: { id }, include: { payments: { orderBy: { createdAt: "desc" } } } });
  if (!order || order.userId !== user.id) notFound();
  const settings = await getSetting("payments");
  const method = PAYMENT_METHODS.find((m) => m.id === order.method);
  const lastRejected = order.payments.find((p) => p.status === "REJECTED");

  return (
    <div className="space-y-8">
      <div>
        <Link href="/account/orders" className="text-sm text-muted hover:text-ink">← Orders</Link>
        <div className="mt-3 flex flex-wrap items-center gap-3"><h1 className="text-display-md text-ink">{order.itemName}</h1><StatusBadge status={order.status} /></div>
        <p className="mt-1 font-mono text-sm text-muted">Reference {order.reference} · {dateLabel(order.createdAt)}</p>
      </div>
      <div className="card grid gap-4 p-6 sm:grid-cols-3">
        <div><p className="text-xs text-muted">Amount due</p><p className="font-display text-3xl">{money(order.amount, order.currency)}</p><p className="text-xs text-muted">{intervalLabel(order.interval)}</p></div>
        <div><p className="text-xs text-muted">Payment method</p><p className="mt-1">{method?.label ?? titleCase(order.method)}</p></div>
        <div><p className="text-xs text-muted">Paid</p><p className="mt-1">{order.paidAt ? dateLabel(order.paidAt, true) : "Not yet"}</p></div>
      </div>

      {order.status === "PENDING_PAYMENT" && method && (
        <section className="space-y-6">
          {lastRejected && <p role="alert" className="rounded border border-danger/40 bg-danger/10 p-3 text-sm text-danger">Your previous payment details could not be verified: {lastRejected.rejectReason}</p>}
          <div className="card p-6">
            <h2 className="font-display text-2xl text-ink">1. Pay {money(order.amount, order.currency)}</h2>
            {method.instructions(settings).length > 0 && (
              <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
                {method.instructions(settings).map((i) => <div key={i.label} className="contents"><dt className="text-muted">{i.label}</dt><dd className="font-mono text-ink">{i.value}</dd></div>)}
                <dt className="text-muted">Payment reference</dt><dd className="font-mono text-accent-ink">{order.reference}</dd>
              </dl>
            )}
            <p className="mt-4 whitespace-pre-line text-sm text-muted">{method.note(settings)}</p>
          </div>
          <div className="card p-6">
            <h2 className="font-display text-2xl text-ink">2. Tell us you have paid</h2>
            <p className="mt-1 text-sm text-muted">We check the payment against our bank statement or receipt book, usually within one working day, and then activate your order.</p>
            <div className="mt-5"><PaymentForm orderId={order.id} amount={Number(order.amount)} currency={order.currency} /></div>
          </div>
          <ActionButton url={`/api/orders/${order.id}/cancel`} label="Cancel this order" variant="ghost" confirm="Cancel this unpaid order?" />
        </section>
      )}
      {order.status === "AWAITING_VERIFICATION" && <p className="rounded border border-accent/50 bg-accent/10 p-4 text-sm">Thank you. We have your payment details and will confirm once the payment is verified. You will get a notification.</p>}

      {order.payments.length > 0 && (
        <section>
          <h2 className="font-display text-2xl text-ink">Payment history</h2>
          <table className="table-base mt-4"><thead><tr><th>Submitted</th><th>Amount</th><th>Reference</th><th>Status</th></tr></thead>
            <tbody>{order.payments.map((p) => <tr key={p.id}><td>{dateLabel(p.createdAt, true)}</td><td>{money(p.amount, p.currency)}</td><td className="font-mono text-xs">{p.reference}</td><td><StatusBadge status={p.status} /></td></tr>)}</tbody>
          </table>
        </section>
      )}
    </div>
  );
}
