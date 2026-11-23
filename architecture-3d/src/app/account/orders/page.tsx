import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { dateLabel, money } from "@/lib/format";
import { StatusBadge } from "@/components/account/StatusBadge";

export default async function OrdersPage() {
  const user = await requirePageUser("/account/orders");
  const orders = await db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="text-display-md text-ink">Orders</h1>
      {orders.length === 0 ? <p className="mt-6 text-muted">No orders yet. <Link href="/pricing" className="text-accent-ink hover:underline">See pricing</Link>.</p> : (
        <div className="mt-8 overflow-x-auto"><table className="table-base"><thead><tr><th>Reference</th><th>Item</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>{orders.map((o) => (
            <tr key={o.id}><td><Link href={`/account/orders/${o.id}`} className="font-mono text-xs text-accent-ink hover:underline">{o.reference}</Link></td><td>{o.itemName}</td>
              <td>{money(o.amount, o.currency)}</td><td><StatusBadge status={o.status} /></td><td>{dateLabel(o.createdAt)}</td></tr>
          ))}</tbody></table></div>
      )}
    </div>
  );
}
