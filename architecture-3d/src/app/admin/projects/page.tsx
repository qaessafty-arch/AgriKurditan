import { Link } from "@/i18n/client";
import { db } from "@/lib/db";
import { requirePageCapability } from "@/lib/auth/session";
import { titleCase } from "@/lib/format";
import { StatusBadge } from "@/components/account/StatusBadge";
import { PatchForm } from "@/components/admin/PatchForm";
import { ActionButton } from "@/components/account/AccountActions";

export default async function AdminProjects() {
  await requirePageCapability("admin:content", "/admin/projects");
  const projects = await db.project.findMany({ orderBy: [{ status: "asc" }, { updatedAt: "desc" }], include: { owner: { select: { name: true } } } });
  return (
    <div>
      <h1 className="text-display-md text-ink">Projects</h1>
      <ul className="mt-6 space-y-4">
        {projects.map((p) => (
          <li key={p.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-ink">{p.status === "PUBLISHED" ? <Link href={`/projects/${p.slug}`} className="hover:underline">{p.title}</Link> : p.title} <span className="text-sm font-normal text-muted">· {p.owner?.name ?? "Studio"} · {p.viewCount} views · {p.isConcept ? "Concept" : "Built"}</span></p>
              <StatusBadge status={p.status} />
            </div>
            <p className="mt-1 text-sm text-muted">{p.summary}</p>
            <p className="mt-1 text-xs text-muted">{[...p.styles, ...p.categories].map(titleCase).join(" · ")}</p>
            <div className="mt-4 flex flex-wrap items-end gap-4 border-t hairline pt-4">
              <PatchForm compact url={`/api/admin/projects/${p.id}`} fields={[
                { name: "status", label: "Status", type: "select", value: p.status, options: ["DRAFT", "PENDING_REVIEW", "PUBLISHED", "ARCHIVED"].map((v) => ({ value: v, label: titleCase(v) })) },
                { name: "featured", label: "Featured", type: "checkbox", value: p.featured },
                { name: "featuredUntil", label: "Featured until", type: "date", value: p.featuredUntil?.toISOString().slice(0, 10) ?? "" },
              ]} />
              <ActionButton url={`/api/admin/projects/${p.id}`} method="DELETE" label="Delete" variant="ghost" confirm={`Delete ${p.title} permanently?`} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
