import { Link } from "@/i18n/client";
import { requirePageCapability } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { dashboardMetrics } from "@/lib/analytics";
import { getSetting } from "@/lib/settings";
import { money } from "@/lib/format";
import { BarChart, RankList, StatTile } from "@/components/admin/Charts";

export default async function AdminOverview() {
  const user = await requirePageCapability("admin:leads", "/admin");
  const { currency } = await getSetting("payments");
  const m = await dashboardMetrics(currency);
  const full = can(user.role, "admin:analytics");
  return (
    <div className="space-y-8">
      <h1 className="text-display-md text-ink">Overview</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        {[["Payments to verify", m.queue.pendingPayments, "/admin/payments", "admin:commerce"], ["New consultation requests", m.queue.openConsults, "/admin/consultations", "admin:leads"], ["Projects awaiting review", m.queue.pendingReviews, "/admin/projects", "admin:content"]]
          .filter(([, , , cap]) => can(user.role, cap as never)).map(([label, n, href]) => (
            <Link key={label as string} href={href as string} className="card flex items-center justify-between p-4 hover:border-line-strong">
              <span className="text-sm text-ink">{label}</span>
              <span className={(n as number) > 0 ? "rounded-full bg-accent px-2.5 py-0.5 text-sm font-semibold text-[#101114]" : "text-sm text-muted"}>{n}</span>
            </Link>
          ))}
      </div>
      {full && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatTile label="Revenue, 30 days" value={money(m.revenue30, currency)} note={`Verified payments only${m.otherCurrencies.length ? `; excludes ${m.otherCurrencies.join(", ")}` : ""}`} />
            <StatTile label="Conversion rate" value={m.conversionRate === null ? "—" : `${(m.conversionRate * 100).toFixed(1)}%`} note={`Leads and orders ÷ ${m.consentingVisitors} consenting visitors`} />
            <StatTile label="New customers" value={String(m.newCustomers30)} note="Accounts created, 30 days" />
            <StatTile label="Project inquiries" value={String(m.inquiries30)} note="Consultations and quotes, 30 days" />
            <StatTile label="Abandoned quotes" value={String(m.abandonedQuotes)} note="Started but not sent within 24 h" />
          </div>
          <div className="grid items-start gap-4 xl:grid-cols-2">
            <BarChart title={`Verified revenue by month (${currency})`} data={m.revenueByMonth} format={(v) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(Math.round(v)))} />
            <BarChart title="Project inquiries per week" data={m.leadsByWeek} format={(v) => String(Math.round(v))} />
            <BarChart title="New customer accounts per week" data={m.customersByWeek} format={(v) => String(Math.round(v))} />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <RankList title="Popular services (all-time inquiries)" items={m.popularServices} empty="No inquiries linked to services yet." />
              <RankList title="Most-viewed projects" items={m.topProjects.map((p) => ({ label: p.title, value: p.viewCount, href: `/projects/${p.slug}` }))} empty="No project views yet." />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
