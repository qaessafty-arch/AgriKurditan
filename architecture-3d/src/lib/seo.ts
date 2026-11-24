import type { Metadata } from "next";
import { SITE } from "./site";
import { LOCALES, LOCALE_META, localePath, type Locale } from "@/i18n/config";

/** Serialize JSON-LD safely for inline <script> tags (prevents `</script>` injection). */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

/** hreflang alternates for a path in every language, plus x-default (English). */
export function languageAlternates(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of LOCALES) out[LOCALE_META[l].hreflang] = localePath(path, l);
  out["x-default"] = path;
  return out;
}

export function pageMeta({ title, description, path, image, locale = "en" }: { title: string; description: string; path: string; image?: string; locale?: Locale }): Metadata {
  const canonical = localePath(path, locale);
  return {
    title,
    description,
    alternates: { canonical, languages: languageAlternates(path) },
    openGraph: { title, description, url: `${SITE.url}${canonical}`, locale: LOCALE_META[locale].intl.replace("-", "_"), ...(image ? { images: [{ url: image }] } : {}) },
    twitter: { title, description },
  };
}
