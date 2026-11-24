import { Link } from "@/i18n/client";
import { db } from "@/lib/db";
import { requirePageCapability } from "@/lib/auth/session";
import { dateLabel, money, titleCase } from "@/lib/format";
import { StatusBadge } from "@/components/account/StatusBadge";
import { PatchForm } from "@/components/admin/PatchForm";
import { encodeConfig } from "@/three/share";
import { coerceConfig } from "@/three/config";

export default async function AdminQuotes({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requirePageCapability("admin:leads", "/admin/quotes");
  const status = (await searchParams).status;
  const valid = ["SUBMITTED", "IN_REVIEW", "QUOTED", "ACCEPTED", "DECLINED", "DRAFT"];
  const items = await db.quoteRequest.findMany({
    where: valid.includes(status ?? "") ? { status: status as never } : { status: { not: "DRAFT" } }, orderBy: { updatedAt: "desc" }, take: 100,
    include: { service: { select: { name: true } }, design: { select: { name: true, presetId: true, config: true } }, brief: { select: { id: true, provider: true } } },
  });
  return (
    <div>
      <h1 className="text-display-md text-ink">Quote requests</h1>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm">{["", ...valid].map((s) => <Link key={s} href={s ? `?status=${s}` : "?"} className={(status ?? "") === s ? "text-ink underline" : "text-muted hover:text-ink"}>{s ? (s === "DRAFT" ? "Abandoned drafts" : titleCase(s)) : "Open and closed"}</Link>)}</nav>
      <ul className="mt-6 space-y-4">
        {items.map((q) => (
          <li key={q.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-mono text-xs text-muted">{q.reference} · {dateLabel(q.submittedAt ?? q.createdAt, true)}</p><StatusBadge status={q.status} /></div>
            <p className="mt-2 font-medium text-ink">{q.service?.name ?? "General"}{q.name && <span className="font-normal text-muted"> · {q.name} · {q.email}{q.phone && ` · ${q.phone}`}</span>}</p>
            <p className="text-sm text-muted">{[q.siteLocation, q.areaM2 && `${q.areaM2} m²`, (q.budgetMin || q.budgetMax) && `Budget ${money(q.budgetMin ?? 0, q.currency)}–${q.budgetMax ? money(q.budgetMax, q.currency) : "?"}`, q.timeline].filter(Boolean).join(" · ")}</p>
            {q.details && <p className="mt-3 whitespace-pre-line text-sm text-ink/90">{q.details}</p>}
            {q.design && <p className="mt-2 text-sm">Design: <Link className="text-accent-ink hover:underline" href={`/studio?plan=${q.design.presetId}&config=${encodeConfig(coerceConfig(q.design.config))}`} target="_blank">{q.design.name} (open in studio)</Link></p>}
            {q.brief && <p className="mt-1 text-sm text-muted">AI brief attached ({q.brief.provider}).</p>}
            {q.status !== "DRAFT" && (
              <div className="mt-4 border-t hairline pt-4">
                <PatchForm compact url={`/api/admin/quotes/${q.id}`} fields={[
                  { name: "status", label: "Status", type: "select", value: q.status, options: valid.filter((v) => v !== "DRAFT").map((v) => ({ value: v, label: titleCase(v) })) },
                  { name: "quotedAmount", label: `Quote (${q.currency})`, type: "number", value: q.quotedAmount ? Number(q.quotedAmount) : null },
                  { name: "quoteNotes", label: "Notes to client", type: "text", value: q.quoteNotes ?? "" },
                ]} />
              </div>
            )}
          </li>
        ))}
        {items.length === 0 && <p className="text-muted">Nothing here.</p>}
      </ul>
    </div>
  );
}
