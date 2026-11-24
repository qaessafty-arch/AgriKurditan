import { ConsultationForm } from "@/components/forms/LeadForms";
import { PageHeader } from "@/components/marketing/PageHeader";
import { leadPageData } from "@/lib/leads-page";
import { pageMeta } from "@/lib/seo";
import { getI18n } from "@/i18n/server";

export async function generateMetadata() {
  const { m, locale } = await getI18n();
  return pageMeta({ title: m.pages.consultation.metaTitle, description: m.pages.consultation.metaDescription, path: "/consultation", locale });
}

export default async function ConsultationPage({ searchParams }: { searchParams: Promise<{ service?: string; topic?: string; design?: string; brief?: string }> }) {
  const { m, locale } = await getI18n();
  const C = m.pages.consultation;
  const sp = await searchParams;
  const d = await leadPageData(sp, locale);
  return (
    <>
      <PageHeader eyebrow={C.eyebrow} title={C.title}>{C.intro}</PageHeader>
      <div className="container max-w-3xl py-12">
        <ConsultationForm prefill={d.prefill} services={d.services} signedIn={Boolean(d.user)}
          defaults={{ service: sp.service, topic: sp.topic?.slice(0, 120), designId: d.design?.id, designName: d.design?.name, briefId: d.brief?.id }} />
      </div>
    </>
  );
}
