/**
 * Pure geometry generator: BuildingPlan + BuildingConfig → list of axis-aligned box parts.
 * No three.js dependency, so it is unit-testable and cheap to run on the server (stats/summaries).
 *
 * Conventions: metres; y is local to the floor group (0 = underside of that floor's slab);
 * x/z are building-local (see plans.ts). The renderer offsets everything by `center`.
 */
import type { BuildingConfig } from "./config";
import type { BuildingPlan, FloorPlan, Rect, RoomPlan, RoomType } from "./plans";

export type Slot =
  | "extWall" | "extAccent" | "intWall" | "floorFinish" | "ceiling" | "slab" | "glass" | "frame"
  | "door" | "roof" | "roofGreen" | "coping" | "balcony" | "railing" | "stair" | "handrail"
  | "fabric" | "fabricAlt" | "wood" | "metal" | "stoneTop" | "rug" | "lamp" | "paving" | "water" | "poolLining";

export interface Part {
  slot: Slot;
  /** -1 = site, 0..n-1 = floors, n = roof */
  floor: number;
  p: [number, number, number];
  s: [number, number, number];
  room?: string;
}

export interface RoomInfo {
  id: string;
  name: string;
  type: RoomType;
  floor: number;
  floorName: string;
  rect: Rect;
  area: number;
}

export interface FloorInfo {
  index: number;
  name: string;
  elevation: number;
  height: number;
  rect: Rect;
}

export interface Tree { x: number; z: number; scale: number; kind: "tree" | "shrub" | "cypress" }
export interface PointSpec { x: number; y: number; z: number; floor: number }

export interface BuildingModel {
  planId: string;
  parts: Part[];
  rooms: RoomInfo[];
  floors: FloorInfo[];
  roofElevation: number;
  center: [number, number];
  size: [number, number, number];
  trees: Tree[];
  outdoorLights: PointSpec[];
  interiorLights: PointSpec[];
  stats: BuildingStats;
}

export interface BuildingStats {
  floors: number;
  rooms: number;
  bedrooms: number;
  grossFloorArea: number;
  footprintArea: number;
  facadeArea: number;
  glazingArea: number;
  glazingRatio: number;
  height: number;
}

const SLAB = 0.3;
const EXT_T = 0.3;
const INT_T = 0.12;
const FIN_Y = SLAB; // floor finish level

interface Opening { a: number; b: number; bottom: number; top: number; kind: "window" | "door" | "pass" }

type Side = "front" | "back" | "left" | "right";

// ───────────────────────────── helpers ─────────────────────────────

const round = (v: number) => Math.round(v * 1000) / 1000;

function box(parts: Part[], slot: Slot, floor: number, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, room?: string) {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0;
  if (w <= 0.001 || h <= 0.001 || d <= 0.001) return;
  parts.push({ slot, floor, p: [round(x0 + w / 2), round(y0 + h / 2), round(z0 + d / 2)], s: [round(w), round(h), round(d)], room });
}

/** Rectangle subtraction: returns up to four rects covering `a` minus `b`. */
export function subtractRect(a: Rect, b: Rect): Rect[] {
  const ax1 = a.x + a.w, az1 = a.z + a.d, bx1 = b.x + b.w, bz1 = b.z + b.d;
  const ix0 = Math.max(a.x, b.x), iz0 = Math.max(a.z, b.z), ix1 = Math.min(ax1, bx1), iz1 = Math.min(az1, bz1);
  if (ix0 >= ix1 || iz0 >= iz1) return [a];
  const out: Rect[] = [];
  if (iz0 > a.z) out.push({ x: a.x, z: a.z, w: a.w, d: iz0 - a.z });
  if (az1 > iz1) out.push({ x: a.x, z: iz1, w: a.w, d: az1 - iz1 });
  if (ix0 > a.x) out.push({ x: a.x, z: iz0, w: ix0 - a.x, d: iz1 - iz0 });
  if (ax1 > ix1) out.push({ x: ix1, z: iz0, w: ax1 - ix1, d: iz1 - iz0 });
  return out.filter((r) => r.w > 0.001 && r.d > 0.001);
}

function subtractAll(a: Rect, holes: Rect[]): Rect[] {
  let pieces = [a];
  for (const h of holes) pieces = pieces.flatMap((p) => subtractRect(p, h));
  return pieces;
}

/** Deterministic PRNG so landscaping is stable between renders and server/client. */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
}

// ───────────────────────────── openings ─────────────────────────────

function windowOpenings(len: number, clear: number, style: BuildingConfig["exterior"]["windows"], side: Side): Opening[] {
  const out: Opening[] = [];
  const longSide = side === "front" || side === "back";
  if (style === "curtain" && longSide) {
    const margin = 0.45;
    const usable = len - margin * 2;
    const bays = Math.max(1, Math.round(usable / 2.8));
    const pier = 0.22;
    const bw = (usable - pier * (bays - 1)) / bays;
    for (let i = 0; i < bays; i++) {
      const a = margin + i * (bw + pier);
      out.push({ a, b: a + bw, bottom: 0, top: Math.min(clear - 0.2, 3.4), kind: "window" });
    }
    return out;
  }
  if (style === "ribbon") {
    const margin = 0.7;
    if (len - margin * 2 > 1) out.push({ a: margin, b: len - margin, bottom: 0.85, top: Math.min(2.45, clear - 0.3), kind: "window" });
    return out;
  }
  // punched (and curtain on short sides)
  const ww = 1.3, pitch = 2.8;
  const count = Math.max(1, Math.floor((len - 1.2) / pitch));
  const start = (len - (count - 1) * pitch) / 2;
  for (let i = 0; i < count; i++) {
    const c = start + i * pitch;
    out.push({ a: c - ww / 2, b: c + ww / 2, bottom: 0.75, top: Math.min(2.7, clear - 0.3), kind: "window" });
  }
  return out;
}

/** Remove/split window openings that collide with a door, then add the door. */
function insertDoor(openings: Opening[], door: Opening): Opening[] {
  const out: Opening[] = [];
  const gap = 0.35;
  for (const o of openings) {
    if (o.b <= door.a - gap || o.a >= door.b + gap) { out.push(o); continue; }
    if (o.a < door.a - gap - 0.6) out.push({ ...o, b: door.a - gap });
    if (o.b > door.b + gap + 0.6) out.push({ ...o, a: door.b + gap });
  }
  out.push(door);
  return out.sort((x, y) => x.a - y.a);
}

/**
 * Emit a straight wall of length `len` with openings. `place` maps (along, y0, y1, a0, a1) → box.
 * Returns opening glazing area.
 */
function wallWithOpenings(
  len: number, y0: number, y1: number, openings: Opening[],
  emit: (a0: number, a1: number, b0: number, b1: number) => void,
) {
  let cursor = 0;
  for (const o of openings) {
    const oy0 = FIN_Y + o.bottom, oy1 = FIN_Y + o.top;
    if (o.a > cursor) emit(cursor, o.a, y0, y1);
    if (oy0 > y0) emit(o.a, o.b, y0, oy0);
    if (oy1 < y1) emit(o.a, o.b, oy1, y1);
    cursor = o.b;
  }
  if (cursor < len) emit(cursor, len, y0, y1);
}

// ───────────────────────────── furniture ─────────────────────────────

function furnish(parts: Part[], f: number, room: RoomPlan, style: BuildingConfig["interior"]["furniture"]) {
  if (style === "none") return;
  const { x, z, w, d } = room;
  const y = FIN_Y + 0.02;
  const cx = x + w / 2, cz = z + d / 2;
  const B = (slot: Slot, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) =>
    box(parts, slot, f, x0, y0, z0, x1, y1, z1, room.id);
  const inset = 0.45;

  switch (room.type) {
    case "living":
    case "lobby": {
      const sw = Math.min(3.2, w * 0.5), sd = 0.95;
      const sz = z + inset + 0.3; // sofa against back wall, facing the facade
      B("fabric", cx - sw / 2, y, sz, cx + sw / 2, y + 0.42, sz + sd);
      B("fabric", cx - sw / 2, y + 0.42, sz, cx + sw / 2, y + 0.82, sz + 0.22);
      B("fabricAlt", cx - sw / 2 - 0.25, y, sz, cx - sw / 2, y + 0.6, sz + sd);
      B("fabricAlt", cx + sw / 2, y, sz, cx + sw / 2 + 0.25, y + 0.6, sz + sd);
      const rz = sz + sd + 0.25;
      B("rug", cx - 1.6, y, rz - 0.4, cx + 1.6, y + 0.012, Math.min(rz + 2.2, z + d - 0.4));
      B(style === "luxe" ? "stoneTop" : "wood", cx - 0.65, y, rz + 0.3, cx + 0.65, y + 0.38, rz + 1.0);
      if (d > 5) {
        for (const side of [-1, 1]) {
          const ax = cx + side * 1.7;
          B("fabricAlt", ax - 0.42, y, rz + 1.5, ax + 0.42, y + 0.42, rz + 2.3);
          B("fabricAlt", ax - 0.42, y + 0.42, rz + 2.1, ax + 0.42, y + 0.8, rz + 2.3);
        }
      }
      if (room.type === "lobby") {
        B("stoneTop", x + w - 3.6, y, z + d - 2.4, x + w - 0.8, y + 1.1, z + d - 1.6);
      } else {
        B("metal", x + inset, y, z + inset, x + inset + 0.04, y + 1.6, z + inset + 0.04);
        B("lamp", x + inset - 0.2, y + 1.6, z + inset - 0.2, x + inset + 0.24, y + 1.8, z + inset + 0.24);
      }
      break;
    }
    case "dining":
    case "meeting": {
      const tw = Math.min(room.type === "meeting" ? 4.4 : 2.6, w - 1.8), td = 1.0;
      if (tw < 1.2) break;
      B(style === "luxe" ? "stoneTop" : "wood", cx - tw / 2, y + 0.7, cz - td / 2, cx + tw / 2, y + 0.76, cz + td / 2);
      for (const lx of [cx - tw / 2 + 0.1, cx + tw / 2 - 0.16]) {
        for (const lz of [cz - td / 2 + 0.1, cz + td / 2 - 0.16]) B("metal", lx, y, lz, lx + 0.06, y + 0.7, lz + 0.06);
      }
      const n = Math.max(1, Math.floor(tw / 0.75));
      for (let i = 0; i < n; i++) {
        const px = cx - tw / 2 + (i + 0.5) * (tw / n);
        for (const side of [-1, 1]) {
          const pz = cz + side * (td / 2 + 0.35);
          B("fabricAlt", px - 0.22, y + 0.42, pz - 0.22, px + 0.22, y + 0.47, pz + 0.22);
          const bz = side < 0 ? pz - 0.22 : pz + 0.17;
          B("fabricAlt", px - 0.22, y + 0.47, bz, px + 0.22, y + 0.9, bz + 0.05);
          B("metal", px - 0.02, y, pz - 0.02, px + 0.02, y + 0.42, pz + 0.02);
        }
      }
      B("lamp", cx - Math.min(0.9, tw / 3), y + 1.95, cz - 0.08, cx + Math.min(0.9, tw / 3), y + 2.0, cz + 0.08);
      break;
    }
    case "kitchen":
    case "cafe": {
      const cw = w - 0.6;
      B("wood", x + 0.3, y, z + 0.32, x + 0.3 + cw, y + 0.86, z + 0.92);
      B("stoneTop", x + 0.28, y + 0.86, z + 0.3, x + 0.32 + cw, y + 0.9, z + 0.95);
      B("wood", x + 0.3, y + 1.45, z + 0.32, x + 0.3 + cw, y + 2.2, z + 0.67);
      if (w >= 4 && d >= 4.5) {
        const iw = Math.min(2.6, w * 0.45);
        B("wood", cx - iw / 2, y, cz - 0.1, cx + iw / 2, y + 0.86, cz + 0.8);
        B("stoneTop", cx - iw / 2 - 0.05, y + 0.86, cz - 0.15, cx + iw / 2 + 0.05, y + 0.9, cz + 0.85);
        if (room.type === "cafe") {
          for (let i = 0; i < Math.floor((w - 1) / 2.2); i++) {
            const tx = x + 1.4 + i * 2.2, tz = z + d - 1.3;
            B("wood", tx - 0.35, y + 0.72, tz - 0.35, tx + 0.35, y + 0.76, tz + 0.35);
            B("metal", tx - 0.03, y, tz - 0.03, tx + 0.03, y + 0.72, tz + 0.03);
          }
        }
      }
      break;
    }
    case "bedroom": {
      const bw = Math.min(1.9, w - 1.6), bl = 2.1;
      if (bw < 0.9) break;
      const bz = z + inset - 0.25;
      B("wood", cx - bw / 2 - 0.1, y, bz, cx + bw / 2 + 0.1, y + 1.15, bz + 0.1);
      B("wood", cx - bw / 2, y, bz + 0.1, cx + bw / 2, y + 0.3, bz + bl);
      B("fabric", cx - bw / 2 + 0.03, y + 0.3, bz + 0.12, cx + bw / 2 - 0.03, y + 0.55, bz + bl - 0.02);
      B("fabricAlt", cx - bw / 2 + 0.03, y + 0.55, bz + bl * 0.55, cx + bw / 2 - 0.03, y + 0.58, bz + bl - 0.02);
      for (const side of [-1, 1]) {
        const nx = cx + side * (bw / 2 + 0.45);
        B("wood", nx - 0.25, y, bz + 0.15, nx + 0.25, y + 0.5, bz + 0.6);
        B("lamp", nx - 0.1, y + 0.5, bz + 0.28, nx + 0.1, y + 0.8, bz + 0.48);
      }
      if (d > 4.5 && w > 3.4) B("wood", x + 0.25, y, z + d - 2.4, x + 0.85, y + 2.2, z + d - 0.6);
      break;
    }
    case "bath": {
      const vw = Math.min(1.4, w - 0.6);
      B("wood", x + 0.3, y, z + 0.3, x + 0.3 + vw, y + 0.82, z + 0.8);
      B("stoneTop", x + 0.28, y + 0.82, z + 0.28, x + 0.32 + vw, y + 0.88, z + 0.82);
      if (w >= 2.6 && d >= 2.4) B("stoneTop", x + w - 2.0, y, z + d - 1.1, x + w - 0.3, y + 0.55, z + d - 0.3);
      break;
    }
    case "office":
    case "studio": {
      const dw = Math.min(1.8, w - 1);
      if (dw < 0.8) break;
      B("wood", cx - dw / 2, y + 0.72, cz - 0.4, cx + dw / 2, y + 0.76, cz + 0.4);
      B("metal", cx - dw / 2 + 0.05, y, cz - 0.35, cx - dw / 2 + 0.09, y + 0.72, cz + 0.35);
      B("metal", cx + dw / 2 - 0.09, y, cz - 0.35, cx + dw / 2 - 0.05, y + 0.72, cz + 0.35);
      B("fabricAlt", cx - 0.25, y + 0.45, cz + 0.6, cx + 0.25, y + 0.5, cz + 1.1);
      B("fabricAlt", cx - 0.25, y + 0.5, cz + 1.05, cx + 0.25, y + 1.0, cz + 1.1);
      B("wood", x + 0.25, y, z + 0.25, x + Math.min(w - 0.25, 2.6), y + 2.0, z + 0.6);
      break;
    }
    case "openOffice": {
      const cols = Math.max(1, Math.floor((w - 2) / 3.2));
      const rows = Math.max(1, Math.floor((d - 2) / 2.6));
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const dx = x + 1.6 + i * 3.2, dz = z + 1.4 + j * 2.6;
          B("wood", dx, y + 0.72, dz, dx + 1.6, y + 0.76, dz + 1.6);
          B("metal", dx + 0.05, y, dz + 0.05, dx + 0.1, y + 0.72, dz + 1.55);
          B("metal", dx + 1.5, y, dz + 0.05, dx + 1.55, y + 0.72, dz + 1.55);
          B("fabricAlt", dx + 1.65, y + 0.45, dz + 0.55, dx + 2.15, y + 0.5, dz + 1.05);
        }
      }
      break;
    }
    case "retail": {
      B("wood", x + 0.3, y, z + 0.3, x + w - 0.3, y + 2.2, z + 0.75);
      for (let i = 0; i < Math.floor((w - 2) / 3); i++) {
        const tx = x + 1.6 + i * 3;
        B("stoneTop", tx, y, cz - 0.5, tx + 1.8, y + 0.9, cz + 0.5);
      }
      break;
    }
    case "entry": {
      B("wood", x + 0.3, y, z + 0.3, x + Math.min(w - 0.3, 1.9), y + 0.85, z + 0.7);
      B("lamp", x + 0.5, y + 0.85, z + 0.4, x + 0.7, y + 1.25, z + 0.6);
      break;
    }
    default:
      break;
  }
}

// ───────────────────────────── main ─────────────────────────────

export function generateBuilding(plan: BuildingPlan, config: BuildingConfig): BuildingModel {
  const parts: Part[] = [];
  const rooms: RoomInfo[] = [];
  const floors: FloorInfo[] = [];
  const interiorLights: PointSpec[] = [];
  const ext = config.exterior;
  let glazingArea = 0;
  let facadeArea = 0;

  // Elevations
  let elevation = 0;
  plan.floors.forEach((fp, i) => {
    floors.push({ index: i, name: fp.name, elevation, height: fp.height, rect: fp.rect });
    elevation += fp.height;
  });
  const roofElevation = elevation;
  const nFloors = plan.floors.length;

  plan.floors.forEach((fp: FloorPlan, f) => {
    const { rect, height: H } = fp;
    const clear = H - SLAB;
    const below = plan.floors[f - 1];
    const above = plan.floors[f + 1];

    // ── Slab (with stair void from the floor below) ──
    const voids = below ? below.rooms.filter((rm) => rm.type === "stair").map(({ x, z, w, d }) => ({ x, z, w, d })) : [];
    for (const piece of subtractAll(rect, voids)) {
      box(parts, "slab", f, piece.x, 0, piece.z, piece.x + piece.w, SLAB, piece.z + piece.d);
    }

    // ── Rooms: finishes, ceilings, lamps, stairs, furniture ──
    for (const room of fp.rooms) {
      rooms.push({ id: room.id, name: room.name, type: room.type, floor: f, floorName: fp.name, rect: { x: room.x, z: room.z, w: room.w, d: room.d }, area: round(room.w * room.d) });
      const isVoid = voids.some((v) => v.x === room.x && v.z === room.z && v.w === room.w && v.d === room.d);
      if (!isVoid) box(parts, "floorFinish", f, room.x, SLAB, room.z, room.x + room.w, SLAB + 0.02, room.z + room.d, room.id);

      const hasStair = room.type === "stair" && f < nFloors - 1;
      if (!hasStair) {
        box(parts, "ceiling", f, room.x, H - 0.03, room.z, room.x + room.w, H, room.z + room.d, room.id);
        // Ceiling light panels on a ~3 m grid.
        const nx = Math.max(1, Math.round(room.w / 3.2)), nz = Math.max(1, Math.round(room.d / 3.2));
        for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
          const lx = room.x + (i + 0.5) * (room.w / nx), lz = room.z + (j + 0.5) * (room.d / nz);
          box(parts, "lamp", f, lx - 0.3, H - 0.05, lz - 0.3, lx + 0.3, H - 0.03, lz + 0.3, room.id);
        }
      }

      if (hasStair) {
        const alongX = room.w >= room.d;
        const run = (alongX ? room.w : room.d) - 0.3;
        const width = Math.min(1.2, (alongX ? room.d : room.w) - 0.25);
        const steps = Math.ceil(H / 0.18);
        const rise = H / steps;
        const tread = run / steps;
        for (let k = 0; k < steps; k++) {
          const top = SLAB + rise * (k + 1);
          const yBottom = Math.max(SLAB, top - rise * 2.5);
          if (alongX) {
            const sx = room.x + 0.15 + k * tread;
            box(parts, "stair", f, sx, yBottom, room.z + 0.12, sx + tread + 0.02, top, room.z + 0.12 + width, room.id);
          } else {
            const sz = room.z + room.d - 0.15 - (k + 1) * tread;
            box(parts, "stair", f, room.x + 0.12, yBottom, sz, room.x + 0.12 + width, top, sz + tread + 0.02, room.id);
          }
        }
        // Handrail: a sloped rail approximated by short posts and a top bar per segment.
        for (let k = 0; k < steps; k += 3) {
          const top = SLAB + rise * (k + 1);
          if (alongX) {
            const sx = room.x + 0.15 + k * tread;
            box(parts, "handrail", f, sx, top, room.z + 0.12 + width + 0.02, sx + 0.04, top + 0.95, room.z + 0.12 + width + 0.06, room.id);
          } else {
            const sz = room.z + room.d - 0.15 - (k + 1) * tread;
            box(parts, "handrail", f, room.x + 0.12 + width + 0.02, top, sz, room.x + 0.12 + width + 0.06, top + 0.95, sz + 0.04, room.id);
          }
        }
      }

      furnish(parts, f, room, config.interior.furniture);
    }
    interiorLights.push({ x: rect.x + rect.w / 2, y: H - 0.6, z: rect.z + rect.d / 2, floor: f });

    // ── Exterior walls with openings ──
    const sides: { side: Side; len: number }[] = [
      { side: "front", len: rect.w },
      { side: "back", len: rect.w },
      { side: "left", len: rect.d - EXT_T * 2 },
      { side: "right", len: rect.d - EXT_T * 2 },
    ];
    for (const { side, len } of sides) {
      let openings = windowOpenings(len, clear, ext.windows, side);
      if (f === 0 && side === "front") {
        const dw = ext.door === "pivot" ? 1.5 : 1.3;
        const at = plan.entranceX - rect.x;
        openings = insertDoor(openings, { a: at - dw / 2, b: at + dw / 2, bottom: 0, top: Math.min(2.7, clear - 0.25), kind: "door" });
      }
      facadeArea += len * H;
      const slot: Slot = ext.accent !== "same" && side === "front" && f === 0 && ext.windows !== "curtain" ? "extAccent" : "extWall";

      // Map along-wall coordinate to world rectangles.
      const emit = (a0: number, a1: number, y0: number, y1: number, s: Slot = slot, inset = 0, thick = EXT_T) => {
        switch (side) {
          case "front": box(parts, s, f, rect.x + a0, y0, rect.z + rect.d - thick - inset, rect.x + a1, y1, rect.z + rect.d - inset); break;
          case "back": box(parts, s, f, rect.x + a0, y0, rect.z + inset, rect.x + a1, y1, rect.z + thick + inset); break;
          case "left": box(parts, s, f, rect.x + inset, y0, rect.z + EXT_T + a0, rect.x + thick + inset, y1, rect.z + EXT_T + a1); break;
          case "right": box(parts, s, f, rect.x + rect.w - thick - inset, y0, rect.z + EXT_T + a0, rect.x + rect.w - inset, y1, rect.z + EXT_T + a1); break;
        }
      };
      wallWithOpenings(len, 0, H, openings, (a0, a1, y0, y1) => emit(a0, a1, y0, y1));

      for (const o of openings) {
        const oy0 = FIN_Y + o.bottom, oy1 = FIN_Y + o.top;
        glazingArea += o.kind === "window" ? (o.b - o.a) * (oy1 - oy0) : 0;
        const pane = 0.03, mid = EXT_T / 2 - pane / 2;
        if (o.kind === "door") {
          const doorSlot: Slot = ext.door === "glass" ? "glass" : "door";
          emit(o.a + 0.05, o.b - 0.05, oy0, oy1 - 0.05, doorSlot, mid - 0.02, pane + 0.04);
        } else {
          emit(o.a, o.b, oy0, oy1, "glass", mid, pane);
        }
        // Frames: head, sill, jambs, and mullions on wide openings.
        const ft = 0.06, fd = 0.1, fIn = EXT_T / 2 - fd / 2;
        emit(o.a, o.b, oy1 - ft, oy1, "frame", fIn, fd);
        if (o.kind !== "door") emit(o.a, o.b, oy0, oy0 + ft, "frame", fIn, fd);
        emit(o.a, o.a + ft, oy0, oy1, "frame", fIn, fd);
        emit(o.b - ft, o.b, oy0, oy1, "frame", fIn, fd);
        if (o.kind === "window") {
          const mullions = Math.floor((o.b - o.a) / 1.7);
          for (let m = 1; m <= mullions; m++) {
            const mx = o.a + (m * (o.b - o.a)) / (mullions + 1);
            emit(mx - ft / 2, mx + ft / 2, oy0, oy1, "frame", fIn, fd);
          }
        }
        // Facade pattern: louvres over window heads on long facades.
        if (ext.pattern === "louvers" && o.kind === "window" && (side === "front" || side === "back")) {
          for (let k = 0; k < 4; k++) {
            const ly = oy1 - 0.12 - k * 0.24;
            if (ly < oy0 + (oy1 - oy0) * 0.45) break;
            emit(o.a - 0.1, o.b + 0.1, ly, ly + 0.05, "extAccent", -0.42, 0.36);
          }
        }
      }

      // Facade pattern: vertical fins and expressed frame.
      if ((ext.pattern === "fins" || ext.pattern === "grid") && (side === "front" || side === "back")) {
        const pitch = ext.pattern === "fins" ? 1.25 : 4.5;
        const fw = ext.pattern === "fins" ? 0.1 : 0.4;
        const depth = ext.pattern === "fins" ? 0.55 : 0.1;
        const n = Math.floor(len / pitch);
        for (let k = 0; k <= n; k++) {
          const c = (len - n * pitch) / 2 + k * pitch;
          if (f === 0 && side === "front") {
            const doorO = openings.find((o) => o.kind === "door");
            if (doorO && c > doorO.a - 0.4 && c < doorO.b + 0.4) continue;
          }
          emit(Math.max(0, c - fw / 2), Math.min(len, c + fw / 2), 0, H, "extAccent", -depth, depth);
        }
      }
      if (ext.pattern === "grid") {
        emit(0, len, H - 0.35, H, "extAccent", -0.1, 0.1);
      }
    }

    // ── Interior partition walls with doorways ──
    buildPartitions(parts, f, fp, H);

    // ── Exposed roof terraces where the floor above is smaller ──
    if (above) {
      const terraces = subtractRect(rect, above.rect);
      for (const t of terraces) {
        box(parts, "roof", f, t.x, H, t.z, t.x + t.w, H + SLAB, t.z + t.d);
        box(parts, "coping", f, t.x, H + SLAB, t.z, t.x + t.w, H + SLAB + 0.12, t.z + 0.12);
      }
    }

    // ── Balconies on upper floors (front facade) ──
    if (ext.balconies && f >= 1) {
      const bw = Math.min(rect.w * 0.55, 8);
      const bx = rect.x + (rect.w - bw) / 2;
      const fz = rect.z + rect.d;
      const depth = 1.6;
      box(parts, "balcony", f, bx, 0, fz, bx + bw, 0.25, fz + depth);
      box(parts, "railing", f, bx, 0.25, fz + depth - 0.03, bx + bw, 1.3, fz + depth);
      box(parts, "railing", f, bx, 0.25, fz, bx + 0.03, 1.3, fz + depth);
      box(parts, "railing", f, bx + bw - 0.03, 0.25, fz, bx + bw, 1.3, fz + depth);
      box(parts, "handrail", f, bx, 1.3, fz + depth - 0.05, bx + bw, 1.35, fz + depth + 0.01);
    }
  });

  // ── Roof ──
  const top = plan.floors[nFloors - 1] as FloorPlan;
  const R = nFloors;
  const tr = top.rect;
  if (ext.roof === "overhang") {
    const o = 1.4;
    box(parts, "roof", R, tr.x - o, 0, tr.z - o, tr.x + tr.w + o, 0.32, tr.z + tr.d + o);
    box(parts, "coping", R, tr.x - o, 0.32, tr.z - o, tr.x + tr.w + o, 0.36, tr.z + tr.d + o);
  } else {
    box(parts, "roof", R, tr.x, 0, tr.z, tr.x + tr.w, SLAB, tr.z + tr.d);
    const ph = 0.9;
    box(parts, "extWall", R, tr.x, 0, tr.z + tr.d - EXT_T, tr.x + tr.w, ph, tr.z + tr.d);
    box(parts, "extWall", R, tr.x, 0, tr.z, tr.x + tr.w, ph, tr.z + EXT_T);
    box(parts, "extWall", R, tr.x, 0, tr.z + EXT_T, tr.x + EXT_T, ph, tr.z + tr.d - EXT_T);
    box(parts, "extWall", R, tr.x + tr.w - EXT_T, 0, tr.z + EXT_T, tr.x + tr.w, ph, tr.z + tr.d - EXT_T);
    box(parts, "coping", R, tr.x - 0.03, ph, tr.z - 0.03, tr.x + tr.w + 0.03, ph + 0.05, tr.z + EXT_T + 0.03);
    box(parts, "coping", R, tr.x - 0.03, ph, tr.z + tr.d - EXT_T - 0.03, tr.x + tr.w + 0.03, ph + 0.05, tr.z + tr.d + 0.03);
    if (ext.roof === "green") {
      box(parts, "roofGreen", R, tr.x + EXT_T, SLAB, tr.z + EXT_T, tr.x + tr.w - EXT_T, SLAB + 0.18, tr.z + tr.d - EXT_T);
    }
  }

  // ── Bounds ──
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const fp of plan.floors) {
    minX = Math.min(minX, fp.rect.x); maxX = Math.max(maxX, fp.rect.x + fp.rect.w);
    minZ = Math.min(minZ, fp.rect.z); maxZ = Math.max(maxZ, fp.rect.z + fp.rect.d);
  }
  const center: [number, number] = [(minX + maxX) / 2, (minZ + maxZ) / 2];

  // ── Site: terrace, path, pool ──
  const g = plan.floors[0] as FloorPlan;
  const S = -1;
  const frontZ = g.rect.z + g.rect.d;
  box(parts, "paving", S, minX - 1.5, 0, frontZ, maxX + 1.5, 0.06, frontZ + 3);
  const pathHalf = 0.9;
  box(parts, "paving", S, plan.entranceX - pathHalf, 0, frontZ + 3, plan.entranceX + pathHalf, 0.05, center[1] + plan.site.d / 2);
  const poolRect = config.environment.pool ? plan.pool : undefined;
  if (poolRect) {
    const p = poolRect, e = 0.6;
    box(parts, "paving", S, p.x - e - 0.6, 0, p.z - e, p.x + p.w + e, 0.07, p.z);
    box(parts, "paving", S, p.x - e - 0.6, 0, p.z + p.d, p.x + p.w + e, 0.07, p.z + p.d + e);
    box(parts, "paving", S, p.x - e - 0.6, 0, p.z, p.x, 0.07, p.z + p.d);
    box(parts, "paving", S, p.x + p.w, 0, p.z, p.x + p.w + e, 0.07, p.z + p.d);
    box(parts, "poolLining", S, p.x, -0.02, p.z, p.x + p.w, 0.0, p.z + p.d);
    box(parts, "water", S, p.x, 0.0, p.z, p.x + p.w, 0.035, p.z + p.d);
  }

  // ── Landscape (deterministic) ──
  const trees: Tree[] = [];
  if (config.environment.garden) {
    const rand = rng(plan.id);
    const keepOut: Rect[] = [
      { x: minX - 3, z: minZ - 3, w: maxX - minX + 6, d: maxZ - minZ + 7 },
      { x: plan.entranceX - 2, z: frontZ, w: 4, d: plan.site.d },
      ...(poolRect ? [{ x: poolRect.x - 2, z: poolRect.z - 2, w: poolRect.w + 4, d: poolRect.d + 4 }] : []),
    ];
    // Keep sight lines to the standard camera viewpoints clear (overview, street, side, garden).
    const viewDirs = [[1.1, 1.4], [0, 1], [1.8, 0.25], [-0.9, -1.45]].map(([vx, vz]) => Math.atan2(vz as number, vx as number));
    const blocksView = (x: number, z: number) => {
      const a = Math.atan2(z - center[1], x - center[0]);
      return viewDirs.some((v) => {
        let d = Math.abs(a - v);
        if (d > Math.PI) d = 2 * Math.PI - d;
        return d < 0.42;
      });
    };
    const inside = (x: number, z: number) =>
      blocksView(x, z) || keepOut.some((k) => x > k.x && x < k.x + k.w && z > k.z && z < k.z + k.d);
    const halfW = plan.site.w / 2 - 2, halfD = plan.site.d / 2 - 2;
    let attempts = 0;
    while (trees.length < 46 && attempts < 600) {
      attempts++;
      const x = center[0] + (rand() * 2 - 1) * halfW;
      const z = center[1] + (rand() * 2 - 1) * halfD;
      if (inside(x, z)) continue;
      if (trees.some((t) => (t.x - x) ** 2 + (t.z - z) ** 2 < 6)) continue;
      const k = rand();
      trees.push({ x: round(x), z: round(z), scale: round(0.75 + rand() * 0.6), kind: k < 0.45 ? "shrub" : k < 0.75 ? "tree" : "cypress" });
    }
  }

  const outdoorLights: PointSpec[] = [];
  if (config.environment.outdoorLights) {
    const end = center[1] + plan.site.d / 2 - 1;
    for (let z = frontZ + 4; z < end; z += 3.5) {
      outdoorLights.push({ x: plan.entranceX - 1.3, y: 0.5, z, floor: -1 });
      outdoorLights.push({ x: plan.entranceX + 1.3, y: 0.5, z, floor: -1 });
    }
    outdoorLights.push({ x: minX - 1, y: 0.4, z: frontZ + 1, floor: -1 }, { x: maxX + 1, y: 0.4, z: frontZ + 1, floor: -1 });
  }

  const grossFloorArea = plan.floors.reduce((s, fp) => s + fp.rect.w * fp.rect.d, 0);
  const stats: BuildingStats = {
    floors: nFloors,
    rooms: rooms.filter((rm) => rm.type !== "stair" && rm.type !== "landing").length,
    bedrooms: rooms.filter((rm) => rm.type === "bedroom").length,
    grossFloorArea: Math.round(grossFloorArea),
    footprintArea: Math.round(g.rect.w * g.rect.d),
    facadeArea: Math.round(facadeArea),
    glazingArea: Math.round(glazingArea),
    glazingRatio: facadeArea > 0 ? Math.round((glazingArea / facadeArea) * 100) / 100 : 0,
    height: Math.round((roofElevation + (ext.roof === "overhang" ? 0.36 : 0.95)) * 10) / 10,
  };

  return {
    planId: plan.id,
    parts,
    rooms,
    floors,
    roofElevation,
    center,
    size: [maxX - minX, stats.height, maxZ - minZ],
    trees,
    outdoorLights,
    interiorLights,
    stats,
  };
}

// ───────────────────────────── partitions ─────────────────────────────

const OPEN_TYPES = new Set<RoomType>(["living", "entry", "lobby", "dining", "kitchen", "landing", "openOffice", "cafe", "retail", "stair"]);

interface Edge { room: RoomPlan; a: number; b: number }

function buildPartitions(parts: Part[], f: number, fp: FloorPlan, H: number) {
  const { rect } = fp;
  // Collect interior edges grouped by line. Key: "x:<coord>" (wall parallel to z) or "z:<coord>".
  const lines = new Map<string, Edge[]>();
  const add = (key: string, e: Edge) => {
    const list = lines.get(key) ?? [];
    list.push(e);
    lines.set(key, list);
  };
  const eps = 0.001;
  for (const room of fp.rooms) {
    const x0 = room.x, x1 = room.x + room.w, z0 = room.z, z1 = room.z + room.d;
    if (Math.abs(z0 - rect.z) > eps) add(`z:${round(z0)}`, { room, a: x0, b: x1 });
    if (Math.abs(z1 - (rect.z + rect.d)) > eps) add(`z:${round(z1)}`, { room, a: x0, b: x1 });
    if (Math.abs(x0 - rect.x) > eps) add(`x:${round(x0)}`, { room, a: z0, b: z1 });
    if (Math.abs(x1 - (rect.x + rect.w)) > eps) add(`x:${round(x1)}`, { room, a: z0, b: z1 });
  }

  for (const [key, edges] of lines) {
    const axis = key[0] as "x" | "z";
    const coord = Number(key.slice(2));
    // Atomic segments from all endpoints on this line.
    const pts = [...new Set(edges.flatMap((e) => [round(e.a), round(e.b)]))].sort((p, q) => p - q);
    for (let i = 0; i < pts.length - 1; i++) {
      let a = pts[i] as number;
      let b = pts[i + 1] as number;
      const mid = (a + b) / 2;
      const owners = edges.filter((e) => e.a <= mid && e.b >= mid).map((e) => e.room);
      if (owners.length === 0) continue;
      // Trim at the exterior walls.
      const lo = axis === "z" ? rect.x : rect.z;
      const hi = axis === "z" ? rect.x + rect.w : rect.z + rect.d;
      if (Math.abs(a - lo) < eps) a += EXT_T;
      if (Math.abs(b - hi) < eps) b -= EXT_T;
      const len = b - a;
      if (len <= 0.05) continue;

      const bothOpen = owners.length >= 2 && owners.every((o) => OPEN_TYPES.has(o.type));
      const stairToRoom = owners.some((o) => o.type === "stair" || o.type === "landing");
      const openings: Opening[] = [];
      if (bothOpen && len > 1.6) {
        const w = Math.min(len - 0.6, Math.max(1.6, len * 0.7));
        openings.push({ a: (len - w) / 2, b: (len + w) / 2, bottom: 0, top: Math.min(2.6, H - SLAB - 0.3), kind: "pass" });
      } else if (owners.length >= 2 && len >= 1.4 && !(stairToRoom && owners.every((o) => o.type === "stair"))) {
        const w = 0.95;
        openings.push({ a: len / 2 - w / 2, b: len / 2 + w / 2, bottom: 0, top: 2.15, kind: "pass" });
      }

      wallWithOpenings(len, SLAB, H, openings, (a0, a1, y0, y1) => {
        if (axis === "z") box(parts, "intWall", f, a + a0, y0, coord - INT_T / 2, a + a1, y1, coord + INT_T / 2);
        else box(parts, "intWall", f, coord - INT_T / 2, y0, a + a0, coord + INT_T / 2, y1, a + a1);
      });
    }
  }
}

/** Plain-language summary used by the studio's project summary and quote requests. */
export function summarizeModel(model: BuildingModel): string[] {
  const s = model.stats;
  return [
    `${s.floors} ${s.floors === 1 ? "storey" : "storeys"}, approximately ${s.height} m high`,
    `${s.grossFloorArea} m² gross floor area on a ${s.footprintArea} m² footprint`,
    `${s.rooms} rooms${s.bedrooms ? `, including ${s.bedrooms} bedroom${s.bedrooms > 1 ? "s" : ""}` : ""}`,
    `${s.glazingArea} m² of glazing (${Math.round(s.glazingRatio * 100)}% of facade area)`,
  ];
}
