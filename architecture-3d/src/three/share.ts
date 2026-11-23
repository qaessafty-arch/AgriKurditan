import { buildingConfigSchema, type BuildingConfig } from "./config";

/** Compact, URL-safe encoding of a configuration (used for "Open in studio" links). */
export function encodeConfig(c: BuildingConfig): string {
  return btoa(JSON.stringify(c)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeConfig(s: string | null | undefined): BuildingConfig | null {
  if (!s || s.length > 4000) return null;
  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    const parsed = buildingConfigSchema.safeParse(JSON.parse(atob(b64)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
