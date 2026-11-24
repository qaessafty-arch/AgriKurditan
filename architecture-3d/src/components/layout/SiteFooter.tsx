import { Link } from "@/i18n/client";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { getI18n } from "@/i18n/server";

export async function SiteFooter({ business }: { business: { companyName: string; email: string; phone: string; address: string; whatsappUrl: string | null } }) {
  const { m } = await getI18n();
  const f = m.footer;
  const year = new Date().getFullYear();
  const cols = [
    { title: f.explore, links: [["/projects", m.nav.projects], ["/explore", f.explorer], ["/studio", m.nav.studio], ["/assistant", m.nav.assistant]] },
    { title: f.services, links: [["/services", f.allServices], ["/pricing", f.pricingPlans], ["/consultation", f.bookConsultation], ["/quote", f.requestQuote]] },
    { title: f.company, links: [["/reviews", f.reviews], ["/contact", f.contact], ["/privacy", f.privacy], ["/terms", f.terms]] },
  ];

  return (
    <footer className="border-t hairline bg-surface/40">
      <div className="container grid gap-12 py-16 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-sm">
          <p className="font-display text-2xl text-ink" dir="auto">{business.companyName}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{m.meta.tagline}.</p>
          <div className="mt-6 space-y-1 text-sm text-muted">
            {business.address && <p dir="auto">{business.address}</p>}
            {business.email && <p><a className="hover:text-ink" href={`mailto:${business.email}`} dir="ltr">{business.email}</a></p>}
            {business.phone && <p><a className="hover:text-ink" href={`tel:${business.phone.replace(/\s/g, "")}`} dir="ltr">{business.phone}</a></p>}
            {business.whatsappUrl && <p><a className="text-accent-ink hover:underline" href={business.whatsappUrl} target="_blank" rel="noopener noreferrer">{f.whatsapp}</a></p>}
          </div>
        </div>
        {cols.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="eyebrow">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map(([href, label]) => <li key={href}><Link href={href!} className="text-sm text-muted transition-colors hover:text-ink">{label}</Link></li>)}
            </ul>
          </nav>
        ))}
      </div>
      <div className="container border-t hairline py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-ink">{f.newsletterTitle}</p>
            <p className="mb-3 text-xs text-muted">{f.newsletterBody}</p>
            <NewsletterForm />
          </div>
          <p className="text-xs text-muted">© {year} {business.companyName}. {f.rights}</p>
        </div>
      </div>
    </footer>
  );
}
