import { db } from "@/lib/db";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/config";
import { num } from "@/i18n/labels";

/** Approved customer reviews only. Renders nothing until real reviews exist. */
export async function ReviewsStrip({ limit = 3 }: { limit?: number }) {
  const { m, locale } = await getI18n();
  const reviews = await db.review.findMany({ where: { approved: true }, orderBy: { createdAt: "desc" }, take: limit, include: { user: { select: { name: true } } } });
  if (reviews.length === 0) return null;
  return (
    <section className="border-t hairline py-24" aria-labelledby="reviews-heading">
      <div className="container">
        <p className="eyebrow">{m.home.reviewsEyebrow}</p>
        <h2 id="reviews-heading" className="mt-3 text-display-md text-ink">{m.home.reviewsTitle}</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.id} className="card p-6">
              <div className="text-accent" aria-label={fmt(m.pages.reviews.stars, { n: num(locale, r.rating) })}>{"★".repeat(r.rating)}<span className="text-ink/20">{"★".repeat(5 - r.rating)}</span></div>
              <blockquote className="mt-3" dir="auto">
                <p className="font-medium text-ink">{r.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{r.body}</p>
              </blockquote>
              <figcaption className="mt-4 text-xs text-muted">— {r.user.name.split(" ")[0]}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
