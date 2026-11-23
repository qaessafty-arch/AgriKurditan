"use client";
import { useMemo, type ReactNode } from "react";
import type { BuildingConfig } from "@/three/config";
import { generateBuilding, type BuildingModel } from "@/three/generate";
import { getPlan } from "@/three/plans";
import { computeLighting } from "@/three/lighting";
import { Building, type BuildingProps } from "./Building";
import { Site } from "./Site";
import { Atmosphere, Effects } from "./Atmosphere";

/** Geometry only depends on some fields; time of day, colours and finishes never rebuild it. */
export function geometryKey(c: BuildingConfig): string {
  const e = c.exterior;
  return [e.windows, e.pattern, e.roof, e.balconies, e.door, e.accent === "same", c.interior.furniture,
    c.environment.pool, c.environment.garden, c.environment.outdoorLights].join("|");
}

export function useBuildingModel(planId: string, config: BuildingConfig): BuildingModel {
  const key = geometryKey(config);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => generateBuilding(getPlan(planId), config), [planId, key]);
}

/** Building + site + sky + post-processing. Camera is supplied by the caller. */
export function BuildingScene({
  model, config, interactive, driven, children,
}: { model: BuildingModel; config: BuildingConfig; interactive?: boolean; driven?: BuildingProps["driven"]; children?: ReactNode }) {
  const night = useMemo(() => computeLighting(config.environment).night, [config.environment]);
  const extent = Math.max(model.size[0], model.size[2]) * 1.6 + 10;
  return (
    <>
      <Atmosphere env={config.environment} extent={extent} />
      <Building model={model} config={config} interactive={interactive} driven={driven} />
      <Site model={model} config={config} />
      {children}
      <Effects night={night} />
    </>
  );
}
