import { ContactForm } from "@/components/forms/LeadForms";
import { PageHeader } from "@/components/marketing/PageHeader";
import { getCurrentUser } from "@/lib/auth/session";
import { getSetting, whatsappLink } from "@/lib/settings";
import { pageMeta } from "@/lib/seo";
import { getI18n } from "@/i18n/server";

export async function generateMetadata() {
  const { m, locale } = await getI18n();
  return pageMeta({ title: m.pages.contact.metaTitle, description: m.pages.contact.metaDescription, path: "/contact", locale });
}

export default async function ContactPage() {
  const { m } = await getI18n();
  const C = m.pages.contact;
  const [user, b] = await Promise.all([getCurrentUser(), getSetting("business")]);
  const wa = whatsappLink(b.whatsapp, m.common.whatsappMessage);
  return (
    <>
      <PageHeader eyebrow={C.eyebrow} title={C.title} />
      <div className="container grid gap-12 py-12 lg:grid-cols-[1.4fr_1fr]">
        <ContactForm prefill={{ name: user?.name, email: user?.email, phone: user?.phone }} />
        <aside className="card h-fit space-y-3 p-6 text-sm">
          <h2 className="font-display text-2xl text-ink" dir="auto">{b.companyName}</h2>
          {b.address && <p className="text-muted">{b.address}</p>}
          {b.hours && <p className="text-muted">{b.hours}</p>}
          {b.email && <p><a href={`mailto:${b.email}`} className="text-accent-ink hover:underline">{b.email}</a></p>}
          {b.phone && <p><a href={`tel:${b.phone.replace(/\s/g, "")}`} className="text-accent-ink hover:underline">{b.phone}</a></p>}
          {wa && <p><a href={wa} target="_blank" rel="noopener noreferrer" className="text-accent-ink hover:underline">{m.footer.whatsapp}</a></p>}
          {!b.address && !b.email && !b.phone && <p className="text-muted">{C.fallback}</p>}
        </aside>
      </div>
    </>
  );
}
