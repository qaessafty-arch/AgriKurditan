import type { BillingInterval, Prisma } from "@prisma/client";
import { LOCALE_META, type Locale } from "@/i18n/config";
import en from "@/i18n/messages/en";

// numberLocale, not intl: browsers lack ckb data, so ckb formats through ar-IQ for server/client parity.
const intl = (locale: Locale = "en") => LOCALE_META[locale]?.numberLocale ?? "en-GB";

/** Sorani (Gregorian) month names, as used in the Kurdistan Region. Built by hand because browsers have no ckb date data. */
const CKB_MONTHS = ["کانوونی دووەم", "شوبات", "ئازار", "نیسان", "ئایار", "حوزەیران", "تەممووز", "ئاب", "ئەیلوول", "تشرینی یەکەم", "تشرینی دووەم", "کانوونی یەکەم"];

export function money(amount: Prisma.Decimal | number | string | null | undefined, currency = "USD", locale: Locale = "en", onRequest = en.pricing.onRequest): string {
  if (amount === null || amount === undefined) return onRequest;
  const n = typeof amount === "object" ? Number(amount.toString()) : Number(amount);
  try {
    const f = new Intl.NumberFormat(locale === "en" ? "en-US" : intl(locale), { style: "currency", currency, maximumFractionDigits: n % 1 === 0 ? 0 : 2 });
    if (LOCALE_META[locale]?.dir !== "rtl") return f.format(n);
    // RTL: a Latin symbol such as "US$" is reordered to "$US" by the bidi algorithm. Swap it for the
    // narrow symbol ("$"), which has no letters; Arabic-script symbols such as "د.ع." are kept.
    const narrow = new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol" }).formatToParts(0).find((p) => p.type === "currency")?.value;
    return f.formatToParts(n).map((p) => (p.type === "currency" && /[A-Za-z]/.test(p.value) && narrow ? narrow : p.value)).join("");
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

export function number(n: number, locale: Locale = "en", digits = 0): string {
  return new Intl.NumberFormat(intl(locale), { maximumFractionDigits: digits }).format(n);
}

export function intervalLabel(i: BillingInterval, labels: Record<BillingInterval, string> = en.pricing.interval): string {
  return labels[i];
}

export function dateLabel(d: Date | string | null | undefined, withTime = false, locale: Locale = "en"): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (locale === "ckb") {
    const n = new Intl.NumberFormat(intl(locale), { useGrouping: false });
    const two = new Intl.NumberFormat(intl(locale), { minimumIntegerDigits: 2, useGrouping: false });
    const day = `${n.format(date.getDate())}ی ${CKB_MONTHS[date.getMonth()]} ${n.format(date.getFullYear())}`;
    return withTime ? `${day}، ${two.format(date.getHours())}:${two.format(date.getMinutes())}` : day;
  }
  return new Intl.DateTimeFormat(intl(locale), { dateStyle: "medium", ...(withTime ? { timeStyle: "short" } : {}) }).format(date);
}

export function titleCase(s: string): string {
  return s.replace(/_/g, " ").toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}
