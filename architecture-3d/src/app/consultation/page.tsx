import { ConsultationForm } from "@/components/forms/LeadForms";
import { PageHeader } from "@/components/marketing/PageHeader";
import { leadPageData } from "@/lib/leads-page";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Book a consultation", description: "Talk to an architect about your site, brief and budget.", path: "/consultation" });

export default async function ConsultationPage({ searchParams }: { searchParams: Promise<{ service?: string; topic?: string; design?: string; brief?: string }> }) {
  const sp = await searchParams;
  const d = await leadPageData(sp);
  return (
    <>
      <PageHeader eyebrow="Consultation" title="Talk to an architect.">A first conversation about your site, brief and budget. We confirm the time with you by email or phone.</PageHeader>
      <div className="container max-w-3xl py-12">
        <ConsultationForm prefill={d.prefill} services={d.services} signedIn={Boolean(d.user)}
          defaults={{ service: sp.service, topic: sp.topic?.slice(0, 120), designId: d.design?.id, designName: d.design?.name, briefId: d.brief?.id }} />
      </div>
    </>
  );
}
