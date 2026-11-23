/**
 * Cinematic timeline: 8 scenes, 9 keyframes. Scene i interpolates keyframe i → i+1.
 * Pure data + maths (no three.js) so it can be unit tested.
 */
import type { BuildingConfig } from "@/three/config";
import type { BuildingModel } from "@/three/generate";

export interface Keyframe {
  /** Camera position/target as multiples of building radius R and height H. */
  pos: [number, number, number];
  target: [number, number, number];
  explode: number;
  cutaway: number;
  /** Fraction of building height for a section cut, or null. */
  section: number | null;
  time: number;
}

export interface SceneCopy {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
}

export const SCENES: SceneCopy[] = [
  { id: "reveal", eyebrow: "01 — Reveal", title: "Architecture you can walk into before it is built.", body: "We design residential, commercial and interior projects, and let you explore every one of them in real-time 3D, from the facade to the furniture." },
  { id: "exterior", eyebrow: "02 — Exterior", title: "Material honesty, down to the joint.", body: "Travertine blocks, board-formed concrete, anodised frames. Every surface is modelled at real scale, so what you approve is what gets specified." },
  { id: "transformation", eyebrow: "03 — Transformation", title: "Peel back the facade.", body: "Cut through the street elevation to see how structure, glazing and rooms relate: the same way we review designs in the studio." },
  { id: "structure", eyebrow: "04 — Structure", title: "Every floor, in order.", body: "Floors separate to reveal slabs, stair voids and room organisation. Areas and glazing ratios are calculated from the same model." },
  { id: "interior", eyebrow: "05 — Interior", title: "Step inside.", body: "Stand in the living room at eye level, with furniture and lighting placed to the plan, before a single wall is built." },
  { id: "materials", eyebrow: "06 — Materials", title: "Change the palette, not the plan.", body: "Swap stone for concrete or brick and the whole building updates. In the design studio you make these choices yourself." },
  { id: "environment", eyebrow: "07 — Environment", title: "From first light to after dark.", body: "Sun path, shadows and interior lighting are simulated through the day, so orientation and shading decisions are visible early." },
  { id: "presentation", eyebrow: "08 — Your project", title: "Let’s design yours.", body: "Book a consultation with an architect, start a design in the studio, or describe your site to the AI assistant for a preliminary brief." },
];

// K0 … K8
export const KEYFRAMES: Keyframe[] = [
  { pos: [1.7, 0.35, 2.3], target: [0.0, 0.42, 0], explode: 0, cutaway: 0, section: null, time: 17.4 },
  { pos: [1.05, 0.62, 1.35], target: [-0.08, 0.38, 0], explode: 0, cutaway: 0, section: null, time: 17.0 },
  { pos: [-0.3, 0.2, 0.95], target: [0.25, 0.42, 0.2], explode: 0, cutaway: 0, section: null, time: 16.5 },
  { pos: [0.55, 0.75, 1.45], target: [0.0, 0.32, 0], explode: 0, cutaway: 1, section: null, time: 16.5 },
  { pos: [1.15, 1.6, 1.25], target: [0.0, 0.55, 0], explode: 1, cutaway: 1, section: null, time: 15.5 },
  { pos: [0, 0, 0], target: [0, 0, 0], explode: 0, cutaway: 0, section: null, time: 16.2 }, // interior (computed)
  { pos: [0.95, 0.45, 1.2], target: [-0.05, 0.35, 0], explode: 0, cutaway: 0, section: null, time: 16.8 },
  { pos: [-1.05, 0.7, 1.45], target: [0.05, 0.35, 0], explode: 0, cutaway: 0, section: null, time: 21.0 },
  { pos: [1.15, 0.55, 1.5], target: [0.1, 0.36, 0], explode: 0, cutaway: 0, section: null, time: 17.2 },
];

export const MATERIAL_VARIANTS: Partial<BuildingConfig["exterior"]>[] = [
  {},
  { wall: "concrete", accent: "basalt", pattern: "louvers", glass: "grey", frames: "black", roof: "green" },
  { wall: "brick", accent: "timber", pattern: "fins", glass: "clear", frames: "bronze", roof: "flat" },
];

export const smoothstep = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface CinematicState {
  scene: number;
  local: number;
  position: [number, number, number];
  target: [number, number, number];
  explode: number;
  cutaway: number;
  section: number | null;
  time: number;
  materialVariant: number;
}

/** World-space pose of the interior keyframe, derived from the plan's main living room. */
function interiorPose(model: BuildingModel): { pos: [number, number, number]; target: [number, number, number] } {
  const room = model.rooms.find((r) => r.floor === 0 && (r.type === "living" || r.type === "lobby")) ?? model.rooms[0];
  if (!room) return { pos: [0, 2, 10], target: [0, 1.5, 0] };
  const cx = room.rect.x + room.rect.w / 2 - model.center[0];
  const z0 = room.rect.z - model.center[1];
  return {
    pos: [cx + room.rect.w * 0.4, 1.65, z0 + 0.7],
    target: [cx - room.rect.w * 0.12, 1.3, z0 + room.rect.d],
  };
}

/**
 * Evaluate the timeline at global progress p ∈ [0,1].
 * `aspect` (width/height) pushes the camera back on portrait screens so the building still fits.
 * `reduced` snaps each scene to its final keyframe (no continuous motion).
 */
export function evaluate(p: number, model: BuildingModel, aspect: number, reduced = false): CinematicState {
  const n = SCENES.length;
  const clamped = Math.min(0.99999, Math.max(0, p));
  const scene = Math.floor(clamped * n);
  const rawLocal = clamped * n - scene;
  const local = reduced ? 1 : rawLocal;
  const e = smoothstep(local);

  const [W, H, D] = model.size;
  const R = Math.max(W, D, H * 1.5, 10);
  const portrait = aspect < 1 ? Math.pow(1 / aspect, 0.7) : 1;
  const interior = interiorPose(model);

  const resolve = (k: Keyframe, i: number) => {
    if (i === 5) return { pos: interior.pos, target: interior.target };
    return {
      pos: [k.pos[0] * R * portrait, Math.max(1.2, k.pos[1] * R), k.pos[2] * R * portrait] as [number, number, number],
      target: [k.target[0] * R, k.target[1] * H, k.target[2] * R] as [number, number, number],
    };
  };
  const a = KEYFRAMES[scene] as Keyframe, b = KEYFRAMES[scene + 1] as Keyframe;
  const pa = resolve(a, scene), pb = resolve(b, scene + 1);

  // Entering the interior: keep the facade cut while the camera passes through, then restore it.
  let cutaway = lerp(a.cutaway, b.cutaway, e);
  if (scene === 4) cutaway = local < 0.85 ? Math.max(cutaway, 1 - smoothstep(Math.max(0, (local - 0.55) / 0.3))) : 0;

  let time = lerp(a.time, b.time, e);
  if (scene === 6) time = lerp(6.4, 21.4, reduced ? 1 : local); // full day sweep
  const materialVariant = scene === 5 ? Math.min(2, Math.floor((reduced ? 0.99 : rawLocal) * 3)) : 0;

  return {
    scene,
    local: rawLocal,
    position: [lerp(pa.pos[0], pb.pos[0], e), lerp(pa.pos[1], pb.pos[1], e), lerp(pa.pos[2], pb.pos[2], e)],
    target: [lerp(pa.target[0], pb.target[0], e), lerp(pa.target[1], pb.target[1], e), lerp(pa.target[2], pb.target[2], e)],
    explode: lerp(a.explode, b.explode, e),
    cutaway,
    section: null,
    time: Math.round(time * 4) / 4,
    materialVariant,
  };
}
