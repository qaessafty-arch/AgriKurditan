import { describe, expect, it } from "vitest";
import { evaluate, KEYFRAMES, SCENES } from "@/components/cinematic/timeline";
import { generateBuilding } from "@/three/generate";
import { getPlan } from "@/three/plans";

const model = generateBuilding(getPlan("villa-horizon"), getPlan("villa-horizon").defaultConfig);

describe("cinematic timeline", () => {
  it("has 8 scenes and 9 keyframes", () => {
    expect(SCENES).toHaveLength(8);
    expect(KEYFRAMES).toHaveLength(9);
  });
  it("is continuous across scene boundaries", () => {
    for (let i = 1; i < 8; i++) {
      const before = evaluate(i / 8 - 1e-6, model, 1.6);
      const after = evaluate(i / 8 + 1e-6, model, 1.6);
      for (let k = 0; k < 3; k++) expect(Math.abs(before.position[k]! - after.position[k]!)).toBeLessThan(0.05);
      expect(Math.abs(before.explode - after.explode)).toBeLessThan(0.01);
    }
  });
  it("produces finite values everywhere and clamps out-of-range progress", () => {
    for (let p = -0.1; p <= 1.1; p += 0.01) {
      const s = evaluate(p, model, 0.5);
      for (const v of [...s.position, ...s.target, s.explode, s.cutaway, s.time]) expect(Number.isFinite(v)).toBe(true);
      expect(s.scene).toBeGreaterThanOrEqual(0);
      expect(s.scene).toBeLessThan(8);
    }
  });
  it("reduced motion snaps to each scene's final keyframe", () => {
    const a = evaluate(3 / 8 + 0.01, model, 1.6, true);
    const b = evaluate(3 / 8 + 0.1, model, 1.6, true);
    expect(a.position).toEqual(b.position);
    expect(a.explode).toBe(1);
  });
  it("cycles three material variants during the materials scene and sweeps a full day in the environment scene", () => {
    const variants = new Set([0.05, 0.4, 0.8].map((l) => evaluate((5 + l) / 8, model, 1.6).materialVariant));
    expect(variants.size).toBe(3);
    expect(evaluate(6.02 / 8, model, 1.6).time).toBeLessThan(8);
    expect(evaluate(6.98 / 8, model, 1.6).time).toBeGreaterThan(20);
  });
  it("pushes the camera back on portrait screens", () => {
    const wide = evaluate(0.5 / 8, model, 1.8);
    const tall = evaluate(0.5 / 8, model, 0.5);
    expect(Math.hypot(...tall.position)).toBeGreaterThan(Math.hypot(...wide.position));
  });
});
