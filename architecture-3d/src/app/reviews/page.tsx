import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/marketing/PageHeader";
import { ReviewForm } from "@/components/forms/ReviewForm";
import { dateLabel } from "@/lib/format";
import { jsonLd, pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = pageMeta({ title: "Client reviews", description: "Moderated reviews from clients who have worked with the studio.", path: "/reviews" });

export default async function ReviewsPage() {
  const [user, reviews] = await Promise.all([
    getCurrentUser(),
    db.review.findMany({ where: { approved: true }, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
  ]);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  return (
    <>
      {reviews.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "ProfessionalService", name: SITE.name, url: SITE.url, aggregateRating: { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: reviews.length } }) }} />}
      <PageHeader eyebrow="Reviews" title="What clients say.">Reviews come only from clients with a paid order, confirmed consultation or received quote, and are checked before publishing.</PageHeader>
      <div className="container grid gap-12 py-12 lg:grid-cols-[1.5fr_1fr]">
        <div>
          {reviews.length === 0 ? <p className="text-muted">No published reviews yet.</p> : (
            <>
              <p className="text-sm text-muted">{avg.toFixed(1)} out of 5 from {reviews.length} review{reviews.length > 1 ? "s" : ""}</p>
              <ul className="mt-6 space-y-6">
                {reviews.map((r) => (
                  <li key={r.id} className="card p-6">
                    <p className="text-accent" aria-label={`${r.rating} out of 5`}>{"★".repeat(r.rating)}<span className="text-ink/20">{"★".repeat(5 - r.rating)}</span></p>
                    <h2 className="mt-2 font-medium text-ink">{r.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{r.body}</p>
                    <p className="mt-3 text-xs text-muted">{r.user.name.split(" ")[0]} · {dateLabel(r.createdAt)}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <aside className="card h-fit p-6">
          <h2 className="font-display text-2xl text-ink">Write a review</h2>
          {user ? <div className="mt-4"><ReviewForm /></div> : <p className="mt-2 text-sm text-muted"><Link href="/login?next=/reviews" className="text-accent-ink hover:underline">Sign in</Link> to review a project we worked on together.</p>}
        </aside>
      </div>
    </>
  );
}
