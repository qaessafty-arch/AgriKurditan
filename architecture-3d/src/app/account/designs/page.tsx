import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { uploadUrl } from "@/lib/storage";
import { dateLabel } from "@/lib/format";
import { getPlan } from "@/three/plans";
import { ActionButton } from "@/components/account/AccountActions";
import { ButtonLink } from "@/components/ui/Button";

export default async function DesignsPage() {
  const user = await requirePageUser("/account/designs");
  const designs = await db.design.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
  return (
    <div>
      <div className="flex items-center justify-between gap-4"><h1 className="text-display-md text-ink">Saved designs</h1><ButtonLink href="/studio" size="sm">New design</ButtonLink></div>
      {designs.length === 0 ? <p className="mt-6 text-muted">No saved designs. Open the <Link href="/studio" className="text-accent-ink hover:underline">design studio</Link> and save one.</p> : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {designs.map((d) => {
            const thumb = uploadUrl(d.thumbnailId);
            return (
              <li key={d.id} className="card overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {thumb ? <img src={thumb} alt="" className="aspect-[16/10] w-full object-cover" /> : <div className="aspect-[16/10] bg-surface" />}
                <div className="space-y-3 p-4">
                  <div><p className="font-medium text-ink">{d.name}</p><p className="text-xs text-muted">{getPlan(d.presetId).name} · updated {dateLabel(d.updatedAt)}</p></div>
                  <div className="flex flex-wrap gap-2">
                    <ButtonLink href={`/studio?design=${d.id}`} size="sm">Open</ButtonLink>
                    <ButtonLink href={`/quote?design=${d.id}`} size="sm" variant="secondary">Request quote</ButtonLink>
                    <ActionButton url={`/api/designs/${d.id}`} method="DELETE" label="Delete" variant="ghost" confirm={`Delete “${d.name}”? This cannot be undone.`} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
