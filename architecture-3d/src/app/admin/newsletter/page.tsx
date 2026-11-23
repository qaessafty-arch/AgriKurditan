import { db } from "@/lib/db";
import { requirePageCapability } from "@/lib/auth/session";
import { dateLabel } from "@/lib/format";
import { buttonClass } from "@/components/ui/Button";

export default async function AdminNewsletter() {
  await requirePageCapability("admin:content", "/admin/newsletter");
  const subs = await db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  const confirmed = subs.filter((s) => s.confirmedAt && !s.unsubscribedAt).length;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-display-md text-ink">Newsletter</h1><a href="/api/admin/newsletter-export" className={buttonClass("secondary", "sm")}>Export confirmed (CSV)</a></div>
      <p className="mt-2 text-sm text-muted">{confirmed} confirmed of {subs.length}. Only confirmed, subscribed addresses may be emailed.</p>
      <table className="table-base mt-6"><thead><tr><th>Email</th><th>Status</th><th>Source</th><th>Joined</th></tr></thead>
        <tbody>{subs.map((s) => <tr key={s.id}><td>{s.email}</td><td>{s.unsubscribedAt ? "Unsubscribed" : s.confirmedAt ? "Confirmed" : "Pending confirmation"}</td><td>{s.source ?? "—"}</td><td>{dateLabel(s.createdAt)}</td></tr>)}</tbody></table>
    </div>
  );
}
