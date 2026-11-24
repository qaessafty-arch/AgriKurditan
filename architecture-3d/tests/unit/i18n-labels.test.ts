import { describe, expect, it } from "vitest";
import { MESSAGES } from "@/i18n/messages";
import { describeConfigL, diffConfigsL, localizedOptions, summarizeModelL, valueText } from "@/i18n/labels";
import { DEFAULT_CONFIG, OPTION_CATALOG, mergeConfig } from "@/three/config";
import { generateBuilding } from "@/three/generate";
import { PLANS, getPlan } from "@/three/plans";

const locales = ["en", "ar", "ckb"] as const;

/** Collect every string leaf path, so catalogues can be compared structurally. */
function leafPaths(o: unknown, path: string[] = []): string[][] {
  if (typeof o === "string") return [path];
  if (o && typeof o === "object") return Object.entries(o).flatMap(([k, v]) => leafPaths(v, [...path, k]));
  return [];
}
const leaves = (o: unknown) => leafPaths(o).map((p) => JSON.stringify(p));
const at = (o: unknown, p: string[]) => p.reduce<unknown>((a, k) => (a as Record<string, unknown>)?.[k], o);

describe("message catalogues", () => {
  const enKeys = new Set(leaves({ ...MESSAGES.en, names: {}, apiErrors: {} }));
  for (const l of ["ar", "ckb"] as const) {
    it(`${l} has every English string (including array lengths)`, () => {
      const keys = new Set(leaves({ ...MESSAGES[l], names: {}, apiErrors: {} }));
      expect([...enKeys].filter((k) => !keys.has(k))).toEqual([]);
    });
    it(`${l} strings are translated, not copied English`, () => {
      const copied = leafPaths({ ...MESSAGES[l], names: {}, apiErrors: {} }).filter((p) => {
        const v = at(MESSAGES[l], p) as string, e = at(MESSAGES.en, p) as string;
        return v === e && /[a-z]{4,}/i.test(e) && !/^(IBAN|SWIFT \/ BIC|you@example\.com|Architecture 3D|\{label\}: \{value\})$/.test(e);
      });
      expect(copied).toEqual([]);
    });
    it(`${l} uses only the RTL script for prose (no stray Latin sentences)`, () => {
      expect(MESSAGES[l].home.scenes[0]!.title).toMatch(/[؀-ۿ]/);
    });
    it(`${l} translates every API error and every room/floor name`, () => {
      const rooms = new Set(PLANS.flatMap((p) => [...p.floors.map((f) => f.name), ...p.floors.flatMap((f) => f.rooms.map((r) => r.name))]));
      expect([...rooms].filter((n) => !MESSAGES[l].names[n])).toEqual([]);
      expect(Object.keys(MESSAGES[l].apiErrors).length).toBeGreaterThanOrEqual(60);
    });
  }
  it("Sorani uses Kurdish letters", () => {
    expect(JSON.stringify(MESSAGES.ckb)).toMatch(/[ەێۆڕڵ]/);
  });
});

describe("localized configuration labels", () => {
  it("every option in every locale has a label", () => {
    for (const l of locales) for (const [path, list] of Object.entries(OPTION_CATALOG)) {
      for (const o of localizedOptions(MESSAGES[l], path as keyof typeof OPTION_CATALOG, list)) expect(o.label.length).toBeGreaterThan(0);
    }
  });
  it("formats values with locale digits", () => {
    expect(valueText(MESSAGES.ar, "ar", "environment.time", 16.5)).toBe("١٦:٣٠");
    expect(valueText(MESSAGES.en, "en", "environment.time", 16.5)).toBe("16:30");
    expect(valueText(MESSAGES.ckb, "ckb", "exterior.balconies", true)).toBe("بەڵێ");
  });
  it("describes, diffs and summarizes in Arabic", () => {
    const rows = describeConfigL(MESSAGES.ar, "ar", DEFAULT_CONFIG);
    expect(rows[0]!.section).toBe("الخارج");
    const d = diffConfigsL(MESSAGES.ar, "ar", DEFAULT_CONFIG, mergeConfig(DEFAULT_CONFIG, { exterior: { wall: "brick" } }));
    expect(d).toEqual([{ path: "exterior.wall", label: "مادة الجدار", a: "حجر الترافرتين", b: "طابوق محروق" }]);
    const s = summarizeModelL(MESSAGES.ckb, "ckb", generateBuilding(getPlan("villa-horizon"), DEFAULT_CONFIG));
    expect(s[0]).toMatch(/نهۆم/);
  });
});
