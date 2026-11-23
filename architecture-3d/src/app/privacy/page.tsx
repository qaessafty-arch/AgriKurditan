import { PageHeader } from "@/components/marketing/PageHeader";
import { getSetting } from "@/lib/settings";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Privacy policy", description: "How we collect, use and protect your data.", path: "/privacy" });

export default async function PrivacyPage() {
  const b = await getSetting("business");
  const sections: [string, string][] = [
    ["What we collect", "Account details you give us (name, email, phone, company); project information you submit in forms, the design studio and the AI assistant, including land photographs; order and payment references; and, only if you accept analytics, anonymous page-view statistics linked to a random identifier stored in your browser."],
    ["Why we use it", "To respond to consultation and quote requests, deliver services you order, verify payments, operate your account and, with your consent, improve the website. We do not sell personal data or use advertising trackers."],
    ["AI assistant", "When an AI provider is enabled, your project description and photos are sent to that provider (Anthropic) to generate the brief. Otherwise briefs are produced on our own servers. Briefs and photos are stored so an architect can review them with you."],
    ["Cookies", "We use one essential cookie to keep you signed in. Analytics statistics are recorded only after you choose “Allow statistics”, and you can change this by clearing site data in your browser."],
    ["Storage and security", "Passwords are hashed; uploaded files are stored privately and served only to you and the staff handling your request. Security-relevant actions are logged."],
    ["Your rights", `You can update your profile in your account, and ask us to export or delete your data${b.email ? ` by writing to ${b.email}` : " through the contact page"}.`],
  ];
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy policy" />
      <div className="container max-w-3xl space-y-8 py-12">
        {sections.map(([h, t]) => <section key={h}><h2 className="font-display text-2xl text-ink">{h}</h2><p className="mt-2 leading-relaxed text-muted">{t}</p></section>)}
        <p className="text-xs text-muted">Operator: {b.companyName}{b.address ? `, ${b.address}` : ""}. Have this policy reviewed by legal counsel for your jurisdiction before launch.</p>
      </div>
    </>
  );
}
