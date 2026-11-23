import { db } from "@/lib/db";
import { requirePageCapability } from "@/lib/auth/session";
import { dateLabel } from "@/lib/format";
import { ActionButton } from "@/components/account/AccountActions";

export default async function AdminMessages() {
  await requirePageCapability("admin:leads", "/admin/messages");
  const items = await db.contactMessage.findMany({ orderBy: [{ handled: "asc" }, { createdAt: "desc" }], take: 100 });
  return (
    <div>
      <h1 className="text-display-md text-ink">Messages</h1>
      <ul className="mt-6 space-y-4">
        {items.map((m) => (
          <li key={m.id} className={m.handled ? "card p-5 opacity-60" : "card p-5"}>
            <p className="text-xs text-muted">{dateLabel(m.createdAt, true)} · {m.name} · <a className="hover:underline" href={`mailto:${m.email}`}>{m.email}</a>{m.phone && ` · ${m.phone}`}</p>
            <p className="mt-1 font-medium text-ink">{m.subject}</p>
            <p className="mt-2 whitespace-pre-line text-sm text-ink/90">{m.message}</p>
            <div className="mt-3"><ActionButton url={`/api/admin/messages/${m.id}`} method="PATCH" body={{ handled: !m.handled }} label={m.handled ? "Mark as open" : "Mark handled"} /></div>
          </li>
        ))}
        {items.length === 0 && <p className="text-muted">No messages.</p>}
      </ul>
    </div>
  );
}
