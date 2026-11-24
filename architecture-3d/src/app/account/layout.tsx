import type { Metadata } from "next";
import { requirePageUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { SideNav } from "@/components/account/SideNav";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: m.common.myAccount, robots: { index: false } };
}
export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const { m } = await getI18n();
  const N = m.account.nav;
  const user = await requirePageUser("/account");
  const items = [
    { href: "/account", label: N.overview },
    { href: "/account/designs", label: N.designs },
    { href: "/account/consultations", label: N.consultations },
    { href: "/account/quotes", label: N.quotes },
    { href: "/account/orders", label: N.orders },
    ...(can(user.role, "projects:submit") ? [{ href: "/account/projects", label: N.projects }] : []),
    { href: "/account/settings", label: N.settings },
  ];
  return (
    <div className="container py-10 lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
      <aside className="mb-8 lg:mb-0">
        <p className="font-display text-2xl text-ink" dir="auto">{user.name}</p>
        <p className="mb-5 text-xs text-muted">{m.roles[user.role]}</p>
        <SideNav items={items} label={m.account.label} />
        {can(user.role, "admin:leads") && <a href="/admin" className="mt-6 hidden rounded border border-accent/50 px-3 py-2 text-sm text-accent-ink lg:block">{m.account.admin} {m.common.arrow}</a>}
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
