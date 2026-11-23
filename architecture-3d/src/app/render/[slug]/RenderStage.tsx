"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { BuildingScene, useBuildingModel } from "@/components/three/BuildingScene";
import { ExplorerCamera } from "@/components/three/ExplorerCamera";
import { coerceConfig, mergeConfig } from "@/three/config";
import { getPlan } from "@/three/plans";
import { useViewer, type CameraPreset } from "@/store/viewer";

/** After the scene has settled, publish the frame as a JPEG data URL for scripts/render-covers.mjs. */
function ReadySignal() {
  const frames = useRef(0);
  const gl = useThree((s) => s.gl);
  useFrame(() => {
    frames.current++;
    if (frames.current === 40) {
      const w = window as unknown as { __renderData?: string; __renderReady?: boolean };
      w.__renderData = gl.domElement.toDataURL("image/jpeg", 0.86);
      w.__renderReady = true;
    }
  });
  return null;
}

export function RenderStage({ presetId, config: raw }: { presetId: string; config: unknown }) {
  const params = useSearchParams();
  const view = (params.get("view") ?? "hero") as CameraPreset | "night";
  const config = useMemo(() => {
    const c = coerceConfig(raw);
    return view === "night" ? mergeConfig(c, { environment: { time: 20.5 }, interior: { lightsOn: true } }) : c;
  }, [raw, view]);
  const model = useBuildingModel(getPlan(presetId).id, config);
  useEffect(() => { useViewer.setState({ quality: "high", qualityLocked: true }); }, []);
  return (
    <div className="fixed inset-0 z-[100] bg-canvas">
      <SceneCanvas className="absolute inset-0" label="Render" fallback={null} preserveDrawingBuffer>
        <BuildingScene model={model} config={config} />
        <ExplorerCamera model={model} initial={view === "night" ? "hero" : view} />
        <ReadySignal />
      </SceneCanvas>
    </div>
  );
}
