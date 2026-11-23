/**
 * Material library: maps a BuildingConfig to one PBR material per geometry slot.
 * Building materials share clipping planes so section cuts and cutaways affect the whole building.
 */
import * as THREE from "three";
import type { BuildingConfig } from "./config";
import type { Slot } from "./generate";
import { getTexture, type TextureName } from "./textures";
import { LIGHT_COLORS } from "./lighting";

export type MaterialSet = Record<Slot, THREE.Material>;

export interface MaterialInfo {
  name: string;
  finish: string;
  notes: string;
}

interface TexturedSpec {
  tex: TextureName;
  color?: string;
  roughness: number;
  metalness?: number;
  bump?: number;
}

const WALL_SPECS: Record<string, TexturedSpec> = {
  plaster: { tex: "plaster", roughness: 0.92, bump: 0.6 },
  travertine: { tex: "travertine", roughness: 0.78, bump: 1.2 },
  limestone: { tex: "limestone", roughness: 0.82, bump: 1.4 },
  concrete: { tex: "concrete", roughness: 0.86, bump: 1.6 },
  brick: { tex: "brick", roughness: 0.9, bump: 2.2 },
  timber: { tex: "timber", roughness: 0.7, bump: 1.4 },
  basalt: { tex: "basalt", roughness: 0.75, bump: 1.2 },
};

const FLOOR_SPECS: Record<BuildingConfig["interior"]["floor"], TexturedSpec> = {
  oak: { tex: "oak", roughness: 0.55, bump: 0.6 },
  walnut: { tex: "walnut", roughness: 0.5, bump: 0.6 },
  marble: { tex: "marble", roughness: 0.12, bump: 0.2 },
  terrazzo: { tex: "terrazzo", roughness: 0.3, bump: 0.3 },
  concrete: { tex: "polished", roughness: 0.32, bump: 0.3 },
  tile: { tex: "tile", roughness: 0.25, bump: 0.4 },
};

const GLASS_TINT: Record<BuildingConfig["exterior"]["glass"], string> = {
  clear: "#dfe9ec",
  bronze: "#8a7158",
  grey: "#5f6569",
  green: "#6f8c80",
};

const FRAME_COLORS: Record<Exclude<BuildingConfig["exterior"]["frames"], "timber">, { color: string; metalness: number; roughness: number }> = {
  black: { color: "#1c1d1f", metalness: 0.6, roughness: 0.42 },
  bronze: { color: "#5a4431", metalness: 0.75, roughness: 0.38 },
  white: { color: "#e6e4df", metalness: 0.1, roughness: 0.5 },
};

const FURNITURE_PALETTES: Record<Exclude<BuildingConfig["interior"]["furniture"], "none">, {
  fabric: string; fabricAlt: string; wood: TextureName; metal: { color: string; metalness: number; roughness: number }; stone: TextureName; rug: string;
}> = {
  minimal: { fabric: "#d8d4ca", fabricAlt: "#8e897f", wood: "oak", metal: { color: "#202124", metalness: 0.6, roughness: 0.4 }, stone: "marble", rug: "#c7c0b2" },
  warm: { fabric: "#b9a283", fabricAlt: "#7a5a40", wood: "oak", metal: { color: "#6e5238", metalness: 0.8, roughness: 0.35 }, stone: "travertine", rug: "#a38a6b" },
  luxe: { fabric: "#2e3035", fabricAlt: "#6a4c37", wood: "walnut", metal: { color: "#b38f57", metalness: 1, roughness: 0.25 }, stone: "marble", rug: "#3b3935" },
};

export interface MaterialContext {
  textureSize: number;
  clippingPlanes: THREE.Plane[];
  night: number;
}

function textured(spec: TexturedSpec, ctx: MaterialContext, extra: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  const { map, bump } = getTexture(spec.tex, ctx.textureSize);
  return new THREE.MeshStandardMaterial({
    map,
    bumpMap: bump,
    bumpScale: (spec.bump ?? 1) * 0.01,
    color: spec.color ?? "#ffffff",
    roughness: spec.roughness,
    metalness: spec.metalness ?? 0,
    ...extra,
  });
}

function solid(color: string, roughness: number, metalness = 0, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
}

export function createMaterials(config: BuildingConfig, ctx: MaterialContext): MaterialSet {
  const { exterior: ext, interior: int } = config;
  const lit = int.lightsOn;

  const wallSpec = WALL_SPECS[ext.wall] as TexturedSpec;
  const extWall = textured({ ...wallSpec, color: ext.wall === "plaster" ? ext.paint : undefined }, ctx);
  const extAccent = ext.accent === "same" ? extWall : textured(WALL_SPECS[ext.accent] as TexturedSpec, ctx);

  const intWall =
    int.walls === "timber" ? textured({ tex: "timber", roughness: 0.65, bump: 0.8 }, ctx)
    : int.walls === "stone" ? textured({ tex: "travertine", roughness: 0.75 }, ctx)
    : textured({ tex: "plaster", color: int.wallColor, roughness: int.walls === "plaster" ? 0.55 : 0.95, bump: int.walls === "plaster" ? 0.4 : 0.15 }, ctx);

  const floorFinish = textured(FLOOR_SPECS[int.floor], ctx);
  const ceiling =
    int.ceiling === "timber" ? textured({ tex: "slats", roughness: 0.7, bump: 1 }, ctx)
    : int.ceiling === "concrete" ? textured({ tex: "concrete", roughness: 0.9 }, ctx)
    : solid("#f1efea", 0.95);

  const glass = new THREE.MeshPhysicalMaterial({
    color: GLASS_TINT[ext.glass],
    metalness: 0.05,
    roughness: 0.04,
    transparent: true,
    opacity: ext.glass === "clear" ? 0.22 : 0.45,
    envMapIntensity: 2.2,
    reflectivity: 0.6,
    depthWrite: false,
    side: THREE.DoubleSide,
    emissive: new THREE.Color(LIGHT_COLORS[int.lighting]),
    emissiveIntensity: lit ? ctx.night * 0.08 : 0,
  });
  const railing = new THREE.MeshPhysicalMaterial({
    color: "#dfe9ec", metalness: 0, roughness: 0.05, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 2,
  });

  const frame = ext.frames === "timber"
    ? textured({ tex: "oak", roughness: 0.6 }, ctx)
    : solid(FRAME_COLORS[ext.frames].color, FRAME_COLORS[ext.frames].roughness, FRAME_COLORS[ext.frames].metalness);
  const door = ext.door === "steel" ? solid("#2a2b2d", 0.45, 0.85) : textured({ tex: "walnut", roughness: 0.55 }, ctx);

  const palette = FURNITURE_PALETTES[int.furniture === "none" ? "minimal" : int.furniture];
  const lamp = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    emissive: new THREE.Color(LIGHT_COLORS[int.lighting]),
    emissiveIntensity: lit ? 0.6 + ctx.night * 3.4 : 0,
    toneMapped: false,
    roughness: 0.4,
  });

  const set: MaterialSet = {
    extWall,
    extAccent,
    intWall,
    floorFinish,
    ceiling,
    slab: textured({ tex: "concrete", roughness: 0.9, color: "#d9d7d2" }, ctx),
    glass,
    frame,
    door,
    roof: solid("#6e6c68", 0.92),
    roofGreen: textured({ tex: "grass", roughness: 1 }, ctx),
    coping: solid("#8d8a85", 0.5, 0.5),
    balcony: ext.accent === "same" ? extWall : extAccent,
    railing,
    stair: floorFinish,
    handrail: solid("#1e1f21", 0.4, 0.7),
    fabric: solid(palette.fabric, 0.95, 0, { bumpScale: 0 }),
    fabricAlt: solid(palette.fabricAlt, 0.85),
    wood: textured({ tex: palette.wood, roughness: 0.5 }, ctx),
    metal: solid(palette.metal.color, palette.metal.roughness, palette.metal.metalness),
    stoneTop: textured({ tex: palette.stone, roughness: 0.2, bump: 0.2 }, ctx),
    rug: solid(palette.rug, 1),
    lamp,
    paving: textured({ tex: "pavers", roughness: 0.85, bump: 1 }, ctx),
    water: new THREE.MeshPhysicalMaterial({
      color: "#2c6f7b", roughness: 0.06, metalness: 0.1, transparent: true, opacity: 0.86, envMapIntensity: 2,
      bumpMap: getTexture("ripples", ctx.textureSize).bump, bumpScale: 0.02,
      emissive: new THREE.Color("#2fa6c0"), emissiveIntensity: config.environment.outdoorLights ? ctx.night * 0.6 : 0,
    }),
    poolLining: textured({ tex: "poolTile", roughness: 0.3 }, ctx),
  };

  // Building materials honour section/cutaway clipping. Site materials never clip.
  const siteSlots = new Set<Slot>(["paving", "water", "poolLining"]);
  for (const [slot, mat] of Object.entries(set) as [Slot, THREE.Material][]) {
    if (siteSlots.has(slot)) continue;
    mat.clippingPlanes = ctx.clippingPlanes;
    mat.clipShadows = true;
    // Double-sided opaque surfaces keep clipped walls reading as solid in section views.
    if (!mat.transparent) {
      mat.side = THREE.DoubleSide;
      mat.shadowSide = THREE.FrontSide;
    }
  }
  return set;
}

export function disposeMaterials(set: MaterialSet) {
  // Textures are cached and shared; only dispose material programs.
  const seen = new Set<THREE.Material>();
  for (const m of Object.values(set)) {
    if (seen.has(m)) continue;
    seen.add(m);
    m.dispose();
  }
}

/** Human-readable material inspection for a slot under the current configuration. */
export function describeSlot(slot: Slot, config: BuildingConfig): MaterialInfo {
  const ext = config.exterior, int = config.interior;
  const wallNames: Record<string, string> = {
    plaster: "Mineral plaster", travertine: "Travertine stone", limestone: "Limestone blocks", concrete: "Board-formed concrete",
    brick: "Fired brick", timber: "Timber cladding", basalt: "Dark basalt",
  };
  switch (slot) {
    case "extWall": return { name: wallNames[ext.wall] ?? ext.wall, finish: "Exterior wall", notes: "Primary facade cladding on a 300 mm insulated wall build-up." };
    case "extAccent": return { name: ext.accent === "same" ? wallNames[ext.wall] ?? "" : wallNames[ext.accent] ?? "", finish: "Facade accent / shading elements", notes: "Fins, louvres and frame elements that shade glazing." };
    case "intWall": return { name: { paint: "Matte paint", plaster: "Polished lime plaster", timber: "Timber panelling", stone: "Stone feature wall" }[int.walls], finish: `Interior walls, ${int.wallColor}`, notes: "120 mm partitions." };
    case "floorFinish":
    case "stair": return { name: { oak: "Oak planks", walnut: "Walnut planks", marble: "Polished marble", terrazzo: "Terrazzo", concrete: "Polished concrete", tile: "Large-format porcelain" }[int.floor], finish: slot === "stair" ? "Stair treads" : "Floor finish", notes: "Laid on screed over a 300 mm concrete slab." };
    case "ceiling": return { name: { white: "White plaster", timber: "Timber slats", concrete: "Exposed concrete" }[int.ceiling], finish: "Ceiling", notes: "" };
    case "glass": return { name: { clear: "Clear low-iron glass", bronze: "Bronze solar-control glass", grey: "Grey solar-control glass", green: "Green tinted glass" }[ext.glass], finish: "Double glazing", notes: "Solar-control coatings reduce cooling load on sun-facing facades." };
    case "frame": return { name: { black: "Black anodised aluminium", bronze: "Bronze anodised aluminium", white: "White powder-coated aluminium", timber: "Oak timber" }[ext.frames], finish: "Window frames and mullions", notes: "" };
    case "door": return { name: { pivot: "Timber pivot door", glass: "Frameless glass door", steel: "Blackened steel door" }[ext.door], finish: "Entrance door", notes: "" };
    case "roof":
    case "coping": return { name: ext.roof === "overhang" ? "Cantilevered roof canopy" : "Flat roof membrane", finish: "Roof", notes: "" };
    case "roofGreen": return { name: "Extensive green roof", finish: "Sedum planting", notes: "Adds insulation and retains stormwater." };
    case "paving": return { name: "Stone pavers", finish: "External terrace", notes: "" };
    case "water": return { name: "Pool water", finish: "Swimming pool", notes: "" };
    default: return { name: slot.replace(/([A-Z])/g, " $1").toLowerCase(), finish: "Furniture and fittings", notes: `Style: ${int.furniture}` };
  }
}
