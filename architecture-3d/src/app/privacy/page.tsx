import { PageHeader } from "@/components/marketing/PageHeader";
import { getSetting } from "@/lib/settings";
import { pageMeta } from "@/lib/seo";
import { getI18n } from "@/i18n/server";

export async function generateMetadata() {
  const { m, locale } = await getI18n();
  return pageMeta({ title: m.privacy.metaTitle, description: m.privacy.sections[0]!.t.slice(0, 150), path: "/privacy", locale });
}

export default async function Page() {
  const [{ m }, b] = await Promise.all([getI18n(), getSetting("business")]);
  const L = m.privacy;
  return (
    <>
      <PageHeader eyebrow={m.pages.legal} title={L.title} />
      <div className="container max-w-3xl space-y-8 py-12">
        {L.sections.map((s) => <section key={s.h}><h2 className="font-display text-2xl text-ink">{s.h}</h2><p className="mt-2 leading-relaxed text-muted">{s.t}</p></section>)}
        <p className="text-xs text-muted"><span dir="auto">{b.companyName}{b.address ? `, ${b.address}` : ""}</span>{b.email ? <> · <span dir="ltr">{b.email}</span></> : null}. {L.footer}</p>
      </div>
    </>
  );
}
