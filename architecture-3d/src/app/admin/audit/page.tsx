import { db } from "@/lib/db";
import { requirePageCapability } from "@/lib/auth/session";
import { dateLabel } from "@/lib/format";

export default async function AdminAudit() {
  await requirePageCapability("admin:settings", "/admin/audit");
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 300, include: { actor: { select: { email: true } } } });
  return (
    <div>
      <h1 className="text-display-md text-ink">Audit log</h1>
      <div className="mt-6 overflow-x-auto"><table className="table-base"><thead><tr><th>Time</th><th>Action</th><th>Actor</th><th>Target</th><th>IP</th></tr></thead>
        <tbody>{logs.map((l) => <tr key={l.id}><td className="whitespace-nowrap text-xs">{dateLabel(l.createdAt, true)}</td><td className="font-mono text-xs">{l.action}</td><td className="text-xs">{l.actor?.email ?? "—"}</td><td className="font-mono text-xs">{l.target ?? ""}</td><td className="text-xs text-muted">{l.ip ?? ""}</td></tr>)}</tbody></table></div>
    </div>
  );
}
