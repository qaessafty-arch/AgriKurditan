/**
 * Front elevation drawn as SVG directly from the building model. Used as the no-WebGL fallback
 * and as a lightweight preview. Server-renderable (no three.js).
 */
import type { BuildingModel } from "@/three/generate";

export function ElevationDrawing({ model, className, title }: { model: BuildingModel; className?: string; title?: string }) {
  const minX = Math.min(...model.floors.map((f) => f.rect.x));
  const maxX = Math.max(...model.floors.map((f) => f.rect.x + f.rect.w));
  const H = model.stats.height + 1.2;
  const pad = 2;
  const W = maxX - minX + pad * 2;
  const vbH = H + 1.5;
  const y = (v: number) => vbH - 1 - v;

  // Front-facing glass/door/frame parts approximate the facade openings.
  const frontParts = model.parts.filter((p) => {
    if (p.floor < 0) return false;
    if (!["glass", "door", "extAccent"].includes(p.slot)) return false;
    const fp = model.floors[p.floor];
    if (!fp) return p.slot === "extAccent";
    return Math.abs(p.p[2] + p.s[2] / 2 - (fp.rect.z + fp.rect.d)) < 0.7 && p.s[0] > p.s[2];
  });

  return (
    <svg viewBox={`0 0 ${W} ${vbH}`} className={className} role="img" aria-label={title ?? "Front elevation drawing"} preserveAspectRatio="xMidYMid meet">
      <title>{title ?? "Front elevation drawing"}</title>
      <line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke="currentColor" strokeOpacity={0.5} strokeWidth={0.06} />
      {model.floors.map((f) => (
        <rect key={f.index} x={f.rect.x - minX + pad} y={y(f.elevation + f.height)} width={f.rect.w} height={f.height}
          fill="currentColor" fillOpacity={0.08} stroke="currentColor" strokeOpacity={0.7} strokeWidth={0.05} />
      ))}
      {frontParts.map((p, i) => {
        const fp = model.floors[p.floor];
        const elev = fp ? fp.elevation : model.roofElevation;
        return (
          <rect key={i} x={p.p[0] - p.s[0] / 2 - minX + pad} y={y(elev + p.p[1] + p.s[1] / 2)} width={p.s[0]} height={p.s[1]}
            fill={p.slot === "glass" ? "#78918A" : "currentColor"} fillOpacity={p.slot === "glass" ? 0.45 : 0.25} />
        );
      })}
      <rect x={pad + (model.floors[model.floors.length - 1]?.rect.x ?? 0) - minX - 0.2} y={y(model.roofElevation + 0.4)}
        width={(model.floors[model.floors.length - 1]?.rect.w ?? 0) + 0.4} height={0.4} fill="currentColor" fillOpacity={0.5} />
    </svg>
  );
}
