import { describe, expect, it } from "vitest";
import { rulesBrief } from "@/lib/ai/rules";
import { briefInputSchema, briefOutputSchema } from "@/lib/ai/schema";
import { getPlan } from "@/three/plans";
import { mergeConfig } from "@/three/config";

const base = briefInputSchema.parse({ description: "A family home with a garden and space for guests.", buildingType: "residential", landWidth: 25, landDepth: 40, bedrooms: 4, budget: 300000, styles: ["modern"] });

describe("rules engine", () => {
  it("produces output that satisfies the shared schema", () => {
    expect(briefOutputSchema.safeParse(rulesBrief(base, 0)).success).toBe(true);
  });
  it("adds floors when the plot is too small for the program", () => {
    const small = rulesBrief({ ...base, landWidth: 10, landDepth: 16, floors: 1 }, 0);
    expect(small.summary).toMatch(/^A [2-9]-storey/);
  });
  it("maps styles and building type to plans", () => {
    expect(rulesBrief({ ...base, styles: ["brutalist"] }, 0).suggestedPlanId).toBe("brutalist-residence");
    expect(rulesBrief({ ...base, styles: ["classical"] }, 0).suggestedPlanId).toBe("townhouse-stone");
    expect(rulesBrief({ ...base, buildingType: "commercial" }, 0).suggestedPlanId).toBe("office-block");
  });
  it("derives a budget ratio arithmetically, never an invented cost rate", () => {
    const b = rulesBrief(base, 0);
    expect(b.budgetNote).toMatch(/per m² of gross floor area/);
    expect(rulesBrief({ ...base, budget: undefined }, 0).budgetNote).toMatch(/No budget/);
  });
  it("is honest that it does not analyse photos", () => {
    expect(rulesBrief(base, 2).siteObservations.join(" ")).toMatch(/does not analyse images/);
  });
  it("suggested configuration is valid for the 3D engine", () => {
    const b = rulesBrief(base, 0);
    const { wall, accent, pattern, windows, glass, roof, floor, furniture, landscape, pool, garden } = b.suggestedConfig;
    expect(() => mergeConfig(getPlan(b.suggestedPlanId).defaultConfig, {
      exterior: { wall, accent, pattern, windows, glass, roof }, interior: { floor, furniture }, environment: { landscape, pool, garden },
    })).not.toThrow();
  });
});
