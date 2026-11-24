"use client";
import {
  ACCENT_MATERIALS, CEILING_MATERIALS, DOOR_STYLES, FACADE_PATTERNS, FLOOR_MATERIALS, FRAME_FINISHES, FURNITURE_STYLES,
  GLASS_TINTS, INTERIOR_WALL_FINISHES, LANDSCAPES, LIGHTING_MOODS, ROOF_STYLES, SKY_CONDITIONS, WALL_MATERIALS, WINDOW_STYLES,
} from "@/three/config";
import { useDesign } from "@/store/design";
import { ColorField, ControlGroup, Segmented, Slider, Toggle } from "@/components/ui/Controls";
import { useI18n } from "@/i18n/client";
import { formatPercent, formatTime, localizedOptions, noteText } from "@/i18n/labels";

export function ExteriorPanel() {
  const { m } = useI18n();
  const G = m.studio.groups;
  const c = useDesign((s) => s.config.exterior);
  const set = useDesign((s) => s.setField);
  const preview = useDesign((s) => s.preview);
  const commit = useDesign((s) => s.commit);
  return (
    <div className="space-y-6">
      <ControlGroup title={G.wall} hint={noteText(m, "wall", c.wall)}>
        <Segmented label={G.wall} value={c.wall} options={localizedOptions(m, "exterior.wall", WALL_MATERIALS)} onChange={(v) => set("exterior", "wall", v)} />
      </ControlGroup>
      {c.wall === "plaster" && <ColorField label={G.renderColour} value={c.paint} onChange={(v) => preview("exterior", "paint", v)} onCommit={commit} />}
      <ControlGroup title={G.accent}>
        <Segmented label={G.accent} value={c.accent} options={localizedOptions(m, "exterior.accent", ACCENT_MATERIALS)} onChange={(v) => set("exterior", "accent", v)} />
      </ControlGroup>
      <ControlGroup title={G.pattern} hint={noteText(m, "pattern", c.pattern)}>
        <Segmented label={G.pattern} value={c.pattern} options={localizedOptions(m, "exterior.pattern", FACADE_PATTERNS)} onChange={(v) => set("exterior", "pattern", v)} />
      </ControlGroup>
      <ControlGroup title={G.windows}>
        <Segmented label={G.windows} value={c.windows} options={localizedOptions(m, "exterior.windows", WINDOW_STYLES)} onChange={(v) => set("exterior", "windows", v)} />
        <Segmented label={G.glass} size="sm" value={c.glass} options={localizedOptions(m, "exterior.glass", GLASS_TINTS)} onChange={(v) => set("exterior", "glass", v)} />
        <Segmented label={G.frames} size="sm" value={c.frames} options={localizedOptions(m, "exterior.frames", FRAME_FINISHES)} onChange={(v) => set("exterior", "frames", v)} />
      </ControlGroup>
      <ControlGroup title={G.door}>
        <Segmented label={G.door} value={c.door} options={localizedOptions(m, "exterior.door", DOOR_STYLES)} onChange={(v) => set("exterior", "door", v)} />
      </ControlGroup>
      <ControlGroup title={G.roof} hint={noteText(m, "roof", c.roof)}>
        <Segmented label={G.roof} value={c.roof} options={localizedOptions(m, "exterior.roof", ROOF_STYLES)} onChange={(v) => set("exterior", "roof", v)} />
      </ControlGroup>
      <Toggle label={G.balconies} checked={c.balconies} onChange={(v) => set("exterior", "balconies", v)} />
    </div>
  );
}

export function InteriorPanel() {
  const { m } = useI18n();
  const G = m.studio.groups;
  const c = useDesign((s) => s.config.interior);
  const set = useDesign((s) => s.setField);
  const preview = useDesign((s) => s.preview);
  const commit = useDesign((s) => s.commit);
  return (
    <div className="space-y-6">
      <p className="text-xs leading-relaxed text-muted">{m.studio.interiorTip}</p>
      <ControlGroup title={G.flooring}>
        <Segmented label={G.flooring} value={c.floor} options={localizedOptions(m, "interior.floor", FLOOR_MATERIALS)} onChange={(v) => set("interior", "floor", v)} />
      </ControlGroup>
      <ControlGroup title={G.walls}>
        <Segmented label={G.walls} value={c.walls} options={localizedOptions(m, "interior.walls", INTERIOR_WALL_FINISHES)} onChange={(v) => set("interior", "walls", v)} />
        {(c.walls === "paint" || c.walls === "plaster") && <ColorField label={G.wallColour} value={c.wallColor} onChange={(v) => preview("interior", "wallColor", v)} onCommit={commit} />}
      </ControlGroup>
      <ControlGroup title={G.ceiling}>
        <Segmented label={G.ceiling} value={c.ceiling} options={localizedOptions(m, "interior.ceiling", CEILING_MATERIALS)} onChange={(v) => set("interior", "ceiling", v)} />
      </ControlGroup>
      <ControlGroup title={G.furniture}>
        <Segmented label={G.furniture} value={c.furniture} options={localizedOptions(m, "interior.furniture", FURNITURE_STYLES)} onChange={(v) => set("interior", "furniture", v)} />
      </ControlGroup>
      <ControlGroup title={G.lighting}>
        <Segmented label={G.lightColour} value={c.lighting} options={localizedOptions(m, "interior.lighting", LIGHTING_MOODS)} onChange={(v) => set("interior", "lighting", v)} />
        <Toggle label={G.lightsOn} checked={c.lightsOn} onChange={(v) => set("interior", "lightsOn", v)} />
      </ControlGroup>
    </div>
  );
}

export function EnvironmentPanel({ hasPool }: { hasPool: boolean }) {
  const { m, locale } = useI18n();
  const G = m.studio.groups, P = m.studio.presets;
  const c = useDesign((s) => s.config.environment);
  const set = useDesign((s) => s.setField);
  const preview = useDesign((s) => s.preview);
  const commit = useDesign((s) => s.commit);
  const times: [string, number][] = [[P.morning, 8], [P.noon, 12.5], [P.golden, 17.3], [P.dusk, 18.6], [P.night, 21.5]];
  return (
    <div className="space-y-6">
      <ControlGroup title={G.daylight}>
        <Slider label={m.explorer.timeOfDay} value={c.time} min={0} max={24} step={0.25} format={(v) => formatTime(locale, v)} onChange={(v) => preview("environment", "time", v)} onCommit={commit} />
        <div className="flex flex-wrap gap-1.5">
          {times.map(([label, t]) => (
            <button key={label} type="button" onClick={() => set("environment", "time", t)} className="rounded border border-line px-2.5 py-1 text-xs text-muted hover:border-line-strong hover:text-ink">{label}</button>
          ))}
        </div>
        <Slider label={m.explorer.sun} value={c.sun} min={0} max={2} step={0.05} format={(v) => formatPercent(locale, v)} onChange={(v) => preview("environment", "sun", v)} onCommit={commit} />
      </ControlGroup>
      <ControlGroup title={G.sky}>
        <Segmented label={G.sky} value={c.sky} options={localizedOptions(m, "environment.sky", SKY_CONDITIONS)} onChange={(v) => set("environment", "sky", v)} />
      </ControlGroup>
      <ControlGroup title={G.landscape}>
        <Segmented label={G.landscape} value={c.landscape} options={localizedOptions(m, "environment.landscape", LANDSCAPES)} onChange={(v) => set("environment", "landscape", v)} />
        <Toggle label={G.garden} checked={c.garden} onChange={(v) => set("environment", "garden", v)} />
        <Toggle label={G.pool} checked={c.pool && hasPool} onChange={(v) => set("environment", "pool", v)} hint={hasPool ? undefined : m.studio.noPool} />
        {!hasPool && <p className="text-xs text-muted">{m.studio.noPool}</p>}
        <Toggle label={G.outdoor} checked={c.outdoorLights} onChange={(v) => set("environment", "outdoorLights", v)} />
      </ControlGroup>
    </div>
  );
}
