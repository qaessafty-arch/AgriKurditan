import { Link } from "@/i18n/client";
import { db } from "@/lib/db";
import { requirePageCapability } from "@/lib/auth/session";
import { hasEntitlement } from "@/lib/entitlements";
import { dateLabel } from "@/lib/format";
import { StatusBadge } from "@/components/account/StatusBadge";
import { ProjectSubmitForm } from "@/components/account/ProjectSubmitForm";
import { ButtonLink } from "@/components/ui/Button";
import { getI18n } from "@/i18n/server";
import { num } from "@/i18n/labels";

export default async function MyProjectsPage() {
  const { m, locale } = await getI18n();
  const A = m.account;
  const user = await requirePageCapability("projects:submit", "/account/projects");
  const [projects, designs, pro] = await Promise.all([
    db.project.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" } }),
    db.design.findMany({ where: { userId: user.id }, select: { id: true, name: true }, orderBy: { updatedAt: "desc" } }),
    hasEntitlement(user, "architect_pro"),
  ]);
  return (
    <div className="space-y-10">
      <h1 className="text-display-md text-ink">{A.projectsTitle}</h1>
      {projects.length > 0 && (
        <table className="table-base"><thead><tr><th>{A.pf.title}</th><th>{A.status}</th><th>{A.views}</th><th>{A.submittedOn}</th></tr></thead>
          <tbody>{projects.map((p) => <tr key={p.id}><td dir="auto">{p.status === "PUBLISHED" ? <Link className="text-accent-ink hover:underline" href={`/projects/${p.slug}`}>{p.title}</Link> : p.title}{p.featured && <span className="ms-2 text-xs text-accent-ink">{m.common.featured}</span>}</td><td><StatusBadge status={p.status} /></td><td>{num(locale, p.viewCount)}</td><td>{dateLabel(p.createdAt, false, locale)}</td></tr>)}</tbody>
        </table>
      )}
      <section className="card max-w-2xl p-6">
        <h2 className="font-display text-2xl text-ink">{A.publish}</h2>
        {!pro ? (
          <div className="mt-3 space-y-3 text-sm text-muted"><p>{A.needPlan}</p><ButtonLink href="/pricing#architects" size="sm">{A.seeArchitect}</ButtonLink></div>
        ) : designs.length === 0 ? <p className="mt-3 text-sm text-muted">{A.buildFirst}</p> : <div className="mt-4"><ProjectSubmitForm designs={designs} /></div>}
      </section>
    </div>
  );
}
