"use client";
import type { BuildingConfig } from "@/three/config";
import type { BuildingModel } from "@/three/generate";
import { useViewer } from "@/store/viewer";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import { describeSlotL, nameText, num } from "@/i18n/labels";

export function Inspector({ model, config }: { model: BuildingModel; config: BuildingConfig }) {
  const { m, locale } = useI18n();
  const I = m.inspector;
  const inspected = useViewer((s) => s.inspected);
  const selectedRoom = useViewer((s) => s.selectedRoom);
  const measuring = useViewer((s) => s.measuring);
  const measure = useViewer((s) => s.measure);
  const set = useViewer((s) => s.set);
  const room = model.rooms.find((r) => r.id === selectedRoom);
  const a = measure[0], b = measure[1];
  const n = (v: number, d = 2) => num(locale, v, d);

  return (
    <div className="space-y-4" aria-live="polite">
      {measuring && (
        <div className="rounded border border-accent/40 bg-accent/10 p-3 text-sm">
          <p className="font-medium text-ink">{I.measureMode}</p>
          <p className="mt-1 text-xs text-muted">
            {a && b
              ? fmt(I.distance, { d: n(Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z)), x: n(Math.abs(b.x - a.x)), y: n(Math.abs(b.y - a.y)), z: n(Math.abs(b.z - a.z)) })
              : a ? I.secondPoint : I.firstPoint}
          </p>
        </div>
      )}

      {room && (
        <div>
          <p className="eyebrow">{I.room}</p>
          <p className="mt-1 font-display text-2xl text-ink">{nameText(m, room.name)}</p>
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
            <dt className="text-muted">{I.type}</dt><dd className="text-ink">{I.roomTypes[room.type] ?? room.type}</dd>
            <dt className="text-muted">{I.floor}</dt><dd className="text-ink">{nameText(m, room.floorName)}</dd>
            <dt className="text-muted">{I.area}</dt><dd className="text-ink">{n(room.area, 1)} m²</dd>
            <dt className="text-muted">{I.dimensions}</dt><dd className="text-ink" dir="ltr">{n(room.rect.w, 1)} × {n(room.rect.d, 1)} m</dd>
          </dl>
        </div>
      )}

      {inspected && (() => {
        const info = describeSlotL(m, inspected.slot, config);
        return (
          <div>
            <p className="eyebrow">{I.material}</p>
            <p className="mt-1 text-base font-medium text-ink">{info.name}</p>
            <p className="text-sm text-muted">{info.finish}</p>
            {info.notes && <p className="mt-1 text-xs leading-relaxed text-muted">{info.notes}</p>}
            <button type="button" className="mt-2 text-xs text-accent-ink hover:underline" onClick={() => set({ inspected: null, selectedRoom: null })}>{I.clear}</button>
          </div>
        );
      })()}

      {!room && !inspected && !measuring && <p className="text-sm leading-relaxed text-muted">{I.hint}</p>}

      <div className="border-t hairline pt-4">
        <p className="eyebrow">{I.building}</p>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
          <dt className="text-muted">{I.floorArea}</dt><dd className="text-ink">{n(model.stats.grossFloorArea, 0)} m²</dd>
          <dt className="text-muted">{I.storeys}</dt><dd className="text-ink">{n(model.stats.floors, 0)}</dd>
          <dt className="text-muted">{I.height}</dt><dd className="text-ink">{n(model.stats.height, 1)} m</dd>
          <dt className="text-muted">{I.glazing}</dt><dd className="text-ink">{fmt(I.glazingValue, { p: n(Math.round(model.stats.glazingRatio * 100), 0) })}</dd>
        </dl>
      </div>
    </div>
  );
}
