"use client";
/** View controls shared by the explorer and the studio: camera presets, floors, cuts, measure. */
import { useEffect, useState, type RefObject } from "react";
import type { BuildingModel } from "@/three/generate";
import { useViewer, type CameraPreset, type Quality } from "@/store/viewer";
import { ControlGroup, Segmented, Slider, Toggle } from "@/components/ui/Controls";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/client";
import { formatPercent, num } from "@/i18n/labels";

export const PRESET_IDS: CameraPreset[] = ["hero", "front", "aerial", "side", "rear", "interior", "plan"];

export function PresetBar({ className }: { className?: string }) {
  const { m } = useI18n();
  const requestCamera = useViewer((s) => s.requestCamera);
  const [active, setActive] = useState<CameraPreset>("hero");
  return (
    <div role="toolbar" aria-label={m.explorer.cameraViews} className={cn("no-scrollbar flex gap-1 overflow-x-auto rounded-lg border hairline glass p-1", className)}>
      {PRESET_IDS.map((id) => (
        <button key={id} type="button" onClick={() => { setActive(id); requestCamera(id); }} aria-pressed={active === id}
          className={cn("shrink-0 rounded px-3 py-2 text-xs font-medium transition-colors sm:text-sm", active === id ? "bg-accent text-[#101114]" : "text-muted hover:text-ink")}>
          {m.explorer.presets[id]}
        </button>
      ))}
    </div>
  );
}

export function ViewControls({ model, fullscreenTarget }: { model: BuildingModel; fullscreenTarget?: RefObject<HTMLElement | null> }) {
  const { m, locale } = useI18n();
  const E = m.explorer;
  const v = useViewer();
  const [isFull, setIsFull] = useState(false);
  useEffect(() => {
    const on = () => setIsFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  const floorOptions = [{ id: "all", label: E.allFloors }, ...model.floors.map((f) => ({ id: String(f.index), label: f.index === 0 ? E.groundShort : num(locale, f.index) }))];
  const height = model.stats.height;
  const pct = (x: number) => formatPercent(locale, x);

  return (
    <div className="space-y-6">
      <ControlGroup title={E.floors} hint={E.floorsHint}>
        <Segmented label={E.visibleFloors} size="sm" value={v.floorLimit === null ? "all" : String(v.floorLimit)} options={floorOptions}
          onChange={(id) => v.set({ floorLimit: id === "all" ? null : Number(id), section: null })} />
      </ControlGroup>

      <ControlGroup title={E.reveal}>
        <Slider label={E.exploded} value={v.explode} min={0} max={1} step={0.01} format={pct} onChange={(x) => v.set({ explode: x })} />
        <Slider label={E.cutaway} value={v.cutaway} min={0} max={1} step={0.01} format={pct} onChange={(x) => v.set({ cutaway: x })} />
        <Toggle label={E.section} checked={v.section !== null} onChange={(on) => v.set({ section: on ? Math.min(height - 1, 1.6) : null, floorLimit: null })} />
        {v.section !== null && (
          <Slider label={E.sectionHeight} value={v.section} min={0.4} max={height} step={0.05} format={(x) => `${num(locale, x, 2)} m`} onChange={(x) => v.set({ section: x })} />
        )}
        <Toggle label={E.furniture} checked={v.showFurniture} onChange={(on) => v.set({ showFurniture: on })} />
      </ControlGroup>

      <ControlGroup title={E.tools}>
        <Toggle label={E.measure} checked={v.measuring} hint={E.measureHint} onChange={(on) => v.set({ measuring: on, measure: [], inspected: null })} />
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" className="rounded border border-line px-3 py-2 text-sm text-ink hover:border-line-strong" onClick={() => { v.reset(); v.requestCamera("hero"); }}>{E.reset}</button>
          {fullscreenTarget && (
            <button type="button" className="rounded border border-line px-3 py-2 text-sm text-ink hover:border-line-strong"
              onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void fullscreenTarget.current?.requestFullscreen?.(); }}>
              {isFull ? E.exitFullscreen : E.fullscreen}
            </button>
          )}
        </div>
      </ControlGroup>

      <ControlGroup title={E.quality} hint={E.qualityHint}>
        <Segmented<Quality> label={E.quality} size="sm" value={v.quality}
          options={(["low", "medium", "high"] as const).map((id) => ({ id, label: E.qualities[id] }))}
          onChange={(q) => v.set({ quality: q, qualityLocked: true })} />
      </ControlGroup>
    </div>
  );
}
