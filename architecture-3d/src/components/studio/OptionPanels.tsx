"use client";
import {
  ACCENT_MATERIALS, CEILING_MATERIALS, DOOR_STYLES, FACADE_PATTERNS, FLOOR_MATERIALS, FRAME_FINISHES, FURNITURE_STYLES,
  GLASS_TINTS, INTERIOR_WALL_FINISHES, LANDSCAPES, LIGHTING_MOODS, ROOF_STYLES, SKY_CONDITIONS, WALL_MATERIALS, WINDOW_STYLES,
  formatValue,
} from "@/three/config";
import { useDesign } from "@/store/design";
import type { Option } from "@/three/config";

const noteOf = (list: readonly Option[], id: string) => list.find((o) => o.id === id)?.note;
import { ColorField, ControlGroup, Segmented, Slider, Toggle } from "@/components/ui/Controls";

export function ExteriorPanel() {
  const c = useDesign((s) => s.config.exterior);
  const set = useDesign((s) => s.setField);
  const preview = useDesign((s) => s.preview);
  const commit = useDesign((s) => s.commit);
  return (
    <div className="space-y-6">
      <ControlGroup title="Wall material" hint={noteOf(WALL_MATERIALS, c.wall)}>
        <Segmented label="Wall material" value={c.wall} options={WALL_MATERIALS} onChange={(v) => set("exterior", "wall", v)} />
      </ControlGroup>
      {c.wall === "plaster" && (
        <ColorField label="Render colour" value={c.paint} onChange={(v) => preview("exterior", "paint", v)} onCommit={commit} />
      )}
      <ControlGroup title="Accent and shading elements">
        <Segmented label="Accent material" value={c.accent} options={ACCENT_MATERIALS} onChange={(v) => set("exterior", "accent", v)} />
      </ControlGroup>
      <ControlGroup title="Facade pattern" hint={noteOf(FACADE_PATTERNS, c.pattern)}>
        <Segmented label="Facade pattern" value={c.pattern} options={FACADE_PATTERNS} onChange={(v) => set("exterior", "pattern", v)} />
      </ControlGroup>
      <ControlGroup title="Windows">
        <Segmented label="Window style" value={c.windows} options={WINDOW_STYLES} onChange={(v) => set("exterior", "windows", v)} />
        <Segmented label="Glass" size="sm" value={c.glass} options={GLASS_TINTS} onChange={(v) => set("exterior", "glass", v)} />
        <Segmented label="Frames" size="sm" value={c.frames} options={FRAME_FINISHES} onChange={(v) => set("exterior", "frames", v)} />
      </ControlGroup>
      <ControlGroup title="Entrance door">
        <Segmented label="Door" value={c.door} options={DOOR_STYLES} onChange={(v) => set("exterior", "door", v)} />
      </ControlGroup>
      <ControlGroup title="Roof" hint={noteOf(ROOF_STYLES, c.roof)}>
        <Segmented label="Roof" value={c.roof} options={ROOF_STYLES} onChange={(v) => set("exterior", "roof", v)} />
      </ControlGroup>
      <Toggle label="Balconies on upper floors" checked={c.balconies} onChange={(v) => set("exterior", "balconies", v)} />
    </div>
  );
}

export function InteriorPanel() {
  const c = useDesign((s) => s.config.interior);
  const set = useDesign((s) => s.setField);
  const preview = useDesign((s) => s.preview);
  const commit = useDesign((s) => s.commit);
  return (
    <div className="space-y-6">
      <p className="text-xs leading-relaxed text-muted">Tip: use the Interior view or the facade cutaway to see changes inside.</p>
      <ControlGroup title="Flooring">
        <Segmented label="Flooring" value={c.floor} options={FLOOR_MATERIALS} onChange={(v) => set("interior", "floor", v)} />
      </ControlGroup>
      <ControlGroup title="Walls">
        <Segmented label="Wall finish" value={c.walls} options={INTERIOR_WALL_FINISHES} onChange={(v) => set("interior", "walls", v)} />
        {(c.walls === "paint" || c.walls === "plaster") && (
          <ColorField label="Wall colour" value={c.wallColor} onChange={(v) => preview("interior", "wallColor", v)} onCommit={commit} />
        )}
      </ControlGroup>
      <ControlGroup title="Ceiling">
        <Segmented label="Ceiling" value={c.ceiling} options={CEILING_MATERIALS} onChange={(v) => set("interior", "ceiling", v)} />
      </ControlGroup>
      <ControlGroup title="Furniture and decoration">
        <Segmented label="Furniture" value={c.furniture} options={FURNITURE_STYLES} onChange={(v) => set("interior", "furniture", v)} />
      </ControlGroup>
      <ControlGroup title="Lighting">
        <Segmented label="Lighting colour" value={c.lighting} options={LIGHTING_MOODS} onChange={(v) => set("interior", "lighting", v)} />
        <Toggle label="Lights on" checked={c.lightsOn} onChange={(v) => set("interior", "lightsOn", v)} />
      </ControlGroup>
    </div>
  );
}

export function EnvironmentPanel({ hasPool }: { hasPool: boolean }) {
  const c = useDesign((s) => s.config.environment);
  const set = useDesign((s) => s.setField);
  const preview = useDesign((s) => s.preview);
  const commit = useDesign((s) => s.commit);
  return (
    <div className="space-y-6">
      <ControlGroup title="Daylight">
        <Slider label="Time of day" value={c.time} min={0} max={24} step={0.25} format={(v) => formatValue("environment.time", v)} onChange={(v) => preview("environment", "time", v)} onCommit={commit} />
        <div className="flex flex-wrap gap-1.5">
          {[["Morning", 8], ["Noon", 12.5], ["Golden hour", 17.3], ["Dusk", 18.6], ["Night", 21.5]].map(([label, t]) => (
            <button key={label} type="button" onClick={() => set("environment", "time", t as number)} className="rounded border border-line px-2.5 py-1 text-xs text-muted hover:border-line-strong hover:text-ink">
              {label}
            </button>
          ))}
        </div>
        <Slider label="Sun intensity" value={c.sun} min={0} max={2} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => preview("environment", "sun", v)} onCommit={commit} />
      </ControlGroup>
      <ControlGroup title="Sky conditions">
        <Segmented label="Sky" value={c.sky} options={SKY_CONDITIONS} onChange={(v) => set("environment", "sky", v)} />
      </ControlGroup>
      <ControlGroup title="Landscape">
        <Segmented label="Landscape" value={c.landscape} options={LANDSCAPES} onChange={(v) => set("environment", "landscape", v)} />
        <Toggle label="Garden planting" checked={c.garden} onChange={(v) => set("environment", "garden", v)} />
        <Toggle label="Swimming pool" checked={c.pool && hasPool} onChange={(v) => set("environment", "pool", v)} hint={hasPool ? undefined : "This building type has no pool position"} />
        {!hasPool && <p className="text-xs text-muted">This building type has no pool position in its site plan.</p>}
        <Toggle label="Outdoor lighting" checked={c.outdoorLights} onChange={(v) => set("environment", "outdoorLights", v)} />
      </ControlGroup>
    </div>
  );
}
