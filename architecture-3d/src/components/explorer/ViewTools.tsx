"use client";
/** View controls shared by the explorer and the studio: camera presets, floors, cuts, measure. */
import { useEffect, useState, type RefObject } from "react";
import type { BuildingModel } from "@/three/generate";
import { useViewer, type CameraPreset, type Quality } from "@/store/viewer";
import { ControlGroup, Segmented, Slider, Toggle } from "@/components/ui/Controls";
import { cn } from "@/lib/cn";

export const PRESETS: { id: CameraPreset; label: string }[] = [
  { id: "hero", label: "Overview" },
  { id: "front", label: "Street" },
  { id: "aerial", label: "Aerial" },
  { id: "side", label: "Side" },
  { id: "rear", label: "Garden" },
  { id: "interior", label: "Interior" },
  { id: "plan", label: "Plan" },
];

export function PresetBar({ className }: { className?: string }) {
  const requestCamera = useViewer((s) => s.requestCamera);
  const [active, setActive] = useState<CameraPreset>("hero");
  return (
    <div role="toolbar" aria-label="Camera views" className={cn("no-scrollbar flex gap-1 overflow-x-auto rounded-lg border hairline glass p-1", className)}>
      {PRESETS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => { setActive(p.id); requestCamera(p.id); }}
          aria-pressed={active === p.id}
          className={cn("shrink-0 rounded px-3 py-2 text-xs font-medium transition-colors sm:text-sm", active === p.id ? "bg-accent text-[#101114]" : "text-muted hover:text-ink")}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export function ViewControls({ model, fullscreenTarget }: { model: BuildingModel; fullscreenTarget?: RefObject<HTMLElement | null> }) {
  const v = useViewer();
  const [isFull, setIsFull] = useState(false);
  useEffect(() => {
    const on = () => setIsFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  const floorOptions = [{ id: "all", label: "All" }, ...model.floors.map((f) => ({ id: String(f.index), label: f.index === 0 ? "G" : String(f.index) }))];
  const height = model.stats.height;

  return (
    <div className="space-y-6">
      <ControlGroup title="Floors" hint="Isolate a floor to see its rooms from above.">
        <Segmented
          label="Visible floors"
          size="sm"
          value={v.floorLimit === null ? "all" : String(v.floorLimit)}
          options={floorOptions}
          onChange={(id) => v.set({ floorLimit: id === "all" ? null : Number(id), section: null })}
        />
      </ControlGroup>

      <ControlGroup title="Reveal">
        <Slider label="Exploded view" value={v.explode} min={0} max={1} step={0.01} format={(x) => `${Math.round(x * 100)}%`} onChange={(x) => v.set({ explode: x })} />
        <Slider label="Facade cutaway" value={v.cutaway} min={0} max={1} step={0.01} format={(x) => `${Math.round(x * 100)}%`} onChange={(x) => v.set({ cutaway: x })} />
        <Toggle label="Section cut" checked={v.section !== null} onChange={(on) => v.set({ section: on ? Math.min(height - 1, 1.6) : null, floorLimit: null })} />
        {v.section !== null && (
          <Slider label="Section height" value={v.section} min={0.4} max={height} step={0.05} format={(x) => `${x.toFixed(2)} m`} onChange={(x) => v.set({ section: x })} />
        )}
        <Toggle label="Furniture" checked={v.showFurniture} onChange={(on) => v.set({ showFurniture: on })} />
      </ControlGroup>

      <ControlGroup title="Tools">
        <Toggle label="Measure" checked={v.measuring} hint="Click two points to measure" onChange={(on) => v.set({ measuring: on, measure: [], inspected: null })} />
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" className="rounded border border-line px-3 py-2 text-sm text-ink hover:border-line-strong" onClick={() => { v.reset(); v.requestCamera("hero"); }}>
            Reset view
          </button>
          {fullscreenTarget && (
            <button
              type="button"
              className="rounded border border-line px-3 py-2 text-sm text-ink hover:border-line-strong"
              onClick={() => {
                if (document.fullscreenElement) void document.exitFullscreen();
                else void fullscreenTarget.current?.requestFullscreen?.();
              }}
            >
              {isFull ? "Exit full screen" : "Full screen"}
            </button>
          )}
        </div>
      </ControlGroup>

      <ControlGroup title="Rendering quality" hint="Lower quality on older devices for smoother movement.">
        <Segmented<Quality>
          label="Rendering quality"
          size="sm"
          value={v.quality}
          options={[{ id: "low", label: "Performance" }, { id: "medium", label: "Balanced" }, { id: "high", label: "Cinematic" }]}
          onChange={(q) => v.set({ quality: q, qualityLocked: true })}
        />
      </ControlGroup>
    </div>
  );
}
