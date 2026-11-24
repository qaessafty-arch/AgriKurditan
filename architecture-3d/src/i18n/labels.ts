/** Localized labels for the 3D configuration, plans and model summaries. Works on server and client. */
import type { BuildingConfig, Option } from "@/three/config";
import { OPTION_CATALOG, fieldLabel, optionLabel } from "@/three/config";
import type { BuildingModel, Slot } from "@/three/generate";
import type { BuildingPlan } from "@/three/plans";
import { LOCALE_META, fmt, type Locale } from "./config";
import type { Messages } from "./messages/en";

type CatalogPath = keyof typeof OPTION_CATALOG;
const FIELD_GROUP: Record<CatalogPath, string> = {
  "exterior.wall": "wall", "exterior.accent": "accent", "exterior.pattern": "pattern", "exterior.windows": "windows", "exterior.glass": "glass",
  "exterior.frames": "frames", "exterior.door": "door", "exterior.roof": "roof", "interior.floor": "floor", "interior.walls": "walls",
  "interior.ceiling": "ceiling", "interior.furniture": "furniture", "interior.lighting": "lighting", "environment.sky": "sky", "environment.landscape": "landscape",
};

export function optionText(m: Messages, path: CatalogPath, id: string): string {
  return m.config.options[FIELD_GROUP[path]]?.[id] ?? optionLabel(path, id);
}

/** Localized option list (label + note) for segmented controls. */
export function localizedOptions<T extends string>(m: Messages, path: CatalogPath, list: readonly Option<T>[]): { id: T; label: string; note?: string }[] {
  const group = FIELD_GROUP[path];
  return list.map((o) => ({ id: o.id, label: m.config.options[group]?.[o.id] ?? o.label, note: m.config.notes[group]?.[o.id] }));
}

export function noteText(m: Messages, group: string, id: string): string | undefined {
  return m.config.notes[group]?.[id];
}

export function fieldText(m: Messages, path: string): string {
  return m.config.fields[path] ?? fieldLabel(path);
}

const nf = (locale: Locale, opts: Intl.NumberFormatOptions = {}) => new Intl.NumberFormat(LOCALE_META[locale].numberLocale, opts);

export function formatTime(locale: Locale, t: number): string {
  const h = Math.floor(t), mm = Math.round((t - h) * 60);
  const two = nf(locale, { minimumIntegerDigits: 2, useGrouping: false });
  return `${two.format(h)}:${two.format(mm === 60 ? 0 : mm)}`;
}

export function formatPercent(locale: Locale, v: number): string {
  return nf(locale, { style: "percent", maximumFractionDigits: 0 }).format(v);
}

export function num(locale: Locale, v: number, digits = 0): string {
  return nf(locale, { maximumFractionDigits: digits }).format(v);
}

export function valueText(m: Messages, locale: Locale, path: string, value: unknown): string {
  if (typeof value === "boolean") return value ? m.config.yes : m.config.no;
  if (path === "environment.time" && typeof value === "number") return formatTime(locale, value);
  if (path === "environment.sun" && typeof value === "number") return formatPercent(locale, value);
  if (path in OPTION_CATALOG && typeof value === "string") return optionText(m, path as CatalogPath, value);
  return String(value);
}

export function describeConfigL(m: Messages, locale: Locale, c: BuildingConfig) {
  return (["exterior", "interior", "environment"] as const).map((key) => ({
    section: m.config.sections[key],
    rows: Object.entries(c[key]).map(([k, v]) => ({ label: fieldText(m, `${key}.${k}`), value: valueText(m, locale, `${key}.${k}`, v) })),
  }));
}

export function diffConfigsL(m: Messages, locale: Locale, a: BuildingConfig, b: BuildingConfig) {
  const out: { path: string; label: string; a: string; b: string }[] = [];
  for (const section of ["exterior", "interior", "environment"] as const) {
    const sa = a[section] as Record<string, unknown>, sb = b[section] as Record<string, unknown>;
    for (const key of Object.keys(sa)) {
      if (sa[key] === sb[key]) continue;
      const path = `${section}.${key}`;
      out.push({ path, label: fieldText(m, path), a: valueText(m, locale, path, sa[key]), b: valueText(m, locale, path, sb[key]) });
    }
  }
  return out;
}

export const planName = (m: Messages, plan: Pick<BuildingPlan, "id" | "name">) => m.plans[plan.id]?.name ?? plan.name;
export const planDescription = (m: Messages, plan: Pick<BuildingPlan, "id" | "description">) => m.plans[plan.id]?.description ?? plan.description;
/** Room and floor names are defined in English in the plans; translate them by name. */
export const nameText = (m: Messages, english: string) => m.names[english] ?? english;

export function summarizeModelL(m: Messages, locale: Locale, model: BuildingModel): string[] {
  const s = model.stats, S = m.summary;
  const n = (v: number, d = 0) => num(locale, v, d);
  return [
    fmt(s.floors === 1 ? S.storey : S.storeys, { n: n(s.floors), h: n(s.height, 1) }),
    fmt(S.area, { gfa: n(s.grossFloorArea), fp: n(s.footprintArea) }),
    s.bedrooms ? fmt(s.bedrooms === 1 ? S.roomsBedroom : S.roomsBedrooms, { n: n(s.rooms), b: n(s.bedrooms) }) : fmt(S.rooms, { n: n(s.rooms) }),
    fmt(S.glazing, { g: n(s.glazingArea), p: n(Math.round(s.glazingRatio * 100)) }),
  ];
}

export function describeSlotL(m: Messages, slot: Slot, config: BuildingConfig): { name: string; finish: string; notes: string } {
  const ext = config.exterior, int = config.interior, I = m.inspector;
  const o = (path: CatalogPath, id: string) => optionText(m, path, id);
  const slotText = (key: keyof Messages["inspector"]["slots"], vars: Record<string, string> = {}) => ({
    finish: fmt(I.slots[key].finish, vars), notes: fmt(I.slots[key].notes, vars),
  });
  switch (slot) {
    case "extWall": return { name: o("exterior.wall", ext.wall), ...slotText("extWall") };
    case "extAccent": return { name: ext.accent === "same" ? o("exterior.wall", ext.wall) : o("exterior.accent", ext.accent), ...slotText("extAccent") };
    case "intWall": return { name: o("interior.walls", int.walls), ...slotText("intWall", { color: int.wallColor }) };
    case "floorFinish": return { name: o("interior.floor", int.floor), ...slotText("floorFinish") };
    case "stair": return { name: o("interior.floor", int.floor), ...slotText("stair") };
    case "ceiling": return { name: o("interior.ceiling", int.ceiling), ...slotText("ceiling") };
    case "glass": return { name: o("exterior.glass", ext.glass), ...slotText("glass") };
    case "frame": return { name: o("exterior.frames", ext.frames), ...slotText("frame") };
    case "door": return { name: o("exterior.door", ext.door), ...slotText("door") };
    case "roof": case "coping": return { name: ext.roof === "overhang" ? I.names.canopy : I.names.membrane, ...slotText("roof") };
    case "roofGreen": return { name: I.names.greenRoof, ...slotText("roofGreen") };
    case "paving": return { name: I.names.pavers, ...slotText("paving") };
    case "water": return { name: I.names.water, ...slotText("water") };
    default: return { name: I.names.furniture, ...slotText("other", { style: o("interior.furniture", int.furniture) }) };
  }
}
