import { ContactForm } from "@/components/forms/LeadForms";
import { PageHeader } from "@/components/marketing/PageHeader";
import { getCurrentUser } from "@/lib/auth/session";
import { getSetting, whatsappLink } from "@/lib/settings";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Contact", description: "Contact the studio.", path: "/contact" });

export default async function ContactPage() {
  const [user, b] = await Promise.all([getCurrentUser(), getSetting("business")]);
  const wa = whatsappLink(b.whatsapp, "Hello, I have a question about a project.");
  return (
    <>
      <PageHeader eyebrow="Contact" title="Get in touch." />
      <div className="container grid gap-12 py-12 lg:grid-cols-[1.4fr_1fr]">
        <ContactForm prefill={{ name: user?.name, email: user?.email, phone: user?.phone }} />
        <aside className="card h-fit space-y-3 p-6 text-sm">
          <h2 className="font-display text-2xl text-ink">{b.companyName}</h2>
          {b.address && <p className="text-muted">{b.address}</p>}
          {b.hours && <p className="text-muted">{b.hours}</p>}
          {b.email && <p><a href={`mailto:${b.email}`} className="text-accent-ink hover:underline">{b.email}</a></p>}
          {b.phone && <p><a href={`tel:${b.phone.replace(/\s/g, "")}`} className="text-accent-ink hover:underline">{b.phone}</a></p>}
          {wa && <p><a href={wa} target="_blank" rel="noopener noreferrer" className="text-accent-ink hover:underline">WhatsApp</a></p>}
          {!b.address && !b.email && !b.phone && <p className="text-muted">Use the form and we will reply by email.</p>}
        </aside>
      </div>
    </>
  );
}
