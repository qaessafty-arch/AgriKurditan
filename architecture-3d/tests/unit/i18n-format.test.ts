import { describe, expect, it } from "vitest";
import { dateLabel, money, number } from "@/lib/format";
import { LOCALE_META } from "@/i18n/config";

describe("locale formatting", () => {
  it("formats Sorani numbers through a locale browsers ship, so server and client output match", () => {
    // Chromium has no ckb data and would silently fall back to English digits.
    expect(LOCALE_META.ckb.numberLocale).toBe("ar-IQ");
    expect(number(1234, "ckb")).toBe("١٬٢٣٤");
    expect(money(250000, "IQD", "ckb")).toContain("٢٥٠٬٠٠٠");
    // No Latin letters next to the symbol, which the bidi algorithm would reorder to "$US".
    expect(money(1200, "USD", "ar")).not.toMatch(/[A-Z]/);
    expect(money(1200, "USD", "ckb")).toContain("$");
  });

  it("builds Sorani dates from Kurdish month names", () => {
    const d = new Date(2026, 0, 5, 9, 7);
    expect(dateLabel(d, false, "ckb")).toBe("٥ی کانوونی دووەم ٢٠٢٦");
    expect(dateLabel(d, true, "ckb")).toBe("٥ی کانوونی دووەم ٢٠٢٦، ٠٩:٠٧");
    expect(dateLabel(new Date(2026, 11, 31), false, "ckb")).toContain("کانوونی یەکەم");
  });

  it("keeps English and Arabic on the platform formatter", () => {
    expect(number(1234, "en")).toBe("1,234");
    expect(number(1234, "ar")).toBe("١٬٢٣٤");
  });
});
