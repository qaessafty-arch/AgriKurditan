"use client";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { createContext, forwardRef, useContext, useMemo, type ComponentProps } from "react";
import { DEFAULT_LOCALE, LOCALE_META, localePath, type Locale } from "./config";
import en, { type Messages } from "./messages/en";

interface I18nValue { locale: Locale; m: Messages; dir: "ltr" | "rtl"; href: (path: string) => string }

const I18nContext = createContext<I18nValue>({ locale: DEFAULT_LOCALE, m: en, dir: "ltr", href: (p) => p });

export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Messages; children: React.ReactNode }) {
  const value = useMemo<I18nValue>(() => ({ locale, m: messages, dir: LOCALE_META[locale].dir, href: (p) => localePath(p, locale) }), [locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

/** next/link that keeps the visitor in their language. */
export const Link = forwardRef<HTMLAnchorElement, ComponentProps<typeof NextLink>>(function LocaleLink({ href, ...rest }, ref) {
  const { locale } = useI18n();
  const localized = typeof href === "string" ? localePath(href, locale) : href;
  return <NextLink ref={ref} href={localized} {...rest} />;
});

/** useRouter whose push/replace keep the current language prefix. */
export function useLocaleRouter() {
  const router = useRouter();
  const { locale } = useI18n();
  return useMemo(() => ({
    ...router,
    push: (href: string, opts?: Parameters<typeof router.push>[1]) => router.push(localePath(href, locale), opts),
    replace: (href: string, opts?: Parameters<typeof router.replace>[1]) => router.replace(localePath(href, locale), opts),
  }), [router, locale]);
}
