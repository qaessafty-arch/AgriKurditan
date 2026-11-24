import { QuoteForm } from "@/components/forms/LeadForms";
import { PageHeader } from "@/components/marketing/PageHeader";
import { leadPageData } from "@/lib/leads-page";
import { db } from "@/lib/db";
import { pageMeta } from "@/lib/seo";
import { tr } from "@/lib/content";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/config";

export async function generateMetadata() {
  const { m, locale } = await getI18n();
  return pageMeta({ title: m.pages.quote.metaTitle, description: m.pages.quote.metaDescription, path: "/quote", locale });
}

export default async function QuotePage({ searchParams }: { searchParams: Promise<{ service?: string; design?: string; brief?: string; project?: string; offering?: string }> }) {
  const { m, locale } = await getI18n();
  const Q = m.pages.quote;
  const sp = await searchParams;
  const d = await leadPageData(sp, locale);
  const project = sp.project ? await db.project.findFirst({ where: { slug: sp.project, status: "PUBLISHED" }, select: { title: true, translations: true } }) : null;
  const offering = sp.offering ? await db.offering.findUnique({ where: { slug: sp.offering }, select: { name: true, translations: true } }) : null;
  const details = project ? fmt(m.forms.similarProject, { title: tr(project, "title", locale) }) : offering ? fmt(m.forms.interestedIn, { name: tr(offering, "name", locale) }) : undefined;
  return (
    <>
      <PageHeader eyebrow={Q.eyebrow} title={Q.title}>{Q.intro}</PageHeader>
      <div className="container max-w-3xl py-12">
        <QuoteForm prefill={d.prefill} services={d.services} signedIn={Boolean(d.user)}
          defaults={{ service: sp.service, designId: d.design?.id, designName: d.design?.name, briefId: d.brief?.id, details }} />
      </div>
    </>
  );
}
