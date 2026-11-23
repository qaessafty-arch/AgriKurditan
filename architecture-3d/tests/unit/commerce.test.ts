import { describe, expect, it } from "vitest";
import { grantsAccess, periodEnd } from "@/lib/payments/fulfil";
import { PAYMENT_METHODS, availableMethods } from "@/lib/payments/methods";
import { can } from "@/lib/auth/permissions";
import { checkRate } from "@/lib/security/rate-limit";

const base = { currency: "USD", bankTransferEnabled: false, bankName: "", accountName: "", accountNumber: "", iban: "", swift: "", instructions: "", cashEnabled: false, cashInstructions: "" };

describe("payment methods", () => {
  it("offers nothing until an administrator configures it", () => {
    expect(availableMethods(base)).toHaveLength(0);
    expect(availableMethods({ ...base, bankTransferEnabled: true })).toHaveLength(0); // enabled but no account details
  });
  it("offers bank transfer only with real account details", () => {
    const s = { ...base, bankTransferEnabled: true, accountName: "Studio LLC", iban: "IQ00TEST" };
    expect(availableMethods(s).map((m) => m.id)).toEqual(["bank_transfer"]);
    expect(PAYMENT_METHODS[0]!.instructions(s).map((i) => i.label)).toEqual(["Account name", "IBAN"]);
  });
});

describe("fulfilment periods", () => {
  const start = new Date("2026-01-31T10:00:00Z");
  it("monthly, yearly and featured placements end correctly; one-time services do not expire", () => {
    expect(periodEnd(start, "YEARLY", "ARCHITECT_SUBSCRIPTION")?.getUTCFullYear()).toBe(2027);
    expect(periodEnd(start, "MONTHLY", "PREMIUM_FEATURE")!.getTime()).toBeGreaterThan(start.getTime());
    expect(periodEnd(start, "ONE_TIME", "FEATURED_PLACEMENT")!.getTime() - start.getTime()).toBe(30 * 86400_000);
    expect(periodEnd(start, "ONE_TIME", "SERVICE_PACKAGE")).toBeNull();
  });
  it("only subscriptions and entitlement products create access records", () => {
    expect(grantsAccess("ONE_TIME", null)).toBe(false);
    expect(grantsAccess("ONE_TIME", "featured_placement")).toBe(true);
    expect(grantsAccess("MONTHLY", null)).toBe(true);
  });
});

describe("permissions", () => {
  it("restricts admin capabilities to administrators", () => {
    expect(can("ADMIN", "admin:commerce")).toBe(true);
    expect(can("CUSTOMER", "admin:commerce")).toBe(false);
    expect(can("ARCHITECT", "admin:leads")).toBe(true);
    expect(can("ARCHITECT", "admin:settings")).toBe(false);
    expect(can(null, "designs:own")).toBe(false);
  });
});

describe("rate limiter", () => {
  it("blocks after the limit within the window and recovers after it", () => {
    const L = { limit: 3, windowMs: 1000 };
    const t = 1_000_000;
    expect([0, 1, 2].map((i) => checkRate("test-key", L, t + i).ok)).toEqual([true, true, true]);
    expect(checkRate("test-key", L, t + 3).ok).toBe(false);
    expect(checkRate("test-key", L, t + 1500).ok).toBe(true);
  });
});
