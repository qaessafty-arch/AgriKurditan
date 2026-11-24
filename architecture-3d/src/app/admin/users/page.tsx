import { Link } from "@/i18n/client";
import { db } from "@/lib/db";
import { requirePageCapability } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { dateLabel } from "@/lib/format";
import { PatchForm } from "@/components/admin/PatchForm";

const ROLES = ["CUSTOMER", "ARCHITECT", "PARTNER", "ADMIN"] as const;

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ role?: string; q?: string }> }) {
  const me = await requirePageCapability("admin:users", "/admin/users");
  const sp = await searchParams;
  const role = ROLES.find((r) => r === sp.role);
  const q = sp.q?.trim().slice(0, 100);
  const users = await db.user.findMany({
    where: { ...(role ? { role } : {}), ...(q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] } : {}) },
    orderBy: { createdAt: "desc" }, take: 200,
    include: { _count: { select: { orders: true, quotes: true, consultations: true, designs: true } } },
  });
  return (
    <div>
      <h1 className="text-display-md text-ink">Users</h1>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <Link href="?" className={!role ? "text-ink underline" : "text-muted hover:text-ink"}>All</Link>
        {ROLES.map((r) => <Link key={r} href={`?role=${r}`} className={role === r ? "text-ink underline" : "text-muted hover:text-ink"}>{ROLE_LABELS[r]}s</Link>)}
        <form className="ms-auto"><input name="q" defaultValue={q} placeholder="Search name or email" className="field h-9 w-56" aria-label="Search users" />{role && <input type="hidden" name="role" value={role} />}</form>
      </div>
      <div className="mt-6 overflow-x-auto"><table className="table-base"><thead><tr><th>User</th><th>Joined</th><th>Activity</th><th>Role and access</th></tr></thead>
        <tbody>{users.map((u) => (
          <tr key={u.id} className={u.disabled ? "opacity-60" : ""}>
            <td>{u.name}<p className="text-xs text-muted">{u.email}{u.company && ` · ${u.company}`}</p></td>
            <td>{dateLabel(u.createdAt)}</td>
            <td className="text-xs text-muted">{u._count.orders} orders · {u._count.quotes} quotes · {u._count.consultations} consultations · {u._count.designs} designs</td>
            <td>{u.id === me.id ? <span className="text-xs text-muted">{ROLE_LABELS[u.role]} (you)</span> : (
              <PatchForm compact url={`/api/admin/users/${u.id}`} fields={[
                { name: "role", label: "Role", type: "select", value: u.role, options: ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })) },
                { name: "disabled", label: "Disabled", type: "checkbox", value: u.disabled },
              ]} />
            )}</td>
          </tr>
        ))}</tbody></table></div>
    </div>
  );
}
