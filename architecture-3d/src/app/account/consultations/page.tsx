import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { dateLabel, titleCase } from "@/lib/format";
import { StatusBadge } from "@/components/account/StatusBadge";

export default async function ConsultationsPage() {
  const user = await requirePageUser("/account/consultations");
  const items = await db.consultation.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { service: { select: { name: true } } } });
  return (
    <div>
      <h1 className="text-display-md text-ink">Consultations</h1>
      {items.length === 0 ? <p className="mt-6 text-muted">No consultations yet. <Link href="/consultation" className="text-accent-ink hover:underline">Request one</Link>.</p> : (
        <div className="mt-8 overflow-x-auto"><table className="table-base"><thead><tr><th>Reference</th><th>Topic</th><th>Status</th><th>Scheduled</th><th>Requested</th></tr></thead>
          <tbody>{items.map((c) => (
            <tr key={c.id}><td className="font-mono text-xs">{c.reference}</td><td>{c.topic}<p className="text-xs text-muted">{c.service?.name ?? "General"} · {titleCase(c.channel)}</p></td>
              <td><StatusBadge status={c.status} /></td><td>{c.scheduledAt ? dateLabel(c.scheduledAt, true) : "To be confirmed"}</td><td>{dateLabel(c.createdAt)}</td></tr>
          ))}</tbody></table></div>
      )}
    </div>
  );
}
