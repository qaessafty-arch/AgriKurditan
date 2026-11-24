import { Link } from "@/i18n/client";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { dateLabel, money } from "@/lib/format";
import { tr } from "@/lib/content";
import { StatusBadge } from "@/components/account/StatusBadge";
import { getI18n } from "@/i18n/server";

export default async function OrdersPage() {
  const { m, locale } = await getI18n();
  const A = m.account;
  const user = await requirePageUser("/account/orders");
  const orders = await db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { offering: { select: { name: true, translations: true } } } });
  return (
    <div>
      <h1 className="text-display-md text-ink">{A.ordersTitle}</h1>
      {orders.length === 0 ? <p className="mt-6 text-muted">{A.noOrders} <Link href="/pricing" className="text-accent-ink hover:underline">{m.services.seePricing}</Link>.</p> : (
        <div className="mt-8 overflow-x-auto"><table className="table-base"><thead><tr><th>{A.reference}</th><th>{A.item}</th><th>{A.amount}</th><th>{A.status}</th><th>{A.date}</th></tr></thead>
          <tbody>{orders.map((o) => (
            <tr key={o.id}><td><Link href={`/account/orders/${o.id}`} className="font-mono text-xs text-accent-ink hover:underline">{o.reference}</Link></td><td>{tr(o.offering, "name", locale)}</td>
              <td>{money(o.amount, o.currency, locale)}</td><td><StatusBadge status={o.status} /></td><td>{dateLabel(o.createdAt, false, locale)}</td></tr>
          ))}</tbody></table></div>
      )}
    </div>
  );
}
