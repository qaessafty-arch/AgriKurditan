import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageCapability } from "@/lib/auth/session";
import { dateLabel, titleCase } from "@/lib/format";
import { StatusBadge } from "@/components/account/StatusBadge";
import { PatchForm } from "@/components/admin/PatchForm";
import { uploadUrl } from "@/lib/storage";

export default async function AdminConsultations({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requirePageCapability("admin:leads", "/admin/consultations");
  const status = (await searchParams).status;
  const valid = ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"];
  const items = await db.consultation.findMany({
    where: valid.includes(status ?? "") ? { status: status as never } : {}, orderBy: { createdAt: "desc" }, take: 100,
    include: { service: { select: { name: true } }, design: { select: { id: true, name: true } }, brief: { select: { id: true, provider: true, uploadIds: true } } },
  });
  return (
    <div>
      <h1 className="text-display-md text-ink">Consultations</h1>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm">{["", ...valid].map((s) => <Link key={s} href={s ? `?status=${s}` : "?"} className={(status ?? "") === s ? "text-ink underline" : "text-muted hover:text-ink"}>{s ? titleCase(s) : "All"}</Link>)}</nav>
      <ul className="mt-6 space-y-4">
        {items.map((c) => (
          <li key={c.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-mono text-xs text-muted">{c.reference} · {dateLabel(c.createdAt, true)}</p><StatusBadge status={c.status} /></div>
            <p className="mt-2 font-medium text-ink">{c.topic}</p>
            <p className="text-sm text-muted">{c.name} · <a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a>{c.phone && ` · ${c.phone}`} · {titleCase(c.channel)}{c.service && ` · ${c.service.name}`}{c.preferredDate && ` · prefers ${dateLabel(c.preferredDate)}`}</p>
            <p className="mt-3 whitespace-pre-line text-sm text-ink/90">{c.message}</p>
            {(c.design || c.brief) && (
              <p className="mt-2 text-sm">
                {c.design && <span className="mr-3">Design: {c.design.name}</span>}
                {c.brief && <span>AI brief ({c.brief.provider}){c.brief.uploadIds.map((u, i) => <a key={u} href={uploadUrl(u)!} target="_blank" className="ml-2 text-accent-ink hover:underline">photo {i + 1}</a>)}</span>}
              </p>
            )}
            <div className="mt-4 border-t hairline pt-4">
              <PatchForm compact url={`/api/admin/consultations/${c.id}`} fields={[
                { name: "status", label: "Status", type: "select", value: c.status, options: valid.map((v) => ({ value: v, label: titleCase(v) })) },
                { name: "scheduledAt", label: "Scheduled (UTC)", type: "datetime-local", value: c.scheduledAt?.toISOString().slice(0, 16) ?? "" },
                { name: "adminNotes", label: "Internal notes", type: "text", value: c.adminNotes ?? "" },
              ]} />
            </div>
          </li>
        ))}
        {items.length === 0 && <p className="text-muted">No consultations.</p>}
      </ul>
    </div>
  );
}
