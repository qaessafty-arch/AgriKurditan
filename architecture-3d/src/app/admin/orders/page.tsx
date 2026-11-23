import { db } from "@/lib/db";
import { requirePageCapability } from "@/lib/auth/session";
import { dateLabel, money } from "@/lib/format";
import { StatusBadge } from "@/components/account/StatusBadge";
import { PatchForm } from "@/components/admin/PatchForm";

export default async function AdminOrders() {
  await requirePageCapability("admin:commerce", "/admin/orders");
  const orders = await db.order.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { user: { select: { name: true, email: true } } } });
  return (
    <div>
      <h1 className="text-display-md text-ink">Orders</h1>
      <div className="mt-6 overflow-x-auto"><table className="table-base"><thead><tr><th>Reference</th><th>Customer</th><th>Item</th><th>Amount</th><th>Status</th><th>Created</th><th>Action</th></tr></thead>
        <tbody>{orders.map((o) => (
          <tr key={o.id}>
            <td className="font-mono text-xs">{o.reference}</td><td>{o.user.name}<p className="text-xs text-muted">{o.user.email}</p></td><td>{o.itemName}</td>
            <td>{money(o.amount, o.currency)}</td><td><StatusBadge status={o.status} /></td><td>{dateLabel(o.createdAt)}</td>
            <td>{(o.status === "PAID" || o.status === "PENDING_PAYMENT") && (
              <PatchForm compact url={`/api/admin/orders/${o.id}`} submitLabel={o.status === "PAID" ? "Mark refunded" : "Cancel"}
                extra={{ status: o.status === "PAID" ? "REFUNDED" : "CANCELLED" }} fields={[{ name: "notes", label: "Note to customer", type: "text" }]} />
            )}</td>
          </tr>
        ))}</tbody></table></div>
      {orders.length === 0 && <p className="mt-6 text-muted">No orders yet.</p>}
    </div>
  );
}
