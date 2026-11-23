import { QuoteForm } from "@/components/forms/LeadForms";
import { PageHeader } from "@/components/marketing/PageHeader";
import { leadPageData } from "@/lib/leads-page";
import { db } from "@/lib/db";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Request a quote", description: "Describe your project and receive a proposal from our architects.", path: "/quote" });

export default async function QuotePage({ searchParams }: { searchParams: Promise<{ service?: string; design?: string; brief?: string; project?: string; offering?: string }> }) {
  const sp = await searchParams;
  const d = await leadPageData(sp);
  const project = sp.project ? await db.project.findFirst({ where: { slug: sp.project, status: "PUBLISHED" }, select: { title: true } }) : null;
  const offering = sp.offering ? await db.offering.findUnique({ where: { slug: sp.offering }, select: { name: true } }) : null;
  const details = project ? `I am interested in a project similar to "${project.title}". ` : offering ? `I am interested in: ${offering.name}. ` : undefined;
  return (
    <>
      <PageHeader eyebrow="Quote" title="Request a quote.">Tell us what you want to build. We reply with a proposal, or with questions if we need more information.</PageHeader>
      <div className="container max-w-3xl py-12">
        <QuoteForm prefill={d.prefill} services={d.services} signedIn={Boolean(d.user)}
          defaults={{ service: sp.service, designId: d.design?.id, designName: d.design?.name, briefId: d.brief?.id, details }} />
      </div>
    </>
  );
}
