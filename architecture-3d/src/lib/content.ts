import type { Locale } from "@/i18n/config";

/** Read a translated field from a row's `translations` JSON, falling back to the stored (English) value. */
export function tr<T extends Record<string, unknown>, K extends keyof T & string>(row: T & { translations?: unknown }, field: K, locale: Locale): T[K] {
  if (locale === "en") return row[field];
  const t = (row.translations as Record<string, Record<string, unknown>> | null | undefined)?.[locale]?.[field];
  if (t === undefined || t === null || t === "" || (Array.isArray(t) && t.length === 0)) return row[field];
  return t as T[K];
}

/** Return a copy of the row with the listed fields localized. */
export function localize<T extends Record<string, unknown>>(row: T & { translations?: unknown }, fields: (keyof T & string)[], locale: Locale): T {
  if (locale === "en") return row;
  const out = { ...row };
  for (const f of fields) out[f] = tr(row, f, locale);
  return out;
}
