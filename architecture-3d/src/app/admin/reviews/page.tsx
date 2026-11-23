import { db } from "@/lib/db";
import { requirePageCapability } from "@/lib/auth/session";
import { dateLabel } from "@/lib/format";
import { ActionButton } from "@/components/account/AccountActions";

export default async function AdminReviews() {
  await requirePageCapability("admin:content", "/admin/reviews");
  const reviews = await db.review.findMany({ orderBy: [{ approved: "asc" }, { createdAt: "desc" }], include: { user: { select: { name: true, email: true } } } });
  return (
    <div>
      <h1 className="text-display-md text-ink">Reviews</h1>
      <ul className="mt-6 space-y-4">
        {reviews.map((r) => (
          <li key={r.id} className="card p-5">
            <p className="text-xs text-muted">{dateLabel(r.createdAt)} · {r.user.name} ({r.user.email}) · {r.approved ? "Published" : "Awaiting approval"}</p>
            <p className="mt-1 text-accent">{"★".repeat(r.rating)}</p>
            <p className="font-medium text-ink">{r.title}</p>
            <p className="mt-1 text-sm text-ink/90">{r.body}</p>
            <div className="mt-3 flex gap-2">
              <ActionButton url={`/api/admin/reviews/${r.id}`} method="PATCH" body={{ approved: !r.approved }} label={r.approved ? "Unpublish" : "Approve"} variant={r.approved ? "secondary" : "primary"} />
              <ActionButton url={`/api/admin/reviews/${r.id}`} method="DELETE" label="Delete" variant="ghost" confirm="Delete this review?" />
            </div>
          </li>
        ))}
        {reviews.length === 0 && <p className="text-muted">No reviews yet.</p>}
      </ul>
    </div>
  );
}
