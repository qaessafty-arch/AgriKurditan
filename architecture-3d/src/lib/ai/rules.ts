/**
 * Built-in deterministic recommendation engine. No external calls; transparent rules an architect
 * can audit. Used when no AI provider is configured, and as a fallback.
 */
import type { BriefInput, BriefOutput } from "./schema";

const round = (n: number) => Math.round(n);

export function rulesBrief(input: BriefInput, photoCount: number): BriefOutput {
  const { landWidth: W, landDepth: D, buildingType, styles } = input;
  const plot = W * D;
  // Indicative setbacks: 3 m front and rear, 2 m sides (local regulations vary and must be confirmed).
  const bw = Math.max(0, W - 4), bd = Math.max(0, D - 6);
  const buildable = bw * bd;
  const maxFootprint = Math.min(buildable, plot * 0.6);

  const program: BriefOutput["program"] = [];
  let net = 0;
  const add = (space: string, area: number, notes: string) => { program.push({ space, areaM2: round(area), notes }); net += area; };

  if (buildingType === "commercial") {
    add("Entrance lobby", 40, "Double-height if budget allows; visible from the street.");
    add("Lettable workspace", Math.max(150, maxFootprint * 0.7), "Open floor plates around a single core for flexible leasing.");
    add("Meeting and amenity rooms", 50, "Shared between tenants.");
    add("Stair and lift core", 30, "Positioned to keep floor plates column-free.");
    add("Services and storage", 25, "Plant, refuse and storage at ground level.");
  } else {
    const bedrooms = input.bedrooms ?? 3;
    add("Living room", 32, "Oriented to the garden, shaded from western sun.");
    add("Kitchen and dining", 30, "Connected to the terrace for outdoor dining.");
    add("Entrance hall", 10, "Guest WC and storage off the entrance.");
    if (bedrooms > 0) add("Master suite", 26, "Bedroom with en-suite and dressing area.");
    if (bedrooms > 1) add(`Bedrooms (${bedrooms - 1})`, (bedrooms - 1) * 15, "Each with built-in storage.");
    add(`Bathrooms (${Math.max(1, Math.ceil(bedrooms / 2))})`, Math.max(1, Math.ceil(bedrooms / 2)) * 6, "Including one accessible bathroom on the ground floor.");
    add("Guest room or study", 14, "Flexible room for guests, work or elderly relatives.");
  }
  const gross = net * 1.15; // walls and circulation
  program.push({ space: "Walls and circulation (≈15%)", areaM2: round(net * 0.15), notes: "Corridors, stairs and wall thickness." });

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

  const wallReason: Record<string, string> = {
    travertine: "Thermal mass moderates hot summer days; durable and repairable.",
    limestone: "Regionally sourced stone with good thermal mass and a long service life.",
    concrete: "Robust and fire-resistant; exposed finishes reduce maintenance and cladding cost.",
    plaster: "Economical, breathable render; easy to repair and repaint.",
  };
  materials.push({ name: cfg.wall === "travertine" ? "Travertine cladding" : cfg.wall === "limestone" ? "Limestone" : cfg.wall === "concrete" ? "Board-formed concrete" : "Mineral plaster", reason: wallReason[cfg.wall] ?? "" });
  materials.push({ name: cfg.glass === "clear" ? "Low-iron double glazing" : "Solar-control double glazing", reason: "Reduces solar heat gain on south and west facades." });
  if (cfg.pattern === "fins" || cfg.pattern === "louvers") materials.push({ name: cfg.pattern === "fins" ? "Vertical shading fins" : "Horizontal louvres", reason: cfg.pattern === "fins" ? "Blocks low-angle east and west sun." : "Shades high summer sun on south facades." });
  if (cfg.roof === "green") materials.push({ name: "Extensive green roof", reason: "Insulates the top floor and retains stormwater." });

  const perM2 = input.budget && gross > 0 ? input.budget / gross : null;

  return {
    summary: `A ${floors}-storey ${buildingType} building of about ${round(gross)} m² gross on a ${round(W)} × ${round(D)} m plot (${round(plot)} m²), with a footprint of roughly ${round(footprint)} m².`,
    siteObservations: [
      `Indicative buildable zone after typical setbacks: ${round(bw)} × ${round(bd)} m (${round(buildable)} m²). Confirm setbacks with the local municipality.`,
      `Assumed maximum plot coverage of 60% gives up to ${round(maxFootprint)} m² of footprint.`,
      photoCount > 0
        ? `${photoCount} site photo${photoCount > 1 ? "s were" : " was"} attached for the architect. The built-in engine does not analyse images.`
        : "No site photos attached; photos help the architect assess slope, access, neighbours and views.",
    ],
    program,
    massing: floors === 1
      ? "Single-storey building set back from the street, opening to a garden on the private side."
      : `Compact ${floors}-storey volume, with upper floors shading the ground-floor glazing and terraces facing the garden.`,
    materials,
    considerations: [
      "Orient main living spaces away from direct western sun; shade glazing on south and west facades.",
      "Plan for cross-ventilation and ceiling fans to reduce cooling loads in summer.",
      "Seismic design and foundations must be designed by a structural engineer after a soil investigation.",
      "Confirm zoning, height limits, setbacks and parking requirements with the municipality before design development.",
    ],
    budgetNote: perM2 !== null
      ? `Your budget corresponds to about ${Math.round(perM2).toLocaleString("en-US")} ${input.currency} per m² of gross floor area. Ask the architect whether this suits the intended specification level in your area.`
      : "No budget was given. A budget range helps the architect set the right specification level.",
    nextSteps: [
      "Book a consultation to review the brief, site and budget with an architect.",
      "Commission a topographic survey and soil investigation.",
      "Open the suggested design in the studio and adjust materials and layout preferences.",
    ],
    suggestedPlanId: planId,
    suggestedConfig: cfg,
  };
}
