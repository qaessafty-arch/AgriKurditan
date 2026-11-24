/** Locale configuration. English is unprefixed; Arabic and Central Kurdish (Sorani) live under /ar and /ckb. */
export const LOCALES = ["en", "ar", "ckb"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "a3d-locale";
export const LOCALE_HEADER = "x-a3d-locale";

export const LOCALE_META: Record<Locale, { label: string; english: string; dir: "ltr" | "rtl"; intl: string; numberLocale: string; hreflang: string }> = {
  en: { label: "English", english: "English", dir: "ltr", intl: "en-GB", numberLocale: "en-GB", hreflang: "en" },
  ar: { label: "العربية", english: "Arabic", dir: "rtl", intl: "ar-IQ", numberLocale: "ar-IQ", hreflang: "ar" },
  ckb: { label: "کوردی", english: "Kurdish (Sorani)", dir: "rtl", intl: "ckb-IQ", numberLocale: "ar-IQ", hreflang: "ckb" },
};

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

/** Prefix an internal path with the locale. API routes, files and external URLs are untouched. */
export function localePath(path: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/api/") || path.startsWith("/_next/") || /\.[a-z0-9]{2,5}($|\?)/i.test(path)) return path;
  if (path.startsWith(`/${locale}/`) || path === `/${locale}`) return path;
  return `/${locale}${path === "/" ? "" : path}`;
}

/** Split a pathname into its locale prefix and the remaining path. */
export function splitLocale(pathname: string): { locale: Locale | null; path: string } {
  const seg = pathname.split("/")[1];
  if (isLocale(seg)) {
    const rest = pathname.slice(seg.length + 1);
    return { locale: seg, path: rest === "" ? "/" : rest };
  }
  return { locale: null, path: pathname };
}

/** Pick a locale from an Accept-Language header ("ku" is treated as Sorani). */
export function negotiate(accept: string | null): Locale {
  if (!accept) return DEFAULT_LOCALE;
  const tags = accept.split(",").map((p) => {
    const [tag, q] = p.trim().split(";q=");
    return { tag: (tag ?? "").toLowerCase(), q: q ? Number(q) : 1 };
  }).sort((a, b) => b.q - a.q);
  for (const { tag } of tags) {
    if (tag.startsWith("ckb") || tag === "ku" || tag.startsWith("ku-")) return "ckb";
    if (tag.startsWith("ar")) return "ar";
    if (tag.startsWith("en")) return "en";
  }
  return DEFAULT_LOCALE;
}

/** Simple {placeholder} interpolation. */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}
