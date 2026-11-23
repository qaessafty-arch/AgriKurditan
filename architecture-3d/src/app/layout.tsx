import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ConsentBanner } from "@/components/layout/ConsentBanner";
import { THEME_SCRIPT } from "@/components/layout/ThemeToggle";
import { getCurrentUser } from "@/lib/auth/session";
import { getSetting, whatsappLink } from "@/lib/settings";
import { db } from "@/lib/db";
import { SITE } from "@/lib/site";
import { jsonLd } from "@/lib/seo";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s — ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: { type: "website", siteName: SITE.name, locale: "en_US" },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#101114" },
    { media: "(prefers-color-scheme: light)", color: "#F5F3EF" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, business] = await Promise.all([getCurrentUser(), getSetting("business")]);
  const unread = user ? await db.notification.count({ where: { userId: user.id, readAt: null } }) : 0;
  const waUrl = whatsappLink(business.whatsapp, "Hello, I would like to discuss an architecture project.");

  return (
    <html lang="en" data-theme="dark" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              name: business.companyName,
              url: SITE.url,
              description: SITE.description,
              ...(business.email ? { email: business.email } : {}),
              ...(business.phone ? { telephone: business.phone } : {}),
              ...(business.address ? { address: business.address } : {}),
            }),
          }}
        />
      </head>
      <body className="min-h-screen">
        <SiteHeader user={user ? { name: user.name, role: user.role, unread } : null} />
        <main id="main">{children}</main>
        <SiteFooter business={{ companyName: business.companyName, email: business.email, phone: business.phone, address: business.address, whatsappUrl: waUrl }} />
        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-5 right-5 z-30 grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-[#0b2b17] shadow-panel transition-transform hover:scale-105"
            aria-label="Chat with us on WhatsApp"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden fill="currentColor">
              <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.2-.4.2-.4.7-1.3a.5.5 0 000-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 001.8-1.3 2.2 2.2 0 00.1-1.3c0-.1-.2-.2-.5-.3z" />
            </svg>
          </a>
        )}
        <ConsentBanner />
      </body>
    </html>
  );
}
