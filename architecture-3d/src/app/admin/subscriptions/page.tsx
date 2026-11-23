import { db } from "@/lib/db";
import { requirePageCapability } from "@/lib/auth/session";
import { dateLabel } from "@/lib/format";
import { StatusBadge } from "@/components/account/StatusBadge";
import { PatchForm } from "@/components/admin/PatchForm";

export default async function AdminSubscriptions() {
  await requirePageCapability("admin:commerce", "/admin/subscriptions");
  const subs = await db.subscription.findMany({ orderBy: { startsAt: "desc" }, take: 200, include: { user: { select: { name: true, email: true } }, offering: { select: { name: true } } } });
  const now = new Date();
  return (
    <div>
      <h1 className="text-display-md text-ink">Subscriptions</h1>
      <div className="mt-6 overflow-x-auto"><table className="table-base"><thead><tr><th>Customer</th><th>Plan</th><th>Status</th><th>Period</th><th>Adjust</th></tr></thead>
        <tbody>{subs.map((s) => (
          <tr key={s.id}><td>{s.user.name}<p className="text-xs text-muted">{s.user.email}</p></td><td>{s.offering.name}</td>
            <td><StatusBadge status={s.status === "ACTIVE" && s.endsAt && s.endsAt < now ? "EXPIRED" : s.status} /></td>
            <td>{dateLabel(s.startsAt)} – {s.endsAt ? dateLabel(s.endsAt) : "open"}</td>
            <td><PatchForm compact url={`/api/admin/subscriptions/${s.id}`} fields={[
              { name: "status", label: "Status", type: "select", value: s.status, options: ["ACTIVE", "EXPIRED", "CANCELLED"].map((v) => ({ value: v, label: v })) },
              { name: "endsAt", label: "Ends", type: "date", value: s.endsAt?.toISOString().slice(0, 10) ?? "" },
            ]} /></td></tr>
        ))}</tbody></table></div>
      {subs.length === 0 && <p className="mt-6 text-muted">No subscriptions yet.</p>}
    </div>
  );
}
