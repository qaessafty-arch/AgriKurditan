import { Link } from "@/i18n/client";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { dateLabel, money } from "@/lib/format";
import { tr } from "@/lib/content";
import { StatusBadge } from "@/components/account/StatusBadge";
import { getI18n } from "@/i18n/server";

export default async function QuotesPage() {
  const { m, locale } = await getI18n();
  const A = m.account;
  const user = await requirePageUser("/account/quotes");
  const items = await db.quoteRequest.findMany({ where: { userId: user.id, status: { not: "DRAFT" } }, orderBy: { createdAt: "desc" }, include: { service: { select: { name: true, translations: true } }, design: { select: { name: true } } } });
  return (
    <div>
      <h1 className="text-display-md text-ink">{A.quotesTitle}</h1>
      {items.length === 0 ? <p className="mt-6 text-muted">{A.noQuotes} <Link href="/quote" className="text-accent-ink hover:underline">{m.footer.requestQuote}</Link>.</p> : (
        <ul className="mt-8 space-y-4">
          {items.map((q) => (
            <li key={q.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted"><span className="font-mono">{q.reference}</span> · {dateLabel(q.submittedAt ?? q.createdAt, false, locale)}</p><StatusBadge status={q.status} /></div>
              <p className="mt-2 font-medium text-ink">{q.service ? tr(q.service, "name", locale) : A.generalEnquiry}{q.design && <span className="text-muted"> · {A.design} “{q.design.name}”</span>}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted" dir="auto">{q.details}</p>
              {q.quotedAmount && <p className="mt-3 text-sm">{A.quoted} <span className="font-display text-2xl text-ink">{money(q.quotedAmount, q.currency, locale)}</span></p>}
              {q.quoteNotes && <p className="mt-2 whitespace-pre-line text-sm text-ink/90" dir="auto">{q.quoteNotes}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
