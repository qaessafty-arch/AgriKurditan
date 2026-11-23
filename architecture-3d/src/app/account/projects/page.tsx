import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageCapability } from "@/lib/auth/session";
import { hasEntitlement } from "@/lib/entitlements";
import { dateLabel } from "@/lib/format";
import { StatusBadge } from "@/components/account/StatusBadge";
import { ProjectSubmitForm } from "@/components/account/ProjectSubmitForm";
import { ButtonLink } from "@/components/ui/Button";

export default async function MyProjectsPage() {
  const user = await requirePageCapability("projects:submit", "/account/projects");
  const [projects, designs, pro] = await Promise.all([
    db.project.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" } }),
    db.design.findMany({ where: { userId: user.id }, select: { id: true, name: true }, orderBy: { updatedAt: "desc" } }),
    hasEntitlement(user, "architect_pro"),
  ]);
  return (
    <div className="space-y-10">
      <h1 className="text-display-md text-ink">My projects</h1>
      {projects.length > 0 && (
        <table className="table-base"><thead><tr><th>Project</th><th>Status</th><th>Views</th><th>Submitted</th></tr></thead>
          <tbody>{projects.map((p) => <tr key={p.id}><td>{p.status === "PUBLISHED" ? <Link className="text-accent-ink hover:underline" href={`/projects/${p.slug}`}>{p.title}</Link> : p.title}{p.featured && <span className="ml-2 text-xs text-accent-ink">Featured</span>}</td><td><StatusBadge status={p.status} /></td><td>{p.viewCount}</td><td>{dateLabel(p.createdAt)}</td></tr>)}</tbody>
        </table>
      )}
      <section className="card max-w-2xl p-6">
        <h2 className="font-display text-2xl text-ink">Publish a project</h2>
        {!pro ? (
          <div className="mt-3 space-y-3 text-sm text-muted"><p>Publishing to the gallery is part of the Architect Professional plan.</p><ButtonLink href="/pricing#architects" size="sm">See architect plans</ButtonLink></div>
        ) : designs.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Build the project in the <Link href="/studio" className="text-accent-ink hover:underline">design studio</Link> and save it first; it becomes the interactive 3D preview.</p>
        ) : <div className="mt-4"><ProjectSubmitForm designs={designs} /></div>}
      </section>
    </div>
  );
}
