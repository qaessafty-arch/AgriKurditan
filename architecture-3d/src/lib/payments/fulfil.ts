import type { BillingInterval, OfferingKind } from "@prisma/client";

/** End of the access period that a verified payment grants. */
export function periodEnd(start: Date, interval: BillingInterval, kind: OfferingKind): Date | null {
  const d = new Date(start);
  if (interval === "MONTHLY") { d.setMonth(d.getMonth() + 1); return d; }
  if (interval === "YEARLY") { d.setFullYear(d.getFullYear() + 1); return d; }
  if (kind === "FEATURED_PLACEMENT") { d.setDate(d.getDate() + 30); return d; }
  return null;
}

/** Whether paying for this offering should create a subscription/entitlement record. */
export function grantsAccess(interval: BillingInterval, entitlement: string | null): boolean {
  return interval !== "ONE_TIME" || Boolean(entitlement);
}
