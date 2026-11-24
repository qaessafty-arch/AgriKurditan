import { Link } from "@/i18n/client";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { dateLabel } from "@/lib/format";
import { tr } from "@/lib/content";
import { StatusBadge } from "@/components/account/StatusBadge";
import { getI18n } from "@/i18n/server";

export default async function ConsultationsPage() {
  const { m, locale } = await getI18n();
  const A = m.account;
  const user = await requirePageUser("/account/consultations");
  const items = await db.consultation.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { service: { select: { name: true, translations: true } } } });
  return (
    <div>
      <h1 className="text-display-md text-ink">{A.consultationsTitle}</h1>
      {items.length === 0 ? <p className="mt-6 text-muted">{A.noConsultations} <Link href="/consultation" className="text-accent-ink hover:underline">{A.requestOne}</Link>.</p> : (
        <div className="mt-8 overflow-x-auto"><table className="table-base"><thead><tr><th>{A.reference}</th><th>{A.topic}</th><th>{A.status}</th><th>{A.scheduled}</th><th>{A.requested}</th></tr></thead>
          <tbody>{items.map((c) => (
            <tr key={c.id}><td className="font-mono text-xs">{c.reference}</td><td dir="auto">{c.topic}<p className="text-xs text-muted">{c.service ? tr(c.service, "name", locale) : A.general} · {m.forms.channels[c.channel as keyof typeof m.forms.channels] ?? c.channel}</p></td>
              <td><StatusBadge status={c.status} /></td><td>{c.scheduledAt ? dateLabel(c.scheduledAt, true, locale) : A.tbc}</td><td>{dateLabel(c.createdAt, false, locale)}</td></tr>
          ))}</tbody></table></div>
      )}
    </div>
  );
}
