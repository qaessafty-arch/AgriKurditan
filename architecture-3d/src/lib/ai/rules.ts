/**
 * Built-in deterministic recommendation engine. No external calls; transparent rules an architect
 * can audit. Used when no AI provider is configured, and as a fallback.
 */
import type { BriefInput, BriefOutput } from "./schema";
import { RULES_TEXT, TYPE_WORD } from "./rules-text";
import { LOCALE_META, fmt, type Locale } from "@/i18n/config";

const round = (n: number) => Math.round(n);

export function rulesBrief(input: BriefInput, photoCount: number, locale: Locale = "en"): BriefOutput {
  const X = RULES_TEXT[locale];
  const n = (v: number) => new Intl.NumberFormat(LOCALE_META[locale].numberLocale, { maximumFractionDigits: 0 }).format(Math.round(v));
  const sp = (k: keyof typeof X.spaces, vars: Record<string, string | number> = {}) => [fmt(X.spaces[k][0], vars), X.spaces[k][1]] as const;
  const { landWidth: W, landDepth: D, buildingType, styles } = input;
  const plot = W * D;
  // Indicative setbacks: 3 m front and rear, 2 m sides (local regulations vary and must be confirmed).
  const bw = Math.max(0, W - 4), bd = Math.max(0, D - 6);
  const buildable = bw * bd;
  const maxFootprint = Math.min(buildable, plot * 0.6);

  const program: BriefOutput["program"] = [];
  let net = 0;
  const add = (space: string, notes: string, area: number) => { program.push({ space, areaM2: round(area), notes }); net += area; };

  if (buildingType === "commercial") {
    add(...sp("lobby"), 40);
    add(...sp("lettable"), Math.max(150, maxFootprint * 0.7));
    add(...sp("meeting"), 50);
    add(...sp("core"), 30);
    add(...sp("services"), 25);
  } else {
    const bedrooms = input.bedrooms ?? 3;
    add(...sp("living"), 32);
    add(...sp("kitchen"), 30);
    add(...sp("entry"), 10);
    if (bedrooms > 0) add(...sp("master"), 26);
    if (bedrooms > 1) add(...sp("bedrooms", { n: n(bedrooms - 1) }), (bedrooms - 1) * 15);
    add(...sp("baths", { n: n(Math.max(1, Math.ceil(bedrooms / 2))) }), Math.max(1, Math.ceil(bedrooms / 2)) * 6);
    add(...sp("guest"), 14);
  }
  const gross = net * 1.15; // walls and circulation
  program.push({ space: X.spaces.circulation[0], areaM2: round(net * 0.15), notes: X.spaces.circulation[1] });

  const minFloors = maxFootprint > 0 ? Math.ceil(gross / maxFootprint) : 1;
  const floors = Math.max(input.floors ?? minFloors, minFloors);
  const footprint = gross / floors;

  const has = (s: string) => styles.includes(s as never);
  const narrow = W < 12;
  let planId: BriefOutput["suggestedPlanId"] = "villa-horizon";
  if (buildingType === "commercial") planId = "office-block";
  else if (has("brutalist")) planId = "brutalist-residence";
  else if (has("classical") || (narrow && floors >= 3)) planId = "townhouse-stone";
  else if (has("minimalist") && floors === 1) planId = "pavilion-minimal";
  else if (floors >= 3) planId = "brutalist-residence";

  const materials: BriefOutput["materials"] = [];
  const cfg: BriefOutput["suggestedConfig"] = {
    wall: "travertine", accent: "concrete", pattern: "fins", windows: "curtain", glass: "bronze", roof: "overhang",
    floor: "oak", furniture: "warm", landscape: "gravel", pool: buildingType === "residential" && plot > 600, garden: true,
  };
  if (has("brutalist")) Object.assign(cfg, { wall: "concrete", accent: "timber", pattern: "louvers", windows: "punched", glass: "grey", floor: "concrete" });
  if (has("classical")) Object.assign(cfg, { wall: "limestone", accent: "same", pattern: "grid", windows: "punched", glass: "clear", roof: "flat", floor: "walnut", furniture: "luxe" });
  if (has("minimalist")) Object.assign(cfg, { wall: "plaster", accent: "same", pattern: "none", glass: "clear", floor: "terrazzo", furniture: "minimal" });
  if (has("luxury")) Object.assign(cfg, { floor: "marble", furniture: "luxe" });
  if (has("regional")) Object.assign(cfg, { wall: "limestone", landscape: "meadow", windows: "punched" });
  if (buildingType === "commercial") Object.assign(cfg, { wall: "concrete", accent: "basalt", windows: "ribbon", glass: "grey", roof: "green", pool: false, furniture: "minimal", floor: "concrete" });

  const wallKey = (["travertine", "limestone", "concrete"] as const).find((k) => k === cfg.wall) ?? "plaster";
  materials.push({ name: X.materials[wallKey][0], reason: X.materials[wallKey][1] });
  materials.push({ name: X.materials[cfg.glass === "clear" ? "lowIron" : "solar"][0], reason: X.glassReason });
  if (cfg.pattern === "fins" || cfg.pattern === "louvers") materials.push({ name: X.materials[cfg.pattern][0], reason: X.materials[cfg.pattern][1] });
  if (cfg.roof === "green") materials.push({ name: X.materials.green[0], reason: X.materials.green[1] });

  const perM2 = input.budget && gross > 0 ? input.budget / gross : null;

  return {
    summary: fmt(X.summary, { floors: n(floors), type: TYPE_WORD[locale][buildingType], gross: n(gross), w: n(W), d: n(D), plot: n(plot), fp: n(footprint) }),
    siteObservations: [
      fmt(X.setbacks, { bw: n(bw), bd: n(bd), ba: n(buildable) }),
      fmt(X.coverage, { max: n(maxFootprint) }),
      photoCount > 1 ? fmt(X.photos, { n: n(photoCount) }) : photoCount === 1 ? X.photosOne : X.noPhotos,
    ],
    program,
    massing: floors === 1 ? X.massingOne : fmt(X.massingMany, { floors: n(floors) }),
    materials,
    considerations: X.considerations,
    budgetNote: perM2 !== null ? fmt(X.budget, { perM2: n(perM2), currency: input.currency }) : X.noBudget,
    nextSteps: X.nextSteps,
    suggestedPlanId: planId,
    suggestedConfig: cfg,
  };
}
