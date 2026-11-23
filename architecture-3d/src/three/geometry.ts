/**
 * Builds merged BufferGeometries from box parts. All boxes that share a floor and material slot
 * become one draw call. UVs are projected in world metres (with floor elevation) so textures are
 * continuous across adjacent wall pieces and scale correctly.
 */
import * as THREE from "three";
import type { Part, Slot } from "./generate";

// Per face: normal, and the 4 corners as (sx, sy, sz) signs, ordered for CCW winding.
const FACES: { n: [number, number, number]; c: [number, number, number][] }[] = [
  { n: [1, 0, 0], c: [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]] },
  { n: [-1, 0, 0], c: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]] },
  { n: [0, 1, 0], c: [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]] },
  { n: [0, -1, 0], c: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]] },
  { n: [0, 0, 1], c: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]] },
  { n: [0, 0, -1], c: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]] },
];

export function buildBoxesGeometry(parts: Part[], elevation = 0): THREE.BufferGeometry {
  const count = parts.length;
  const pos = new Float32Array(count * 24 * 3);
  const nor = new Float32Array(count * 24 * 3);
  const uv = new Float32Array(count * 24 * 2);
  const index = count * 24 > 65535 ? new Uint32Array(count * 36) : new Uint16Array(count * 36);
  let v = 0, i = 0;
  for (const part of parts) {
    const [cx, cy, cz] = part.p;
    const hx = part.s[0] / 2, hy = part.s[1] / 2, hz = part.s[2] / 2;
    for (const face of FACES) {
      const base = v;
      for (const [sx, sy, sz] of face.c) {
        const x = cx + sx * hx, y = cy + sy * hy, z = cz + sz * hz;
        pos[v * 3] = x; pos[v * 3 + 1] = y; pos[v * 3 + 2] = z;
        nor[v * 3] = face.n[0]; nor[v * 3 + 1] = face.n[1]; nor[v * 3 + 2] = face.n[2];
        const wy = y + elevation;
        if (face.n[0] !== 0) { uv[v * 2] = z * -face.n[0]; uv[v * 2 + 1] = wy; }
        else if (face.n[1] !== 0) { uv[v * 2] = x; uv[v * 2 + 1] = z; }
        else { uv[v * 2] = x * face.n[2]; uv[v * 2 + 1] = wy; }
        v++;
      }
      index[i++] = base; index[i++] = base + 1; index[i++] = base + 2;
      index[i++] = base; index[i++] = base + 2; index[i++] = base + 3;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setIndex(new THREE.BufferAttribute(index, 1));
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

export interface SlotBatch {
  slot: Slot;
  geometry: THREE.BufferGeometry;
}

const SLOT_ORDER: Slot[] = [
  "slab", "extWall", "extAccent", "intWall", "ceiling", "frame", "door", "roof", "roofGreen", "coping", "balcony",
  "stair", "handrail", "fabric", "fabricAlt", "wood", "metal", "stoneTop", "rug", "lamp", "paving", "poolLining", "water",
  "railing", "glass",
];

/** Group parts by slot (excluding per-room floor finishes, which stay separate for picking). */
export function batchBySlot(parts: Part[], elevation: number, exclude: Set<Slot>): SlotBatch[] {
  const groups = new Map<Slot, Part[]>();
  for (const p of parts) {
    if (exclude.has(p.slot)) continue;
    const list = groups.get(p.slot) ?? [];
    list.push(p);
    groups.set(p.slot, list);
  }
  return SLOT_ORDER.filter((s) => groups.has(s)).map((slot) => ({
    slot,
    geometry: buildBoxesGeometry(groups.get(slot) as Part[], elevation),
  }));
}

export const FURNITURE_SLOTS = new Set<Slot>(["fabric", "fabricAlt", "wood", "metal", "stoneTop", "rug"]);
export const TRANSPARENT_SLOTS = new Set<Slot>(["glass", "railing", "water"]);
