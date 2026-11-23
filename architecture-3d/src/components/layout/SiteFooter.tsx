import Link from "next/link";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { SITE } from "@/lib/site";

export function SiteFooter({ business }: { business: { companyName: string; email: string; phone: string; address: string; whatsappUrl: string | null } }) {
  const year = new Date().getFullYear();
  const cols = [
    { title: "Explore", links: [["/projects", "Projects"], ["/explore", "3D explorer"], ["/studio", "Design studio"], ["/assistant", "AI assistant"]] },
    { title: "Services", links: [["/services", "All services"], ["/pricing", "Pricing and plans"], ["/consultation", "Book a consultation"], ["/quote", "Request a quote"]] },
    { title: "Company", links: [["/reviews", "Client reviews"], ["/contact", "Contact"], ["/privacy", "Privacy"], ["/terms", "Terms"]] },
  ] as const;

  return (
    <footer className="border-t hairline bg-surface/40">
      <div className="container grid gap-12 py-16 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-sm">
          <p className="font-display text-2xl text-ink">{business.companyName}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{SITE.tagline}.</p>
          <div className="mt-6 space-y-1 text-sm text-muted">
            {business.address && <p>{business.address}</p>}
            {business.email && <p><a className="hover:text-ink" href={`mailto:${business.email}`}>{business.email}</a></p>}
            {business.phone && <p><a className="hover:text-ink" href={`tel:${business.phone.replace(/\s/g, "")}`}>{business.phone}</a></p>}
            {business.whatsappUrl && (
              <p><a className="text-accent-ink hover:underline" href={business.whatsappUrl} target="_blank" rel="noopener noreferrer">Message us on WhatsApp</a></p>
            )}
          </div>
        </div>
        {cols.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="eyebrow">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map(([href, label]) => (
                <li key={href}><Link href={href} className="text-sm text-muted transition-colors hover:text-ink">{label}</Link></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="container border-t hairline py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-ink">Project notes, once a month</p>
            <p className="mb-3 text-xs text-muted">New case studies and design guidance. Unsubscribe any time.</p>
            <NewsletterForm />
          </div>
          <p className="text-xs text-muted">© {year} {business.companyName}. Visualisations are design studies, not construction documents.</p>
        </div>
      </div>
    </footer>
  );
}
