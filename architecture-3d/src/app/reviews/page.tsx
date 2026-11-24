import { Link } from "@/i18n/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/marketing/PageHeader";
import { ReviewForm } from "@/components/forms/ReviewForm";
import { dateLabel } from "@/lib/format";
import { jsonLd, pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/config";
import { num } from "@/i18n/labels";

export async function generateMetadata() {
  const { m, locale } = await getI18n();
  return pageMeta({ title: m.pages.reviews.metaTitle, description: m.pages.reviews.metaDescription, path: "/reviews", locale });
}

export default async function ReviewsPage() {
  const { m, locale } = await getI18n();
  const R = m.pages.reviews;
  const [user, reviews] = await Promise.all([
    getCurrentUser(),
    db.review.findMany({ where: { approved: true }, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
  ]);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  return (
    <>
      {reviews.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "ProfessionalService", name: SITE.name, url: SITE.url, aggregateRating: { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: reviews.length } }) }} />}
      <PageHeader eyebrow={R.eyebrow} title={R.title}>{R.intro}</PageHeader>
      <div className="container grid gap-12 py-12 lg:grid-cols-[1.5fr_1fr]">
        <div>
          {reviews.length === 0 ? <p className="text-muted">{R.none}</p> : (
            <>
              <p className="text-sm text-muted">{fmt(R.average, { avg: num(locale, avg, 1), n: num(locale, reviews.length) })}</p>
              <ul className="mt-6 space-y-6">
                {reviews.map((r) => (
                  <li key={r.id} className="card p-6" dir="auto">
                    <p className="text-accent" aria-label={fmt(R.stars, { n: num(locale, r.rating) })}>{"★".repeat(r.rating)}<span className="text-ink/20">{"★".repeat(5 - r.rating)}</span></p>
                    <h2 className="mt-2 font-medium text-ink">{r.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{r.body}</p>
                    <p className="mt-3 text-xs text-muted">{r.user.name.split(" ")[0]} · {dateLabel(r.createdAt, false, locale)}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <aside className="card h-fit p-6">
          <h2 className="font-display text-2xl text-ink">{R.write}</h2>
          {user ? <div className="mt-4"><ReviewForm /></div> : <p className="mt-2 text-sm text-muted"><Link href="/login?next=/reviews" className="text-accent-ink hover:underline">{R.signInTo}</Link> {R.signInSuffix}</p>}
        </aside>
      </div>
    </>
  );
}
