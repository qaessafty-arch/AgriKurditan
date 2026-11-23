"use client";
import { useFrame } from "@react-three/fiber";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { BuildingScene, useBuildingModel } from "@/components/three/BuildingScene";
import { ExplorerCamera } from "@/components/three/ExplorerCamera";
import { coerceConfig, mergeConfig } from "@/three/config";
import { getPlan } from "@/three/plans";
import { useViewer, type CameraPreset } from "@/store/viewer";

function ReadySignal() {
  const frames = useRef(0);
  useFrame(() => {
    frames.current++;
    if (frames.current === 40) (window as unknown as { __renderReady: boolean }).__renderReady = true;
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
      <SceneCanvas className="absolute inset-0" label="Render" fallback={null}>
        <BuildingScene model={model} config={config} />
        <ExplorerCamera model={model} initial={view === "night" ? "hero" : view} />
        <ReadySignal />
      </SceneCanvas>
    </div>
  );
}
