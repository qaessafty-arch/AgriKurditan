import { describe, expect, it } from "vitest";
import { PLANS, getPlan } from "@/three/plans";
import { generateBuilding, subtractRect } from "@/three/generate";
import { DEFAULT_CONFIG, mergeConfig } from "@/three/config";

describe("plans", () => {
  for (const plan of PLANS) {
    it(`${plan.id}: rooms tile each floor exactly without overlap`, () => {
      for (const floor of plan.floors) {
        const area = floor.rooms.reduce((s, r) => s + r.w * r.d, 0);
        expect(area).toBeCloseTo(floor.rect.w * floor.rect.d, 5);
        for (const r of floor.rooms) {
          expect(r.x).toBeGreaterThanOrEqual(floor.rect.x - 1e-9);
          expect(r.z).toBeGreaterThanOrEqual(floor.rect.z - 1e-9);
          expect(r.x + r.w).toBeLessThanOrEqual(floor.rect.x + floor.rect.w + 1e-9);
          expect(r.z + r.d).toBeLessThanOrEqual(floor.rect.z + floor.rect.d + 1e-9);
        }
        for (let i = 0; i < floor.rooms.length; i++) {
          for (let j = i + 1; j < floor.rooms.length; j++) {
            const a = floor.rooms[i]!, b = floor.rooms[j]!;
            const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
            const oz = Math.min(a.z + a.d, b.z + b.d) - Math.max(a.z, b.z);
            expect(ox > 1e-6 && oz > 1e-6, `${a.id} overlaps ${b.id}`).toBe(false);
          }
        }
      }
    });

    it(`${plan.id}: every stair has a matching room on the floor above`, () => {
      plan.floors.forEach((floor, i) => {
        const above = plan.floors[i + 1];
        for (const s of floor.rooms.filter((r) => r.type === "stair")) {
          if (!above) continue;
          const match = above.rooms.find((r) => r.x === s.x && r.z === s.z && r.w === s.w && r.d === s.d);
          expect(match, `${s.id} has no landing above`).toBeDefined();
        }
      });
    });

    it(`${plan.id}: generates valid finite geometry`, () => {
      const m = generateBuilding(plan, plan.defaultConfig);
      expect(m.parts.length).toBeGreaterThan(100);
      for (const p of m.parts) {
        for (const v of [...p.p, ...p.s]) expect(Number.isFinite(v)).toBe(true);
        for (const v of p.s) expect(v).toBeGreaterThan(0);
      }
      expect(m.stats.grossFloorArea).toBeGreaterThan(0);
      expect(m.stats.glazingRatio).toBeGreaterThan(0);
      expect(m.stats.glazingRatio).toBeLessThan(1);
    });
  }

  it("unknown plan ids fall back to the first plan", () => {
    expect(getPlan("nope").id).toBe(PLANS[0]!.id);
  });
});

describe("configuration changes the geometry", () => {
  const plan = getPlan("villa-horizon");
  it("curtain glazing has more glass than punched windows", () => {
    const curtain = generateBuilding(plan, mergeConfig(DEFAULT_CONFIG, { exterior: { windows: "curtain" } }));
    const punched = generateBuilding(plan, mergeConfig(DEFAULT_CONFIG, { exterior: { windows: "punched" } }));
    expect(curtain.stats.glazingArea).toBeGreaterThan(punched.stats.glazingArea);
  });
  it("disabling the pool removes water", () => {
    const m = generateBuilding(plan, mergeConfig(DEFAULT_CONFIG, { environment: { pool: false } }));
    expect(m.parts.some((p) => p.slot === "water")).toBe(false);
  });
  it("unfurnished removes furniture", () => {
    const m = generateBuilding(plan, mergeConfig(DEFAULT_CONFIG, { interior: { furniture: "none" } }));
    expect(m.parts.some((p) => p.slot === "fabric")).toBe(false);
  });
  it("green roof adds planting, balconies toggle", () => {
    const m = generateBuilding(plan, mergeConfig(DEFAULT_CONFIG, { exterior: { roof: "green", balconies: false } }));
    expect(m.parts.some((p) => p.slot === "roofGreen")).toBe(true);
    expect(m.parts.some((p) => p.slot === "balcony")).toBe(false);
  });
  it("landscape is deterministic", () => {
    const a = generateBuilding(plan, DEFAULT_CONFIG).trees;
    const b = generateBuilding(plan, DEFAULT_CONFIG).trees;
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(10);
  });
  it("slab above a stair has a void", () => {
    const m = generateBuilding(plan, DEFAULT_CONFIG);
    const stair = plan.floors[0]!.rooms.find((r) => r.type === "stair")!;
    const cx = stair.x + stair.w / 2, cz = stair.z + stair.d / 2;
    const covering = m.parts.filter((p) => p.floor === 1 && p.slot === "slab" &&
      Math.abs(p.p[0] - cx) < p.s[0] / 2 && Math.abs(p.p[2] - cz) < p.s[2] / 2);
    expect(covering).toHaveLength(0);
  });
});

describe("subtractRect", () => {
  it("returns the original when disjoint", () => {
    expect(subtractRect({ x: 0, z: 0, w: 2, d: 2 }, { x: 5, z: 5, w: 1, d: 1 })).toEqual([{ x: 0, z: 0, w: 2, d: 2 }]);
  });
  it("preserves area", () => {
    const pieces = subtractRect({ x: 0, z: 0, w: 10, d: 8 }, { x: 3, z: 2, w: 2, d: 3 });
    expect(pieces.reduce((s, r) => s + r.w * r.d, 0)).toBeCloseTo(80 - 6);
  });
});

import { encodeConfig, decodeConfig } from "@/three/share";
import { diffConfigs } from "@/three/config";
describe("config sharing and diff", () => {
  it("round-trips through the URL encoding", () => {
    const c = mergeConfig(DEFAULT_CONFIG, { exterior: { wall: "brick" }, environment: { time: 9.25 } });
    expect(decodeConfig(encodeConfig(c))).toEqual(c);
  });
  it("rejects tampered or invalid input", () => {
    expect(decodeConfig("not-base64!!")).toBeNull();
    expect(decodeConfig(btoa(JSON.stringify({ exterior: { wall: "<script>" } })))).toBeNull();
  });
  it("lists human-readable differences", () => {
    const b = mergeConfig(DEFAULT_CONFIG, { exterior: { wall: "brick" }, environment: { pool: false } });
    const d = diffConfigs(DEFAULT_CONFIG, b);
    expect(d.map((x) => x.label)).toEqual(["Wall material", "Swimming pool"]);
    expect(d[0]).toMatchObject({ a: "Travertine stone", b: "Fired brick" });
  });
});
