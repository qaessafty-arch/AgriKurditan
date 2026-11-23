import "server-only";
import { db } from "@/lib/db";

const DAY = 86400_000;

export interface Bucket { label: string; value: number }

function monthKey(d: Date) { return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`; }
function monthLabel(d: Date) { return new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(d); }
function weekStart(d: Date) { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x; }

/** Business metrics for the admin dashboard. Revenue counts only staff-verified payments. */
export async function dashboardMetrics(currency: string) {
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * DAY);
  const since6m = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
  const since8w = weekStart(new Date(now.getTime() - 7 * 7 * DAY));

  const [payments, customers30, consult30, quotes30, orders30, visitors30, abandoned, newUsers, consultsRecent, quotesRecent, serviceLeads, topProjects, pendingPayments, pendingReviews, openConsults] = await Promise.all([
    db.payment.findMany({ where: { status: "VERIFIED", verifiedAt: { gte: since6m } }, select: { amount: true, currency: true, verifiedAt: true } }),
    db.user.count({ where: { role: { not: "ADMIN" }, createdAt: { gte: since30 } } }),
    db.consultation.count({ where: { createdAt: { gte: since30 } } }),
    db.quoteRequest.count({ where: { status: { not: "DRAFT" }, submittedAt: { gte: since30 } } }),
    db.order.count({ where: { createdAt: { gte: since30 } } }),
    db.analyticsEvent.groupBy({ by: ["visitorId"], where: { createdAt: { gte: since30 } } }),
    db.quoteRequest.count({ where: { status: "DRAFT", createdAt: { lt: new Date(now.getTime() - DAY) } } }),
    db.user.findMany({ where: { role: { not: "ADMIN" }, createdAt: { gte: since8w } }, select: { createdAt: true } }),
    db.consultation.findMany({ where: { createdAt: { gte: since8w } }, select: { createdAt: true } }),
    db.quoteRequest.findMany({ where: { status: { not: "DRAFT" }, submittedAt: { gte: since8w } }, select: { submittedAt: true } }),
    db.service.findMany({ select: { name: true, _count: { select: { quotes: { where: { status: { not: "DRAFT" } } }, consultations: true } } } }),
    db.project.findMany({ where: { status: "PUBLISHED" }, orderBy: { viewCount: "desc" }, take: 5, select: { title: true, slug: true, viewCount: true } }),
    db.payment.count({ where: { status: "SUBMITTED" } }),
    db.project.count({ where: { status: "PENDING_REVIEW" } }),
    db.consultation.count({ where: { status: "REQUESTED" } }),
  ]);

  const inCurrency = payments.filter((p) => p.currency === currency);
  const otherCurrencies = [...new Set(payments.filter((p) => p.currency !== currency).map((p) => p.currency))];
  const revenue30 = inCurrency.filter((p) => p.verifiedAt && p.verifiedAt >= since30).reduce((s, p) => s + Number(p.amount), 0);

  const months: Bucket[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = monthKey(d);
    months.push({ label: monthLabel(d), value: inCurrency.filter((p) => p.verifiedAt && monthKey(p.verifiedAt) === key).reduce((s, p) => s + Number(p.amount), 0) });
  }

  const weeks = (dates: Date[]): Bucket[] => {
    const out: Bucket[] = [];
    for (let i = 7; i >= 0; i--) {
      const start = weekStart(new Date(now.getTime() - i * 7 * DAY));
      const end = new Date(start.getTime() + 7 * DAY);
      out.push({ label: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(start), value: dates.filter((d) => d >= start && d < end).length });
    }
    return out;
  };

  const leads30 = consult30 + quotes30;
  const conversions30 = leads30 + orders30;
  return {
    revenue30,
    otherCurrencies,
    conversionRate: visitors30.length > 0 ? conversions30 / visitors30.length : null,
    consentingVisitors: visitors30.length,
    newCustomers30: customers30,
    inquiries30: leads30,
    abandonedQuotes: abandoned,
    revenueByMonth: months,
    customersByWeek: weeks(newUsers.map((u) => u.createdAt)),
    leadsByWeek: weeks([...consultsRecent.map((c) => c.createdAt), ...quotesRecent.map((q) => q.submittedAt!).filter(Boolean)]),
    popularServices: serviceLeads.map((s) => ({ label: s.name, value: s._count.quotes + s._count.consultations })).filter((s) => s.value > 0).sort((a, b) => b.value - a.value).slice(0, 6),
    topProjects,
    queue: { pendingPayments, pendingReviews, openConsults },
  };
}
