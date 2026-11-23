import type { Metadata } from "next";
import { requirePageCapability } from "@/lib/auth/session";
import { can, type Capability } from "@/lib/auth/permissions";
import { SideNav } from "@/components/account/SideNav";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

const ITEMS: { href: string; label: string; cap: Capability }[] = [
  { href: "/admin", label: "Overview", cap: "admin:leads" },
  { href: "/admin/consultations", label: "Consultations", cap: "admin:leads" },
  { href: "/admin/quotes", label: "Quote requests", cap: "admin:leads" },
  { href: "/admin/messages", label: "Messages", cap: "admin:leads" },
  { href: "/admin/orders", label: "Orders", cap: "admin:commerce" },
  { href: "/admin/payments", label: "Payments", cap: "admin:commerce" },
  { href: "/admin/subscriptions", label: "Subscriptions", cap: "admin:commerce" },
  { href: "/admin/users", label: "Users", cap: "admin:users" },
  { href: "/admin/projects", label: "Projects", cap: "admin:content" },
  { href: "/admin/assets", label: "3D assets", cap: "admin:content" },
  { href: "/admin/services", label: "Services", cap: "admin:catalog" },
  { href: "/admin/pricing", label: "Pricing", cap: "admin:catalog" },
  { href: "/admin/reviews", label: "Reviews", cap: "admin:content" },
  { href: "/admin/newsletter", label: "Newsletter", cap: "admin:content" },
  { href: "/admin/settings", label: "Settings", cap: "admin:settings" },
  { href: "/admin/audit", label: "Audit log", cap: "admin:settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageCapability("admin:leads", "/admin");
  return (
    <div className="px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[200px_1fr] lg:gap-8 lg:px-8">
      <aside className="mb-6 lg:mb-0">
        <p className="eyebrow mb-4">Admin</p>
        <SideNav items={ITEMS.filter((i) => can(user.role, i.cap))} label="Admin" />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
