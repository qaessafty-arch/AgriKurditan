import type { BillingInterval, Prisma } from "@prisma/client";

export function money(amount: Prisma.Decimal | number | string | null | undefined, currency = "USD"): string {
  if (amount === null || amount === undefined) return "Quote on request";
  const n = typeof amount === "object" ? Number(amount.toString()) : Number(amount);
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

export function intervalLabel(i: BillingInterval): string {
  return i === "MONTHLY" ? "per month" : i === "YEARLY" ? "per year" : "one-time";
}

export function dateLabel(d: Date | string | null | undefined, withTime = false): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", ...(withTime ? { timeStyle: "short" } : {}) }).format(date);
}

export function titleCase(s: string): string {
  return s.replace(/_/g, " ").toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}
