import type { Metadata } from "next";
import Link from "next/link";
import { requirePageUser } from "@/lib/auth/session";
import { can, ROLE_LABELS } from "@/lib/auth/permissions";
import { SideNav } from "@/components/account/SideNav";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser("/account");
  const items = [
    { href: "/account", label: "Overview" },
    { href: "/account/designs", label: "Saved designs" },
    { href: "/account/consultations", label: "Consultations" },
    { href: "/account/quotes", label: "Quotes" },
    { href: "/account/orders", label: "Orders" },
    ...(can(user.role, "projects:submit") ? [{ href: "/account/projects", label: "My projects" }] : []),
    { href: "/account/settings", label: "Settings" },
  ];
  return (
    <div className="container py-10 lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
      <aside className="mb-8 lg:mb-0">
        <p className="font-display text-2xl text-ink">{user.name}</p>
        <p className="mb-5 text-xs text-muted">{ROLE_LABELS[user.role]}</p>
        <SideNav items={items} label="Account" />
        {can(user.role, "admin:leads") && <Link href="/admin" className="mt-6 hidden rounded border border-accent/50 px-3 py-2 text-sm text-accent-ink lg:block">Open admin dashboard →</Link>}
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
