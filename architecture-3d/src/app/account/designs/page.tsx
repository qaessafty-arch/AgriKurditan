import { Link } from "@/i18n/client";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { uploadUrl } from "@/lib/storage";
import { dateLabel } from "@/lib/format";
import { getPlan } from "@/three/plans";
import { ActionButton } from "@/components/account/AccountActions";
import { ButtonLink } from "@/components/ui/Button";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/config";
import { planName } from "@/i18n/labels";

export default async function DesignsPage() {
  const { m, locale } = await getI18n();
  const A = m.account;
  const user = await requirePageUser("/account/designs");
  const designs = await db.design.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
  return (
    <div>
      <div className="flex items-center justify-between gap-4"><h1 className="text-display-md text-ink">{A.designsTitle}</h1><ButtonLink href="/studio" size="sm">{A.newDesign}</ButtonLink></div>
      {designs.length === 0 ? <p className="mt-6 text-muted">{A.noDesigns} <Link href="/studio" className="text-accent-ink hover:underline">{A.openStudio}</Link></p> : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {designs.map((d) => {
            const thumb = uploadUrl(d.thumbnailId);
            return (
              <li key={d.id} className="card overflow-hidden">
                {thumb ? <img src={thumb} alt="" className="aspect-[16/10] w-full object-cover" /> : <div className="aspect-[16/10] bg-surface" />}
                <div className="space-y-3 p-4">
                  <div><p className="font-medium text-ink" dir="auto">{d.name}</p><p className="text-xs text-muted">{planName(m, getPlan(d.presetId))} · {fmt(A.updated, { date: dateLabel(d.updatedAt, false, locale) })}</p></div>
                  <div className="flex flex-wrap gap-2">
                    <ButtonLink href={`/studio?design=${d.id}`} size="sm">{A.open}</ButtonLink>
                    <ButtonLink href={`/quote?design=${d.id}`} size="sm" variant="secondary">{A.requestQuote}</ButtonLink>
                    <ActionButton url={`/api/designs/${d.id}`} method="DELETE" label={A.delete} variant="ghost" confirm={fmt(A.deleteConfirm, { name: d.name })} />
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
