"use client";
import type { BuildingConfig } from "@/three/config";
import type { BuildingModel } from "@/three/generate";
import { describeSlot } from "@/three/materials";
import { useViewer } from "@/store/viewer";

const ROOM_TYPE_LABEL: Record<string, string> = {
  living: "Living space", kitchen: "Kitchen", dining: "Dining", bedroom: "Bedroom", bath: "Bathroom", office: "Study / office",
  stair: "Circulation", landing: "Circulation", entry: "Entrance", lobby: "Lobby", retail: "Retail", cafe: "Food and beverage",
  meeting: "Meeting", openOffice: "Workplace", service: "Building services", studio: "Studio",
};

export function Inspector({ model, config }: { model: BuildingModel; config: BuildingConfig }) {
  const inspected = useViewer((s) => s.inspected);
  const selectedRoom = useViewer((s) => s.selectedRoom);
  const measuring = useViewer((s) => s.measuring);
  const measure = useViewer((s) => s.measure);
  const set = useViewer((s) => s.set);
  const room = model.rooms.find((r) => r.id === selectedRoom);
  const a = measure[0], b = measure[1];

  return (
    <div className="space-y-4" aria-live="polite">
      {measuring && (
        <div className="rounded border border-accent/40 bg-accent/10 p-3 text-sm">
          <p className="font-medium text-ink">Measure mode</p>
          <p className="mt-1 text-xs text-muted">
            {a && b
              ? `Distance: ${Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z).toFixed(2)} m (Δx ${Math.abs(b.x - a.x).toFixed(2)}, Δy ${Math.abs(b.y - a.y).toFixed(2)}, Δz ${Math.abs(b.z - a.z).toFixed(2)})`
              : a ? "Click a second point on the building." : "Click two points on any surface to measure between them."}
          </p>
        </div>
      )}

      {room && (
        <div>
          <p className="eyebrow">Room</p>
          <p className="mt-1 font-display text-2xl text-ink">{room.name}</p>
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
            <dt className="text-muted">Type</dt><dd className="text-ink">{ROOM_TYPE_LABEL[room.type] ?? room.type}</dd>
            <dt className="text-muted">Floor</dt><dd className="text-ink">{room.floorName}</dd>
            <dt className="text-muted">Area</dt><dd className="text-ink">{room.area.toFixed(1)} m²</dd>
            <dt className="text-muted">Dimensions</dt><dd className="text-ink">{room.rect.w.toFixed(1)} × {room.rect.d.toFixed(1)} m</dd>
          </dl>
        </div>
      )}

      {inspected && (
        <div>
          <p className="eyebrow">Material</p>
          {(() => {
            const info = describeSlot(inspected.slot, config);
            return (
              <>
                <p className="mt-1 text-base font-medium text-ink">{info.name}</p>
                <p className="text-sm text-muted">{info.finish}</p>
                {info.notes && <p className="mt-1 text-xs leading-relaxed text-muted">{info.notes}</p>}
              </>
            );
          })()}
          <button type="button" className="mt-2 text-xs text-accent-ink hover:underline" onClick={() => set({ inspected: null, selectedRoom: null })}>
            Clear selection
          </button>
        </div>
      )}

      {!room && !inspected && !measuring && (
        <p className="text-sm leading-relaxed text-muted">Select any surface to inspect its material, or a floor to see room details.</p>
      )}

      <div className="border-t hairline pt-4">
        <p className="eyebrow">Building</p>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
          <dt className="text-muted">Floor area</dt><dd className="text-ink">{model.stats.grossFloorArea} m²</dd>
          <dt className="text-muted">Storeys</dt><dd className="text-ink">{model.stats.floors}</dd>
          <dt className="text-muted">Height</dt><dd className="text-ink">{model.stats.height} m</dd>
          <dt className="text-muted">Glazing</dt><dd className="text-ink">{Math.round(model.stats.glazingRatio * 100)}% of facade</dd>
        </dl>
      </div>
    </div>
  );
}
