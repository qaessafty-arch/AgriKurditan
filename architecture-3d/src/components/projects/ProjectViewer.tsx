"use client";
import { useEffect, useMemo } from "react";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { BuildingScene, useBuildingModel } from "@/components/three/BuildingScene";
import { ExplorerCamera } from "@/components/three/ExplorerCamera";
import { ElevationDrawing } from "@/components/three/ElevationDrawing";
import { PresetBar } from "@/components/explorer/ViewTools";
import { coerceConfig } from "@/three/config";
import { getPlan } from "@/three/plans";
import { useViewer } from "@/store/viewer";

export default function ProjectViewer({ presetId, config: raw, title }: { presetId: string; config: unknown; title: string }) {
  const config = useMemo(() => coerceConfig(raw), [raw]);
  const planId = getPlan(presetId).id;
  const model = useBuildingModel(planId, config);
  useEffect(() => { useViewer.getState().reset(); }, []);
  return (
    <div className="relative h-full w-full">
      <SceneCanvas className="absolute inset-0" label={`Interactive 3D model of ${title}`}
        fallback={<div className="absolute inset-0 grid place-items-center bg-surface p-6"><ElevationDrawing model={model} className="h-full w-full text-stone" /></div>}>
        <BuildingScene model={model} config={config} />
        <ExplorerCamera model={model} />
      </SceneCanvas>
      <div className="absolute inset-x-0 bottom-0 flex justify-center p-3"><PresetBar className="max-w-full" /></div>
    </div>
  );
}
