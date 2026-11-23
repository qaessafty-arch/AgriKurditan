import { z } from "zod";
import {
  ACCENT_MATERIALS, FACADE_PATTERNS, FLOOR_MATERIALS, FURNITURE_STYLES, GLASS_TINTS, LANDSCAPES, ROOF_STYLES, WALL_MATERIALS, WINDOW_STYLES,
  type Option,
} from "@/three/config";
import { PLAN_IDS } from "@/three/plans";

const ids = <T extends readonly Option[]>(o: T) => o.map((x) => x.id) as unknown as [T[number]["id"], ...T[number]["id"][]];

export const STYLE_PREFERENCES = ["modern", "minimalist", "brutalist", "classical", "luxury", "regional"] as const;

export const briefInputSchema = z.object({
  description: z.string().trim().min(20, "Describe your project in at least a sentence or two").max(3000),
  buildingType: z.enum(["residential", "commercial"]),
  location: z.string().trim().max(120).optional(),
  landWidth: z.coerce.number().min(5, "At least 5 m").max(1000),
  landDepth: z.coerce.number().min(5, "At least 5 m").max(1000),
  floors: z.coerce.number().int().min(1).max(6).optional(),
  bedrooms: z.coerce.number().int().min(0).max(12).optional(),
  budget: z.coerce.number().min(0).max(1e10).optional(),
  currency: z.enum(["USD", "IQD", "EUR"]).default("USD"),
  styles: z.array(z.enum(STYLE_PREFERENCES)).max(4).default([]),
});
export type BriefInput = z.infer<typeof briefInputSchema>;

/** The structured brief both providers must return. Validated again server-side. */
export const briefOutputSchema = z.object({
  summary: z.string(),
  siteObservations: z.array(z.string()),
  program: z.array(z.object({ space: z.string(), areaM2: z.number(), notes: z.string() })),
  massing: z.string(),
  materials: z.array(z.object({ name: z.string(), reason: z.string() })),
  considerations: z.array(z.string()),
  budgetNote: z.string(),
  nextSteps: z.array(z.string()),
  suggestedPlanId: z.enum(PLAN_IDS),
  suggestedConfig: z.object({
    wall: z.enum(ids(WALL_MATERIALS)),
    accent: z.enum(ids(ACCENT_MATERIALS)),
    pattern: z.enum(ids(FACADE_PATTERNS)),
    windows: z.enum(ids(WINDOW_STYLES)),
    glass: z.enum(ids(GLASS_TINTS)),
    roof: z.enum(ids(ROOF_STYLES)),
    floor: z.enum(ids(FLOOR_MATERIALS)),
    furniture: z.enum(ids(FURNITURE_STYLES)),
    landscape: z.enum(ids(LANDSCAPES)),
    pool: z.boolean(),
    garden: z.boolean(),
  }),
});
export type BriefOutput = z.infer<typeof briefOutputSchema>;

export const DISCLAIMER =
  "This is a preliminary, AI-assisted design suggestion for discussion only. It is not a certified engineering drawing or a construction-ready plan, and it makes no claim about structural safety, building-code or permit compliance. A qualified, licensed architect and engineer must review and develop any design before it is built.";
