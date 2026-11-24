"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { LOCALES, LOCALE_META, localePath, splitLocale } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";

/**
 * Full-page navigation (not client routing) so the root layout re-renders with the new lang/dir,
 * fonts and messages. Choosing a language also sets the remembered-language cookie via middleware.
 */
export function LanguageSwitcher({ className, compact }: { className?: string; compact?: boolean }) {
  const { locale, m } = useI18n();
  const pathname = usePathname();
  const search = useSearchParams();
  const { path } = splitLocale(pathname);
  const qs = search.toString();
  return (
    <nav aria-label={m.common.language} className={cn("flex items-center gap-0.5", className)}>
      {LOCALES.map((l) => {
        const href = `${l === "en" ? `/en${path === "/" ? "" : path}` : localePath(path, l)}${qs ? `?${qs}` : ""}`;
        return (
          <a
            key={l}
            href={href}
            hrefLang={LOCALE_META[l].hreflang}
            lang={l}
            aria-current={l === locale ? "true" : undefined}
            title={LOCALE_META[l].english}
            className={cn("rounded px-2 py-1.5 text-xs transition-colors", l === locale ? "bg-ink/10 text-ink" : "text-muted hover:text-ink", compact && "px-1.5")}
          >
            {compact ? (l === "en" ? "EN" : l === "ar" ? "ع" : "ک") : LOCALE_META[l].label}
          </a>
        );
      })}
    </nav>
  );
}
