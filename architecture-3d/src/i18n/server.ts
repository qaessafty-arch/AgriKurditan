import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_HEADER, LOCALE_META, isLocale, localePath, type Locale } from "./config";
import { getMessages } from "./messages";

/** The locale of the current request, set by middleware from the /ar or /ckb prefix. */
export const getLocale = cache(async (): Promise<Locale> => {
  const h = await headers();
  const v = h.get(LOCALE_HEADER);
  return isLocale(v) ? v : DEFAULT_LOCALE;
});

export async function getI18n() {
  const locale = await getLocale();
  return {
    locale,
    m: getMessages(locale),
    dir: LOCALE_META[locale].dir,
    href: (path: string) => localePath(path, locale),
  };
}
