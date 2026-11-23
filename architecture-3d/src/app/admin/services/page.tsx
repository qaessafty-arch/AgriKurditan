import { db } from "@/lib/db";
import { requirePageCapability } from "@/lib/auth/session";
import { PatchForm } from "@/components/admin/PatchForm";

export default async function AdminServices() {
  await requirePageCapability("admin:catalog", "/admin/services");
  const services = await db.service.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div>
      <h1 className="text-display-md text-ink">Services</h1>
      <div className="mt-6 space-y-4">
        {services.map((s) => (
          <details key={s.id} className="card p-5">
            <summary className="cursor-pointer font-medium text-ink">{s.name} {!s.published && <span className="text-xs text-muted">(hidden)</span>}</summary>
            <div className="mt-4 max-w-2xl">
              <PatchForm url={`/api/admin/services/${s.id}`} fields={[
                { name: "name", label: "Name", type: "text", value: s.name },
                { name: "tagline", label: "Tagline", type: "text", value: s.tagline },
                { name: "description", label: "Description", type: "textarea", value: s.description },
                { name: "benefits", label: "Benefits (one per line)", type: "textarea", value: s.benefits.join("\n") },
                { name: "sortOrder", label: "Order", type: "number", value: s.sortOrder },
                { name: "published", label: "Published", type: "checkbox", value: s.published },
              ]} />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
