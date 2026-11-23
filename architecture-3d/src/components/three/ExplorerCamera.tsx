"use client";
import { CameraControls, Html, Line } from "@react-three/drei";
import { useEffect, useRef } from "react";
import type { BuildingModel } from "@/three/generate";
import { useViewer, type CameraPreset } from "@/store/viewer";

export type Pose = { position: [number, number, number]; target: [number, number, number] };

/** Camera presets derived from the building's real dimensions. */
export function presetPose(model: BuildingModel, preset: CameraPreset): Pose {
  const [w, h, d] = model.size;
  const R = Math.max(w, d, h * 1.5, 10);
  switch (preset) {
    case "front": return { position: [0, 2.4, R * 1.75], target: [0, h * 0.42, 0] };
    case "aerial": return { position: [R * 0.95, R * 1.25, R * 1.05], target: [0, h * 0.2, 0] };
    case "side": return { position: [R * 1.8, 3.2, R * 0.25], target: [0, h * 0.42, 0] };
    case "rear": return { position: [-R * 0.9, 5, -R * 1.45], target: [0, h * 0.42, 0] };
    case "plan": return { position: [0, R * 2.3, 0.01], target: [0, 0, 0] };
    case "interior": {
      const living =
        model.rooms.find((r) => r.floor === 0 && (r.type === "living" || r.type === "lobby" || r.type === "openOffice")) ??
        model.rooms.find((r) => r.floor === 0) ??
        model.rooms[0];
      if (!living) return presetPose(model, "front");
      const cx = living.rect.x + living.rect.w / 2 - model.center[0];
      const back = living.rect.z + 0.9 - model.center[1];
      const front = living.rect.z + living.rect.d - model.center[1];
      return { position: [cx - living.rect.w * 0.2, 1.95, back], target: [cx + living.rect.w * 0.1, 1.45, front] };
    }
    case "hero":
    default:
      return { position: [R * 1.1, h * 0.5 + 3.5, R * 1.4], target: [0, h * 0.36, 0] };
  }
}

export function ExplorerCamera({ model, initial = "hero" }: { model: BuildingModel; initial?: CameraPreset }) {
  const ref = useRef<CameraControls>(null);
  const request = useViewer((s) => s.cameraRequest);
  const R = Math.max(model.size[0], model.size[2], 10);

  useEffect(() => {
    const pose = presetPose(model, initial);
    ref.current?.setLookAt(...pose.position, ...pose.target, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.planId]);

  useEffect(() => {
    if (!request || !ref.current) return;
    const pose = presetPose(model, request.preset);
    const c = ref.current;
    c.maxPolarAngle = request.preset === "plan" ? Math.PI * 0.49 : Math.PI * 0.495;
    void c.setLookAt(...pose.position, ...pose.target, true);
  }, [request, model]);

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={0.4}
      maxDistance={R * 4.5}
      maxPolarAngle={Math.PI * 0.495}
      smoothTime={0.55}
      draggingSmoothTime={0.12}
      dollyToCursor
    />
  );
}

export function MeasureOverlay() {
  const points = useViewer((s) => s.measure);
  const measuring = useViewer((s) => s.measuring);
  if (!measuring || points.length === 0) return null;
  const a = points[0]!;
  const b = points[1];
  const dist = b ? Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) : 0;
  return (
    <group>
      {points.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]} renderOrder={10}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshBasicMaterial color="#B69A72" depthTest={false} />
        </mesh>
      ))}
      {b && (
        <>
          <Line points={[[a.x, a.y, a.z], [b.x, b.y, b.z]]} color="#B69A72" lineWidth={2.5} depthTest={false} renderOrder={10} />
          <Html position={[(a.x + b.x) / 2, (a.y + b.y) / 2 + 0.3, (a.z + b.z) / 2]} center zIndexRange={[20, 0]}>
            <div className="whitespace-nowrap rounded bg-canvas/90 px-2 py-1 font-mono text-xs text-ink shadow-panel border border-line">
              {dist.toFixed(2)} m
            </div>
          </Html>
        </>
      )}
    </group>
  );
}
