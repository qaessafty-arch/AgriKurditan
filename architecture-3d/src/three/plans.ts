/**
 * Parametric building plans. Coordinates are metres in building-local space:
 * x runs left→right along the street facade, z runs back (0) → front (street side).
 * Rooms on each floor must tile that floor's rectangle exactly; tests enforce this.
 */
import { DEFAULT_CONFIG, type BuildingConfig } from "./config";

export type RoomType =
  | "living" | "kitchen" | "dining" | "bedroom" | "bath" | "office" | "stair" | "landing"
  | "entry" | "lobby" | "retail" | "cafe" | "meeting" | "openOffice" | "service" | "studio";

export interface Rect { x: number; z: number; w: number; d: number }

export interface RoomPlan extends Rect {
  id: string;
  name: string;
  type: RoomType;
}

export interface FloorPlan {
  name: string;
  height: number; // floor-to-floor height, metres
  rect: Rect;
  rooms: RoomPlan[];
}

export interface BuildingPlan {
  id: string;
  name: string;
  category: "residential" | "commercial";
  style: string;
  description: string;
  floors: FloorPlan[];
  /** Entrance door on the ground floor front facade: x position of the door centre. */
  entranceX: number;
  pool?: Rect;
  site: { w: number; d: number };
  defaultConfig: BuildingConfig;
}

const r = (id: string, name: string, type: RoomType, x: number, z: number, w: number, d: number): RoomPlan => ({
  id, name, type, x, z, w, d,
});

const withConfig = (patch: {
  exterior?: Partial<BuildingConfig["exterior"]>;
  interior?: Partial<BuildingConfig["interior"]>;
  environment?: Partial<BuildingConfig["environment"]>;
}): BuildingConfig => ({
  exterior: { ...DEFAULT_CONFIG.exterior, ...patch.exterior },
  interior: { ...DEFAULT_CONFIG.interior, ...patch.interior },
  environment: { ...DEFAULT_CONFIG.environment, ...patch.environment },
});

export const PLANS: BuildingPlan[] = [
  {
    id: "villa-horizon",
    name: "Horizon Villa",
    category: "residential",
    style: "luxury",
    description:
      "Two-storey family villa with a cantilevered upper volume that shades a full-width garden terrace and pool.",
    entranceX: 9.5,
    pool: { x: 3, z: 14.5, w: 12, d: 4 },
    site: { w: 44, d: 38 },
    floors: [
      {
        name: "Ground floor",
        height: 3.6,
        rect: { x: 0, z: 0, w: 18, d: 11 },
        rooms: [
          r("g-office", "Study", "office", 0, 0, 5, 5),
          r("g-stair", "Stair", "stair", 5, 0, 3, 5),
          r("g-bath", "Guest bath", "bath", 8, 0, 3, 5),
          r("g-dining", "Dining", "dining", 11, 0, 7, 5),
          r("g-living", "Living room", "living", 0, 5, 8, 6),
          r("g-entry", "Entrance hall", "entry", 8, 5, 3, 6),
          r("g-kitchen", "Kitchen", "kitchen", 11, 5, 7, 6),
        ],
      },
      {
        name: "First floor",
        height: 3.4,
        rect: { x: 0, z: 0, w: 16, d: 12.5 },
        rooms: [
          r("f-bath", "Family bath", "bath", 0, 0, 5, 6.5),
          r("f-stair", "Stair", "stair", 5, 0, 3, 5),
          r("f-landing", "Landing", "landing", 5, 5, 3, 1.5),
          r("f-bed3", "Bedroom 3", "bedroom", 8, 0, 8, 6.5),
          r("f-master", "Master suite", "bedroom", 0, 6.5, 8, 6),
          r("f-bed2", "Bedroom 2", "bedroom", 8, 6.5, 8, 6),
        ],
      },
    ],
    defaultConfig: DEFAULT_CONFIG,
  },
  {
    id: "pavilion-minimal",
    name: "Glass Pavilion",
    category: "residential",
    style: "minimalist",
    description: "Single-storey pavilion with full-height glazing, a deep canopy roof and a reflecting pool.",
    entranceX: 12,
    pool: { x: 2, z: 12, w: 16, d: 3 },
    site: { w: 40, d: 32 },
    floors: [
      {
        name: "Ground floor",
        height: 3.8,
        rect: { x: 0, z: 0, w: 20, d: 10 },
        rooms: [
          r("p-living", "Living and dining", "living", 0, 0, 10, 10),
          r("p-bath", "Bathroom", "bath", 10, 0, 4, 4),
          r("p-kitchen", "Kitchen", "kitchen", 10, 4, 4, 6),
          r("p-bed", "Bedroom", "bedroom", 14, 0, 6, 10),
        ],
      },
    ],
    defaultConfig: withConfig({
      exterior: { wall: "plaster", paint: "#F1EEE8", pattern: "none", windows: "curtain", glass: "clear", roof: "overhang", balconies: false, frames: "black" },
      interior: { floor: "terrazzo", furniture: "minimal", lighting: "neutral" },
      environment: { landscape: "lawn", time: 17.5 },
    }),
  },
  {
    id: "townhouse-stone",
    name: "Stone Townhouse",
    category: "residential",
    style: "classical",
    description: "Three-storey urban townhouse in cut limestone with vertically proportioned punched windows.",
    entranceX: 4.5,
    site: { w: 30, d: 32 },
    floors: [
      {
        name: "Ground floor",
        height: 3.5,
        rect: { x: 0, z: 0, w: 9, d: 13 },
        rooms: [
          r("t-kitchen", "Kitchen", "kitchen", 0, 0, 6, 6),
          r("t-stair0", "Stair", "stair", 6, 0, 3, 6),
          r("t-living", "Salon", "living", 0, 6, 9, 7),
        ],
      },
      {
        name: "First floor",
        height: 3.3,
        rect: { x: 0, z: 0, w: 9, d: 13 },
        rooms: [
          r("t-bath1", "Bathroom", "bath", 0, 0, 6, 3),
          r("t-study", "Study", "office", 0, 3, 6, 3),
          r("t-stair1", "Stair", "stair", 6, 0, 3, 6),
          r("t-bed1", "Bedroom", "bedroom", 0, 6, 9, 7),
        ],
      },
      {
        name: "Second floor",
        height: 3.2,
        rect: { x: 0, z: 0, w: 9, d: 13 },
        rooms: [
          r("t-bath2", "En-suite", "bath", 0, 0, 6, 6),
          r("t-landing2", "Landing", "landing", 6, 0, 3, 6),
          r("t-master", "Master bedroom", "bedroom", 0, 6, 9, 7),
        ],
      },
    ],
    defaultConfig: withConfig({
      exterior: { wall: "limestone", accent: "same", pattern: "grid", windows: "punched", glass: "clear", frames: "timber", door: "pivot", roof: "flat", balconies: true },
      interior: { floor: "walnut", walls: "paint", furniture: "luxe", lighting: "warm" },
      environment: { landscape: "gravel", pool: false, time: 18.2 },
    }),
  },
  {
    id: "office-block",
    name: "Meridian Workplace",
    category: "commercial",
    style: "modern",
    description: "Four-storey commercial building: retail and café at street level, flexible offices above.",
    entranceX: 5,
    site: { w: 54, d: 44 },
    floors: [
      {
        name: "Ground floor",
        height: 4.2,
        rect: { x: 0, z: 0, w: 24, d: 16 },
        rooms: [
          r("o-services", "Services", "service", 0, 0, 8, 6),
          r("o-core0", "Stair core", "stair", 8, 0, 4, 6),
          r("o-cafe", "Café", "cafe", 12, 0, 12, 6),
          r("o-lobby", "Lobby", "lobby", 0, 6, 10, 10),
          r("o-retail", "Retail unit", "retail", 10, 6, 14, 10),
        ],
      },
      ...[1, 2, 3].map((lvl): FloorPlan => ({
        name: `Level ${lvl}`,
        height: 3.7,
        rect: { x: 0, z: 0, w: 24, d: 16 },
        rooms: [
          r(`o-meet${lvl}`, "Meeting rooms", "meeting", 0, 0, 8, 6),
          r(`o-core${lvl}`, lvl === 3 ? "Core landing" : "Stair core", lvl === 3 ? "landing" : "stair", 8, 0, 4, 6),
          r(`o-office${lvl}`, "Private offices", "office", 12, 0, 12, 6),
          r(`o-open${lvl}`, "Open workplace", "openOffice", 0, 6, 24, 10),
        ],
      })),
    ],
    defaultConfig: withConfig({
      exterior: { wall: "concrete", accent: "basalt", pattern: "fins", windows: "ribbon", glass: "grey", frames: "black", door: "glass", roof: "green", balconies: false },
      interior: { floor: "concrete", walls: "paint", ceiling: "concrete", furniture: "minimal", lighting: "cool" },
      environment: { landscape: "meadow", pool: false, time: 11 },
    }),
  },
  {
    id: "brutalist-residence",
    name: "Monolith Residence",
    category: "residential",
    style: "brutalist",
    description: "Board-formed concrete house of stacked, shifting volumes that create shaded terraces on every level.",
    entranceX: 7,
    pool: { x: 1, z: 13.5, w: 9, d: 3.5 },
    site: { w: 40, d: 36 },
    floors: [
      {
        name: "Ground floor",
        height: 3.4,
        rect: { x: 2, z: 0, w: 10, d: 10 },
        rooms: [
          r("b-bath0", "WC", "bath", 2, 0, 3, 5),
          r("b-stair0", "Stair", "stair", 5, 0, 3, 5),
          r("b-kitchen", "Kitchen", "kitchen", 8, 0, 4, 5),
          r("b-living", "Living room", "living", 2, 5, 10, 5),
        ],
      },
      {
        name: "First floor",
        height: 3.3,
        rect: { x: 0, z: 0, w: 14, d: 12 },
        rooms: [
          r("b-bed1", "Bedroom", "bedroom", 0, 0, 5, 5),
          r("b-stair1", "Stair", "stair", 5, 0, 3, 5),
          r("b-bath1", "Bathroom", "bath", 8, 0, 2.5, 5),
          r("b-studio", "Studio", "studio", 10.5, 0, 3.5, 5),
          r("b-lounge", "Library lounge", "living", 0, 5, 14, 7),
        ],
      },
      {
        name: "Second floor",
        height: 3.3,
        rect: { x: 1, z: 0, w: 12, d: 10 },
        rooms: [
          r("b-bath2", "En-suite", "bath", 1, 0, 4, 5),
          r("b-landing2", "Landing", "landing", 5, 0, 3, 5),
          r("b-office", "Office", "office", 8, 0, 5, 5),
          r("b-master", "Master bedroom", "bedroom", 1, 5, 12, 5),
        ],
      },
    ],
    defaultConfig: withConfig({
      exterior: { wall: "concrete", accent: "timber", pattern: "louvers", windows: "punched", glass: "grey", frames: "bronze", door: "steel", roof: "overhang", balconies: false },
      interior: { floor: "concrete", walls: "plaster", ceiling: "concrete", furniture: "warm" },
      environment: { landscape: "meadow", time: 15 },
    }),
  },
];

export const DEFAULT_PLAN_ID = "villa-horizon";

export function getPlan(id: string | null | undefined): BuildingPlan {
  return PLANS.find((p) => p.id === id) ?? (PLANS[0] as BuildingPlan);
}

export const PLAN_IDS = PLANS.map((p) => p.id) as [string, ...string[]];
