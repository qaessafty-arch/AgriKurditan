import { PageHeader } from "@/components/marketing/PageHeader";
import { getSetting } from "@/lib/settings";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Terms of service", description: "Terms for using the platform and ordering services.", path: "/terms" });

export default async function TermsPage() {
  const b = await getSetting("business");
  const sections: [string, string][] = [
    ["Design studies, not construction documents", "3D models, studio configurations, summaries and AI-assisted briefs are preliminary design studies. They are not certified engineering drawings or construction-ready plans and make no claim of structural safety or regulatory compliance. Any building work requires drawings prepared and verified by qualified, licensed professionals."],
    ["Orders and payment", "Prices are shown before you order. Orders are confirmed only after we verify your payment. Subscriptions are paid per period and do not renew automatically. Unpaid orders can be cancelled from your account."],
    ["Scope of services", "The scope, deliverables and fees for commissions are agreed in writing in a proposal before work begins."],
    ["Your content", "You keep ownership of photos and information you upload and grant us permission to use them to provide the requested services."],
    ["Accounts", "Keep your password confidential. We may suspend accounts used to abuse the platform."],
  ];
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms of service" />
      <div className="container max-w-3xl space-y-8 py-12">
        {sections.map(([h, t]) => <section key={h}><h2 className="font-display text-2xl text-ink">{h}</h2><p className="mt-2 leading-relaxed text-muted">{t}</p></section>)}
        <p className="text-xs text-muted">{b.companyName}. Have these terms reviewed by legal counsel for your jurisdiction before launch.</p>
      </div>
    </>
  );
}
