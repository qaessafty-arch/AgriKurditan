import { db } from "@/lib/db";

/** Approved customer reviews only. Renders nothing until real reviews exist. */
export async function ReviewsStrip({ limit = 3 }: { limit?: number }) {
  const reviews = await db.review.findMany({ where: { approved: true }, orderBy: { createdAt: "desc" }, take: limit, include: { user: { select: { name: true } } } });
  if (reviews.length === 0) return null;
  return (
    <section className="border-t hairline py-24" aria-labelledby="reviews-heading">
      <div className="container">
        <p className="eyebrow">Client reviews</p>
        <h2 id="reviews-heading" className="mt-3 text-display-md text-ink">What clients say</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.id} className="card p-6">
              <div className="text-accent" aria-label={`${r.rating} out of 5 stars`}>{"★".repeat(r.rating)}<span className="text-ink/20">{"★".repeat(5 - r.rating)}</span></div>
              <blockquote className="mt-3">
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
