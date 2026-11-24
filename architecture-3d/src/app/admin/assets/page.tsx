import { Link } from "@/i18n/client";
import { db } from "@/lib/db";
import { requirePageCapability } from "@/lib/auth/session";
import { PLANS } from "@/three/plans";
import { generateBuilding } from "@/three/generate";
import { titleCase } from "@/lib/format";

export default async function AdminAssets() {
  await requirePageCapability("admin:content", "/admin/assets");
  const [uploads, usage] = await Promise.all([
    db.upload.groupBy({ by: ["purpose"], _count: true, _sum: { sizeBytes: true } }),
    db.project.groupBy({ by: ["presetId"], _count: true }),
  ]);
  return (
    <div className="space-y-10">
      <h1 className="text-display-md text-ink">3D assets</h1>
      <section>
        <h2 className="font-display text-2xl text-ink">Parametric building models</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">Buildings are generated from these floor plans at runtime, so materials, glazing, roof and landscape are configurable without separate model files. New types are added in <code className="font-mono text-xs">src/three/plans.ts</code>.</p>
        <div className="mt-4 overflow-x-auto"><table className="table-base"><thead><tr><th>Model</th><th>Floors</th><th>Floor area</th><th>Geometry parts</th><th>Used by projects</th><th /></tr></thead>
          <tbody>{PLANS.map((p) => {
            const m = generateBuilding(p, p.defaultConfig);
            return <tr key={p.id}><td>{p.name}<p className="text-xs text-muted">{p.id} · {titleCase(p.category)} · {p.style}</p></td><td>{m.stats.floors}</td><td>{m.stats.grossFloorArea} m²</td><td className="font-mono text-xs">{m.parts.length}</td>
              <td>{usage.find((u) => u.presetId === p.id)?._count ?? 0}</td><td><Link className="text-accent-ink hover:underline" href={`/explore?plan=${p.id}`}>Preview</Link></td></tr>;
          })}</tbody></table></div>
      </section>
      <section>
        <h2 className="font-display text-2xl text-ink">Uploaded files</h2>
        <table className="table-base mt-4"><thead><tr><th>Purpose</th><th>Files</th><th>Storage</th></tr></thead>
          <tbody>{uploads.map((u) => <tr key={u.purpose}><td>{titleCase(u.purpose)}</td><td>{u._count}</td><td>{((u._sum.sizeBytes ?? 0) / 1024 / 1024).toFixed(1)} MB</td></tr>)}
            {uploads.length === 0 && <tr><td colSpan={3} className="text-muted">No uploads yet.</td></tr>}</tbody></table>
      </section>
    </div>
  );
}
