/**
 * Building configuration: the single description of a design that the 3D scene, the customization
 * studio, saved designs, AI suggestions and quote requests all share. Validated with zod on the
 * server so stored configurations are always renderable.
 */
import { z } from "zod";

export interface Option<T extends string = string> {
  id: T;
  label: string;
  note?: string;
}

const opts = <const T extends readonly Option[]>(o: T) => o;

export const WALL_MATERIALS = opts([
  { id: "plaster", label: "Mineral plaster", note: "Breathable lime render; repaintable; low cost." },
  { id: "travertine", label: "Travertine stone", note: "Warm sedimentary stone; excellent thermal mass; premium." },
  { id: "limestone", label: "Limestone blocks", note: "Cut ashlar blocks; durable; regional supply common in Kurdistan." },
  { id: "concrete", label: "Board-formed concrete", note: "Exposed in-situ concrete with timber formwork texture." },
  { id: "brick", label: "Fired brick", note: "Modular clay brick; long service life; good for hot climates." },
  { id: "timber", label: "Timber cladding", note: "Vertical thermally-modified boards; needs periodic oiling." },
] as const);

export const ACCENT_MATERIALS = opts([
  { id: "same", label: "Match main wall" },
  { id: "travertine", label: "Travertine stone" },
  { id: "concrete", label: "Board-formed concrete" },
  { id: "timber", label: "Timber cladding" },
  { id: "basalt", label: "Dark basalt" },
] as const);

export const FACADE_PATTERNS = opts([
  { id: "none", label: "Clean facade" },
  { id: "fins", label: "Vertical fins", note: "Shading fins reduce low-angle east/west sun." },
  { id: "louvers", label: "Horizontal louvres", note: "Overhead shading for high summer sun." },
  { id: "grid", label: "Expressed frame", note: "Structural grid expressed on the facade." },
] as const);

export const WINDOW_STYLES = opts([
  { id: "ribbon", label: "Ribbon windows" },
  { id: "punched", label: "Punched openings" },
  { id: "curtain", label: "Floor-to-ceiling glazing" },
] as const);

export const GLASS_TINTS = opts([
  { id: "clear", label: "Clear low-iron" },
  { id: "bronze", label: "Bronze solar-control" },
  { id: "grey", label: "Grey solar-control" },
  { id: "green", label: "Green tint" },
] as const);

export const FRAME_FINISHES = opts([
  { id: "black", label: "Black anodised aluminium" },
  { id: "bronze", label: "Bronze anodised aluminium" },
  { id: "white", label: "White powder coat" },
  { id: "timber", label: "Oak timber" },
] as const);

export const DOOR_STYLES = opts([
  { id: "pivot", label: "Timber pivot door" },
  { id: "glass", label: "Frameless glass door" },
  { id: "steel", label: "Blackened steel door" },
] as const);

export const ROOF_STYLES = opts([
  { id: "flat", label: "Flat roof with parapet" },
  { id: "overhang", label: "Cantilevered canopy roof", note: "Deep overhang shades the top floor." },
  { id: "green", label: "Green roof", note: "Planted roof improves insulation and stormwater retention." },
] as const);

export const FLOOR_MATERIALS = opts([
  { id: "oak", label: "Oak planks" },
  { id: "walnut", label: "Walnut planks" },
  { id: "marble", label: "Polished marble" },
  { id: "terrazzo", label: "Terrazzo" },
  { id: "concrete", label: "Polished concrete" },
  { id: "tile", label: "Large-format porcelain" },
] as const);

export const INTERIOR_WALL_FINISHES = opts([
  { id: "paint", label: "Matte paint" },
  { id: "plaster", label: "Polished lime plaster" },
  { id: "timber", label: "Timber panelling" },
  { id: "stone", label: "Stone feature wall" },
] as const);

export const CEILING_MATERIALS = opts([
  { id: "white", label: "White plaster" },
  { id: "timber", label: "Timber slats" },
  { id: "concrete", label: "Exposed concrete" },
] as const);

export const FURNITURE_STYLES = opts([
  { id: "none", label: "Unfurnished" },
  { id: "minimal", label: "Minimal contemporary" },
  { id: "warm", label: "Warm natural" },
  { id: "luxe", label: "Luxury dark" },
] as const);

export const LIGHTING_MOODS = opts([
  { id: "warm", label: "Warm white 2700K" },
  { id: "neutral", label: "Neutral 3500K" },
  { id: "cool", label: "Cool 4000K" },
] as const);

export const SKY_CONDITIONS = opts([
  { id: "clear", label: "Clear" },
  { id: "hazy", label: "Hazy / dusty" },
  { id: "overcast", label: "Overcast" },
] as const);

export const LANDSCAPES = opts([
  { id: "lawn", label: "Irrigated lawn" },
  { id: "gravel", label: "Gravel and stone (low water)" },
  { id: "meadow", label: "Native dry meadow" },
] as const);

type Ids<T extends readonly Option[]> = T[number]["id"];
const enumOf = <T extends readonly Option[]>(o: T) =>
  z.enum(o.map((x) => x.id) as unknown as [Ids<T>, ...Ids<T>[]]);

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a #RRGGBB colour");

export const buildingConfigSchema = z.object({
  exterior: z.object({
    wall: enumOf(WALL_MATERIALS),
    accent: enumOf(ACCENT_MATERIALS),
    paint: hex,
    pattern: enumOf(FACADE_PATTERNS),
    windows: enumOf(WINDOW_STYLES),
    glass: enumOf(GLASS_TINTS),
    frames: enumOf(FRAME_FINISHES),
    door: enumOf(DOOR_STYLES),
    roof: enumOf(ROOF_STYLES),
    balconies: z.boolean(),
  }),
  interior: z.object({
    floor: enumOf(FLOOR_MATERIALS),
    walls: enumOf(INTERIOR_WALL_FINISHES),
    wallColor: hex,
    ceiling: enumOf(CEILING_MATERIALS),
    furniture: enumOf(FURNITURE_STYLES),
    lighting: enumOf(LIGHTING_MOODS),
    lightsOn: z.boolean(),
  }),
  environment: z.object({
    time: z.number().min(0).max(24),
    sun: z.number().min(0).max(2),
    sky: enumOf(SKY_CONDITIONS),
    landscape: enumOf(LANDSCAPES),
    garden: z.boolean(),
    pool: z.boolean(),
    outdoorLights: z.boolean(),
  }),
});

export type BuildingConfig = z.infer<typeof buildingConfigSchema>;
export type WallMaterial = BuildingConfig["exterior"]["wall"];
export type FloorMaterial = BuildingConfig["interior"]["floor"];

export const DEFAULT_CONFIG: BuildingConfig = {
  exterior: {
    wall: "travertine",
    accent: "concrete",
    paint: "#E8E2D6",
    pattern: "fins",
    windows: "curtain",
    glass: "bronze",
    frames: "black",
    door: "pivot",
    roof: "overhang",
    balconies: true,
  },
  interior: {
    floor: "oak",
    walls: "plaster",
    wallColor: "#EEE9E1",
    ceiling: "white",
    furniture: "warm",
    lighting: "warm",
    lightsOn: true,
  },
  environment: {
    time: 16.5,
    sun: 1,
    sky: "clear",
    landscape: "gravel",
    garden: true,
    pool: true,
    outdoorLights: true,
  },
};

/** Labels for every option, keyed by section.field, used by summaries and the studio UI. */
export const OPTION_CATALOG = {
  "exterior.wall": WALL_MATERIALS,
  "exterior.accent": ACCENT_MATERIALS,
  "exterior.pattern": FACADE_PATTERNS,
  "exterior.windows": WINDOW_STYLES,
  "exterior.glass": GLASS_TINTS,
  "exterior.frames": FRAME_FINISHES,
  "exterior.door": DOOR_STYLES,
  "exterior.roof": ROOF_STYLES,
  "interior.floor": FLOOR_MATERIALS,
  "interior.walls": INTERIOR_WALL_FINISHES,
  "interior.ceiling": CEILING_MATERIALS,
  "interior.furniture": FURNITURE_STYLES,
  "interior.lighting": LIGHTING_MOODS,
  "environment.sky": SKY_CONDITIONS,
  "environment.landscape": LANDSCAPES,
} as const;

export function optionLabel(path: keyof typeof OPTION_CATALOG, id: string): string {
  const found = (OPTION_CATALOG[path] as readonly Option[]).find((o) => o.id === id);
  return found?.label ?? id;
}

/** Deep-merge a partial configuration onto a base, then validate. Throws on invalid input. */
export function mergeConfig(base: BuildingConfig, patch: unknown): BuildingConfig {
  const p = (patch ?? {}) as Partial<Record<keyof BuildingConfig, object>>;
  return buildingConfigSchema.parse({
    exterior: { ...base.exterior, ...(p.exterior ?? {}) },
    interior: { ...base.interior, ...(p.interior ?? {}) },
    environment: { ...base.environment, ...(p.environment ?? {}) },
  });
}

/** Parse untrusted stored/submitted configuration, falling back to defaults field by field. */
export function coerceConfig(value: unknown): BuildingConfig {
  const parsed = buildingConfigSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  try {
    return mergeConfig(DEFAULT_CONFIG, value);
  } catch {
    return structuredClone(DEFAULT_CONFIG);
  }
}

export interface ConfigDifference {
  path: string;
  label: string;
  a: string;
  b: string;
}

const FIELD_LABELS: Record<string, string> = {
  "exterior.wall": "Wall material",
  "exterior.accent": "Accent material",
  "exterior.paint": "Render colour",
  "exterior.pattern": "Facade pattern",
  "exterior.windows": "Window style",
  "exterior.glass": "Glass",
  "exterior.frames": "Window frames",
  "exterior.door": "Entrance door",
  "exterior.roof": "Roof",
  "exterior.balconies": "Balconies",
  "interior.floor": "Flooring",
  "interior.walls": "Wall finish",
  "interior.wallColor": "Wall colour",
  "interior.ceiling": "Ceiling",
  "interior.furniture": "Furniture",
  "interior.lighting": "Lighting",
  "interior.lightsOn": "Interior lights",
  "environment.time": "Time of day",
  "environment.sun": "Sun intensity",
  "environment.sky": "Sky",
  "environment.landscape": "Landscape",
  "environment.garden": "Garden planting",
  "environment.pool": "Swimming pool",
  "environment.outdoorLights": "Outdoor lighting",
};

export function fieldLabel(path: string): string {
  return FIELD_LABELS[path] ?? path;
}

export function formatValue(path: string, value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (path === "environment.time" && typeof value === "number") {
    const h = Math.floor(value);
    const m = Math.round((value - h) * 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  if (path === "environment.sun" && typeof value === "number") return `${Math.round(value * 100)}%`;
  if (path in OPTION_CATALOG && typeof value === "string") {
    return optionLabel(path as keyof typeof OPTION_CATALOG, value);
  }
  return String(value);
}

export function diffConfigs(a: BuildingConfig, b: BuildingConfig): ConfigDifference[] {
  const out: ConfigDifference[] = [];
  for (const section of ["exterior", "interior", "environment"] as const) {
    const sa = a[section] as Record<string, unknown>;
    const sb = b[section] as Record<string, unknown>;
    for (const key of Object.keys(sa)) {
      if (sa[key] !== sb[key]) {
        const path = `${section}.${key}`;
        out.push({ path, label: fieldLabel(path), a: formatValue(path, sa[key]), b: formatValue(path, sb[key]) });
      }
    }
  }
  return out;
}

/** Flatten a configuration into labelled rows for summaries and exports. */
export function describeConfig(c: BuildingConfig): { section: string; rows: { label: string; value: string }[] }[] {
  const sections = [
    ["Exterior", "exterior"],
    ["Interior", "interior"],
    ["Environment", "environment"],
  ] as const;
  return sections.map(([title, key]) => ({
    section: title,
    rows: Object.entries(c[key]).map(([k, v]) => ({
      label: fieldLabel(`${key}.${k}`),
      value: formatValue(`${key}.${k}`, v),
    })),
  }));
}
