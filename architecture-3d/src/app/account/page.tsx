import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { dateLabel } from "@/lib/format";
import { StatusBadge } from "@/components/account/StatusBadge";
import { ActionButton } from "@/components/account/AccountActions";

export default async function AccountOverview({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requirePageUser("/account");
  const sp = await searchParams;
  const [notifications, subs, counts] = await Promise.all([
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.subscription.findMany({ where: { userId: user.id }, orderBy: { startsAt: "desc" }, include: { offering: { select: { name: true } } }, take: 10 }),
    Promise.all([
      db.design.count({ where: { userId: user.id } }),
      db.consultation.count({ where: { userId: user.id } }),
      db.quoteRequest.count({ where: { userId: user.id, status: { not: "DRAFT" } } }),
      db.order.count({ where: { userId: user.id } }),
    ]),
  ]);
  const unread = notifications.filter((n) => !n.readAt).length;
  const now = new Date();
  const stats = [["Saved designs", counts[0], "/account/designs"], ["Consultations", counts[1], "/account/consultations"], ["Quotes", counts[2], "/account/quotes"], ["Orders", counts[3], "/account/orders"]] as const;

  return (
    <div className="space-y-10">
      {sp.denied && <p role="alert" className="rounded border border-danger/40 bg-danger/10 p-3 text-sm text-danger">You do not have access to that page.</p>}
      <h1 className="text-display-md text-ink">Overview</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([label, n, href]) => (
          <Link key={label} href={href} className="card p-5 hover:border-line-strong"><p className="font-display text-4xl text-ink">{n}</p><p className="mt-1 text-sm text-muted">{label}</p></Link>
        ))}
      </div>
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">Notifications {unread > 0 && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 font-sans text-xs font-semibold text-[#101114]">{unread} new</span>}</h2>
          {unread > 0 && <ActionButton url="/api/account/notifications" body={{ all: true }} label="Mark all read" variant="ghost" />}
        </div>
        {notifications.length === 0 ? <p className="mt-3 text-sm text-muted">No notifications yet.</p> : (
          <ul className="mt-4 divide-y divide-[var(--line)] border-y hairline">
            {notifications.map((n) => (
              <li key={n.id} className="flex gap-3 py-3">
                <span className={n.readAt ? "mt-2 h-2 w-2 shrink-0 rounded-full bg-transparent" : "mt-2 h-2 w-2 shrink-0 rounded-full bg-accent"} aria-label={n.readAt ? undefined : "Unread"} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">{n.href ? <Link href={n.href} className="hover:underline">{n.title}</Link> : n.title}</p>
                  <p className="text-sm text-muted">{n.body}</p>
                </div>
                <time className="shrink-0 text-xs text-muted" dateTime={n.createdAt.toISOString()}>{dateLabel(n.createdAt)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="font-display text-2xl text-ink">Subscriptions and access</h2>
        {subs.length === 0 ? <p className="mt-3 text-sm text-muted">No subscriptions. <Link href="/pricing" className="text-accent-ink hover:underline">See plans</Link>.</p> : (
          <table className="table-base mt-4"><thead><tr><th>Plan</th><th>Status</th><th>From</th><th>Until</th></tr></thead>
            <tbody>{subs.map((s) => {
              const status = s.status === "ACTIVE" && s.endsAt && s.endsAt < now ? "EXPIRED" : s.status;
              return <tr key={s.id}><td>{s.offering.name}</td><td><StatusBadge status={status} /></td><td>{dateLabel(s.startsAt)}</td><td>{s.endsAt ? dateLabel(s.endsAt) : "No end date"}</td></tr>;
            })}</tbody>
          </table>
        )}
      </section>
    </div>
  );
}
