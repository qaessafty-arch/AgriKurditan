/**
 * Procedural PBR textures drawn on canvas. Each texture represents a known physical size in metres
 * (`meters`), and geometry carries world-space UVs in metres, so `repeat = 1 / meters` gives
 * correctly scaled stone joints, boards and planks everywhere without seams.
 */
import * as THREE from "three";

export interface TexturePair {
  map: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
  meters: number;
}

type Painter = (ctx: CanvasRenderingContext2D, size: number, rand: () => number) => void;

const cache = new Map<string, TexturePair>();
let anisotropy = 4;

export function setTextureAnisotropy(value: number) {
  anisotropy = Math.max(1, Math.min(16, value));
}

function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + amount * 255)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

function grain(ctx: CanvasRenderingContext2D, size: number, rand: () => number, strength: number, count = size * size * 0.35) {
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < count; i++) {
    const p = ((rand() * size) | 0) * size + ((rand() * size) | 0);
    const n = (rand() - 0.5) * strength * 255;
    d[p * 4] = (d[p * 4] ?? 0) + n;
    d[p * 4 + 1] = (d[p * 4 + 1] ?? 0) + n;
    d[p * 4 + 2] = (d[p * 4 + 2] ?? 0) + n;
  }
  ctx.putImageData(img, 0, 0);
}

function blotches(ctx: CanvasRenderingContext2D, size: number, rand: () => number, color: string, n: number, alpha: number, rMax: number) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = alpha * rand();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(rand() * size, rand() * size, rand() * rMax + 2, rand() * rMax * 0.6 + 1, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

const painters: Record<string, { meters: number; paint: Painter }> = {
  plaster: {
    meters: 2,
    paint: (ctx, s, rand) => {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, s, s);
      blotches(ctx, s, rand, "#d8d8d8", 260, 0.18, s * 0.08);
      grain(ctx, s, rand, 0.06);
    },
  },
  travertine: {
    meters: 2.4, // blocks 1.2 m × 0.6 m
    paint: (ctx, s, rand) => {
      ctx.fillStyle = "#d7c9ae"; ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 140; i++) {
        const y = rand() * s;
        ctx.strokeStyle = rand() > 0.5 ? "rgba(255,248,232,0.35)" : "rgba(150,125,90,0.22)";
        ctx.lineWidth = rand() * 3 + 0.5;
        ctx.beginPath(); ctx.moveTo(0, y);
        for (let x = 0; x <= s; x += s / 8) ctx.lineTo(x, y + (rand() - 0.5) * 3);
        ctx.stroke();
      }
      blotches(ctx, s, rand, "#9c8463", 220, 0.35, 3);
      ctx.fillStyle = "rgba(90,74,52,0.55)";
      const rows = 4, cols = 2;
      for (let r = 0; r <= rows; r++) ctx.fillRect(0, (r * s) / rows - 1, s, 2);
      for (let r = 0; r < rows; r++) for (let c = 0; c <= cols; c++) {
        const off = r % 2 ? s / cols / 2 : 0;
        ctx.fillRect(((c * s) / cols + off) % s - 1, (r * s) / rows, 2, s / rows);
      }
      grain(ctx, s, rand, 0.07);
    },
  },
  limestone: {
    meters: 2.4,
    paint: (ctx, s, rand) => {
      ctx.fillStyle = "#d3ccbb"; ctx.fillRect(0, 0, s, s);
      const rows = 6;
      for (let r = 0; r < rows; r++) {
        const cols = 3;
        for (let c = 0; c < cols + 1; c++) {
          const off = r % 2 ? s / cols / 2 : 0;
          const x = (c * s) / cols - off, y = (r * s) / rows;
          ctx.fillStyle = shade("#d3ccbb", (rand() - 0.5) * 0.08);
          ctx.fillRect(x + 2, y + 2, s / cols - 4, s / rows - 4);
        }
      }
      blotches(ctx, s, rand, "#a89c84", 160, 0.25, 6);
      grain(ctx, s, rand, 0.08);
    },
  },
  concrete: {
    meters: 2.4, // 0.15 m boards
    paint: (ctx, s, rand) => {
      ctx.fillStyle = "#a7a49e"; ctx.fillRect(0, 0, s, s);
      const boards = 16;
      for (let i = 0; i < boards; i++) {
        ctx.fillStyle = shade("#a7a49e", (rand() - 0.5) * 0.07);
        ctx.fillRect(0, (i * s) / boards, s, s / boards);
        ctx.fillStyle = "rgba(60,58,55,0.25)";
        ctx.fillRect(0, (i * s) / boards, s, 1);
        for (let g = 0; g < 6; g++) {
          ctx.strokeStyle = "rgba(255,255,255,0.06)";
          ctx.beginPath();
          const y = (i * s) / boards + rand() * (s / boards);
          ctx.moveTo(0, y); ctx.bezierCurveTo(s / 3, y + 2, (2 * s) / 3, y - 2, s, y); ctx.stroke();
        }
      }
      ctx.fillStyle = "rgba(50,50,50,0.45)";
      for (let x = 0.125; x < 1; x += 0.25) for (let y = 0.125; y < 1; y += 0.25) {
        ctx.beginPath(); ctx.arc(x * s, y * s, 2.2, 0, Math.PI * 2); ctx.fill();
      }
      blotches(ctx, s, rand, "#7b7873", 120, 0.2, 10);
      grain(ctx, s, rand, 0.1);
    },
  },
  brick: {
    meters: 1.38, // 6 courses × 0.23 m wide bricks
    paint: (ctx, s, rand) => {
      ctx.fillStyle = "#cfc6b8"; ctx.fillRect(0, 0, s, s);
      const rows = 20, cols = 6;
      for (let r = 0; r < rows; r++) for (let c = -1; c < cols + 1; c++) {
        const off = r % 2 ? s / cols / 2 : 0;
        ctx.fillStyle = shade("#9b5c40", (rand() - 0.5) * 0.14);
        ctx.fillRect((c * s) / cols + off + 1.5, (r * s) / rows + 1.5, s / cols - 3, s / rows - 3);
      }
      grain(ctx, s, rand, 0.1);
    },
  },
  timber: {
    meters: 1.4, // 0.14 m boards
    paint: (ctx, s, rand) => {
      const boards = 10;
      for (let i = 0; i < boards; i++) {
        ctx.fillStyle = shade("#8b653f", (rand() - 0.5) * 0.12);
        ctx.fillRect((i * s) / boards, 0, s / boards, s);
        for (let g = 0; g < 14; g++) {
          ctx.strokeStyle = `rgba(60,38,20,${0.1 + rand() * 0.15})`;
          ctx.lineWidth = rand() * 1.5 + 0.3;
          const x = (i * s) / boards + rand() * (s / boards);
          ctx.beginPath(); ctx.moveTo(x, 0);
          ctx.bezierCurveTo(x + (rand() - 0.5) * 6, s / 3, x + (rand() - 0.5) * 6, (2 * s) / 3, x, s); ctx.stroke();
        }
        ctx.fillStyle = "rgba(30,20,10,0.6)";
        ctx.fillRect((i * s) / boards, 0, 2, s);
      }
    },
  },
  basalt: {
    meters: 1.2,
    paint: (ctx, s, rand) => {
      ctx.fillStyle = "#38393c"; ctx.fillRect(0, 0, s, s);
      blotches(ctx, s, rand, "#202124", 300, 0.4, 3);
      ctx.fillStyle = "rgba(10,10,10,0.6)";
      ctx.fillRect(0, s / 2 - 1, s, 2); ctx.fillRect(0, 0, s, 1);
      ctx.fillRect(s / 2 - 1, 0, 2, s);
      grain(ctx, s, rand, 0.1);
    },
  },
  oak: {
    meters: 2.0,
    paint: (ctx, s, rand) => planks(ctx, s, rand, "#b48d5f", 10),
  },
  walnut: {
    meters: 2.0,
    paint: (ctx, s, rand) => planks(ctx, s, rand, "#5c3f2c", 10),
  },
  marble: {
    meters: 2.4,
    paint: (ctx, s, rand) => {
      ctx.fillStyle = "#ebe8e3"; ctx.fillRect(0, 0, s, s);
      for (let v = 0; v < 18; v++) {
        ctx.strokeStyle = `rgba(110,110,115,${0.12 + rand() * 0.25})`;
        ctx.lineWidth = rand() * 2.2 + 0.3;
        ctx.beginPath();
        let x = rand() * s, y = 0;
        ctx.moveTo(x, y);
        while (y < s) { x += (rand() - 0.45) * 26; y += rand() * 24 + 6; ctx.lineTo(x, y); }
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(120,120,120,0.35)";
      ctx.fillRect(0, s / 2, s, 1); ctx.fillRect(s / 2, 0, 1, s);
      grain(ctx, s, rand, 0.03);
    },
  },
  terrazzo: {
    meters: 1.2,
    paint: (ctx, s, rand) => {
      ctx.fillStyle = "#dcd6cb"; ctx.fillRect(0, 0, s, s);
      const chips = ["#8d8478", "#b9a58b", "#5f6a66", "#f4f1ea", "#a2765a"];
      for (let i = 0; i < 1300; i++) {
        ctx.fillStyle = chips[(rand() * chips.length) | 0] as string;
        ctx.beginPath();
        const r = rand() * 3 + 0.6;
        ctx.ellipse(rand() * s, rand() * s, r, r * (0.5 + rand() * 0.5), rand() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      grain(ctx, s, rand, 0.04);
    },
  },
  polished: {
    meters: 3,
    paint: (ctx, s, rand) => {
      ctx.fillStyle = "#a9a59f"; ctx.fillRect(0, 0, s, s);
      blotches(ctx, s, rand, "#8e8a84", 160, 0.25, 22);
      blotches(ctx, s, rand, "#c4c0ba", 120, 0.2, 16);
      grain(ctx, s, rand, 0.05);
    },
  },
  tile: {
    meters: 2.4, // 1.2 m tiles
    paint: (ctx, s, rand) => {
      ctx.fillStyle = "#dcd8cf"; ctx.fillRect(0, 0, s, s);
      blotches(ctx, s, rand, "#c8c3b9", 80, 0.25, 20);
      ctx.fillStyle = "rgba(120,115,105,0.6)";
      ctx.fillRect(0, 0, s, 2); ctx.fillRect(0, s / 2 - 1, s, 2);
      ctx.fillRect(0, 0, 2, s); ctx.fillRect(s / 2 - 1, 0, 2, s);
      grain(ctx, s, rand, 0.03);
    },
  },
  slats: {
    meters: 1.0,
    paint: (ctx, s, rand) => {
      ctx.fillStyle = "#2a1d12"; ctx.fillRect(0, 0, s, s);
      const n = 10;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = shade("#a07a4f", (rand() - 0.5) * 0.1);
        ctx.fillRect((i * s) / n + 3, 0, s / n - 6, s);
      }
    },
  },
  grass: {
    meters: 4,
    paint: (ctx, s, rand) => {
      ctx.fillStyle = "#56703c"; ctx.fillRect(0, 0, s, s);
      blotches(ctx, s, rand, "#6c8a47", 500, 0.35, 14);
      blotches(ctx, s, rand, "#3f5630", 400, 0.3, 10);
      grain(ctx, s, rand, 0.12, s * s);
    },
  },
  gravel: {
    meters: 3,
    paint: (ctx, s, rand) => {
      ctx.fillStyle = "#b9ad97"; ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 2600; i++) {
        ctx.fillStyle = shade("#b0a38b", (rand() - 0.5) * 0.3);
        ctx.beginPath();
        ctx.ellipse(rand() * s, rand() * s, rand() * 3 + 1, rand() * 2.4 + 0.8, rand() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  meadow: {
    meters: 5,
    paint: (ctx, s, rand) => {
      ctx.fillStyle = "#9c955f"; ctx.fillRect(0, 0, s, s);
      blotches(ctx, s, rand, "#7a7a45", 400, 0.4, 16);
      blotches(ctx, s, rand, "#c2b37b", 300, 0.35, 12);
      grain(ctx, s, rand, 0.14, s * s);
    },
  },
  pavers: {
    meters: 1.8, // 0.6 × 0.9 m pavers
    paint: (ctx, s, rand) => {
      ctx.fillStyle = "#77736b"; ctx.fillRect(0, 0, s, s);
      const rows = 3, cols = 2;
      for (let r = 0; r < rows; r++) for (let c = -1; c < cols + 1; c++) {
        const off = r % 2 ? s / cols / 2 : 0;
        ctx.fillStyle = shade("#cfc8ba", (rand() - 0.5) * 0.08);
        ctx.fillRect((c * s) / cols + off + 2, (r * s) / rows + 2, s / cols - 4, s / rows - 4);
      }
      grain(ctx, s, rand, 0.07);
    },
  },
  poolTile: {
    meters: 0.6,
    paint: (ctx, s, rand) => {
      ctx.fillStyle = "#e6eef0"; ctx.fillRect(0, 0, s, s);
      const n = 8;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        ctx.fillStyle = shade("#5ea3b0", (rand() - 0.5) * 0.12);
        ctx.fillRect((i * s) / n + 2, (j * s) / n + 2, s / n - 4, s / n - 4);
      }
    },
  },
  ripples: {
    meters: 3,
    paint: (ctx, s, rand) => {
      ctx.fillStyle = "#808080"; ctx.fillRect(0, 0, s, s);
      blotches(ctx, s, rand, "#9a9a9a", 400, 0.35, 18);
      blotches(ctx, s, rand, "#666666", 400, 0.35, 18);
    },
  },
};

function planks(ctx: CanvasRenderingContext2D, s: number, rand: () => number, base: string, rows: number) {
  for (let r = 0; r < rows; r++) {
    const y = (r * s) / rows;
    let x = -rand() * s * 0.5;
    while (x < s) {
      const len = s * (0.35 + rand() * 0.4);
      ctx.fillStyle = shade(base, (rand() - 0.5) * 0.12);
      ctx.fillRect(x, y, len, s / rows);
      for (let g = 0; g < 7; g++) {
        ctx.strokeStyle = `rgba(40,25,12,${0.06 + rand() * 0.12})`;
        ctx.lineWidth = rand() + 0.3;
        const gy = y + rand() * (s / rows);
        ctx.beginPath(); ctx.moveTo(x, gy);
        ctx.bezierCurveTo(x + len / 3, gy + (rand() - 0.5) * 4, x + (2 * len) / 3, gy + (rand() - 0.5) * 4, x + len, gy);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(20,12,6,0.45)";
      ctx.fillRect(x, y, 1.5, s / rows);
      x += len;
    }
    ctx.fillStyle = "rgba(20,12,6,0.5)";
    ctx.fillRect(0, y, s, 1.5);
  }
  grain(ctx, s, rand, 0.04);
}

/** Get (and cache) a texture pair. `size` is the canvas resolution, chosen by quality tier. */
export function getTexture(name: keyof typeof painters, size: number): TexturePair {
  const key = `${name}@${size}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const def = painters[name];
  if (!def) throw new Error(`Unknown texture ${name}`);

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas unavailable");
  let seed = 0;
  for (const ch of name) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
  def.paint(ctx, size, seeded(seed));

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  // Grayscale copy for bump mapping.
  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext("2d");
  if (bctx) {
    bctx.filter = "grayscale(1) contrast(1.4)";
    bctx.drawImage(canvas, 0, 0);
  }
  const bump = new THREE.CanvasTexture(bumpCanvas);
  for (const t of [map, bump]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / def.meters, 1 / def.meters);
    t.anisotropy = anisotropy;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
  }
  const pair = { map, bump, meters: def.meters };
  cache.set(key, pair);
  return pair;
}

export type TextureName = keyof typeof painters;

export function disposeTextureCache() {
  for (const { map, bump } of cache.values()) { map.dispose(); bump.dispose(); }
  cache.clear();
}
