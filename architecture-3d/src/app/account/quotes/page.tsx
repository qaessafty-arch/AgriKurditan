import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { dateLabel, money } from "@/lib/format";
import { StatusBadge } from "@/components/account/StatusBadge";

export default async function QuotesPage() {
  const user = await requirePageUser("/account/quotes");
  const items = await db.quoteRequest.findMany({ where: { userId: user.id, status: { not: "DRAFT" } }, orderBy: { createdAt: "desc" }, include: { service: { select: { name: true } }, design: { select: { name: true } } } });
  return (
    <div>
      <h1 className="text-display-md text-ink">Quote requests</h1>
      {items.length === 0 ? <p className="mt-6 text-muted">No quote requests yet. <Link href="/quote" className="text-accent-ink hover:underline">Request a quote</Link>.</p> : (
        <ul className="mt-8 space-y-4">
          {items.map((q) => (
            <li key={q.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-xs text-muted">{q.reference} · {dateLabel(q.submittedAt ?? q.createdAt)}</p>
                <StatusBadge status={q.status} />
              </div>
              <p className="mt-2 font-medium text-ink">{q.service?.name ?? "General enquiry"}{q.design && <span className="text-muted"> · design “{q.design.name}”</span>}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{q.details}</p>
              {q.quotedAmount && <p className="mt-3 text-sm">Quoted: <span className="font-display text-2xl text-ink">{money(q.quotedAmount, q.currency)}</span></p>}
              {q.quoteNotes && <p className="mt-2 whitespace-pre-line text-sm text-ink/90">{q.quoteNotes}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
