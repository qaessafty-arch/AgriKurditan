"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { BuildingScene, useBuildingModel } from "@/components/three/BuildingScene";
import { ExplorerCamera, MeasureOverlay } from "@/components/three/ExplorerCamera";
import { ElevationDrawing } from "@/components/three/ElevationDrawing";
import { Inspector } from "./Inspector";
import { PresetBar, ViewControls } from "./ViewTools";
import { ControlGroup, Slider, Toggle } from "@/components/ui/Controls";
import { ButtonLink } from "@/components/ui/Button";
import { PLANS, getPlan } from "@/three/plans";
import type { BuildingConfig } from "@/three/config";
import { useViewer } from "@/store/viewer";
import { cn } from "@/lib/cn";
import { track } from "@/components/layout/ConsentBanner";
import { useI18n, useLocaleRouter } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import { formatPercent, formatTime, planDescription, planName } from "@/i18n/labels";

export function ExplorerApp() {
  const { m, locale } = useI18n();
  const E = m.explorer;
  const params = useSearchParams();
  const router = useLocaleRouter();
  const planId = getPlan(params.get("plan")).id;
  const plan = getPlan(planId);
  const name = planName(m, plan);
  const [envOverride, setEnvOverride] = useState<Partial<BuildingConfig["environment"]>>({});
  const [lightsOn, setLightsOn] = useState(plan.defaultConfig.interior.lightsOn);
  const [tab, setTab] = useState<"view" | "inspect">("view");
  const stageRef = useRef<HTMLDivElement>(null);

  const config = useMemo<BuildingConfig>(() => ({
    ...plan.defaultConfig,
    interior: { ...plan.defaultConfig.interior, lightsOn },
    environment: { ...plan.defaultConfig.environment, ...envOverride },
  }), [plan, envOverride, lightsOn]);
  const model = useBuildingModel(planId, config);

  useEffect(() => {
    useViewer.getState().reset();
    setEnvOverride({});
    track("explorer_open", planId);
  }, [planId]);
  useEffect(() => useViewer.subscribe((s, prev) => {
    if (s.inspected !== prev.inspected && s.inspected) setTab("inspect");
  }), []);

  return (
    <div className="lg:grid lg:h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,1fr)_360px]">
      <div ref={stageRef} className="relative h-[62dvh] min-h-[360px] bg-canvas lg:h-full">
        <SceneCanvas className="absolute inset-0" label={fmt(E.modelLabel, { name })}
          onPointerMissed={() => useViewer.getState().set({ inspected: null, selectedRoom: null })}
          fallback={
            <div className="absolute inset-0 grid place-items-center bg-surface p-6 text-center">
              <div className="w-full max-w-2xl">
                <ElevationDrawing model={model} className="mx-auto h-56 w-full text-stone" title={fmt(E.elevation, { name })} />
                <p className="mt-4 text-sm text-muted">{E.noWebgl}</p>
              </div>
            </div>
          }>
          <BuildingScene model={model} config={config} interactive><MeasureOverlay /></BuildingScene>
          <ExplorerCamera model={model} />
        </SceneCanvas>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3 sm:gap-3 sm:p-4">
          <label className="pointer-events-auto glass flex items-center gap-2 rounded-lg border hairline px-3 py-2 text-sm">
            <span className="hidden text-muted sm:inline">{E.building}</span>
            <select className="bg-transparent font-medium text-ink outline-none" value={planId} onChange={(e) => router.replace(`/explore?plan=${e.target.value}`, { scroll: false })} aria-label={E.building}>
              {PLANS.map((p) => <option key={p.id} value={p.id} className="bg-canvas">{planName(m, p)}</option>)}
            </select>
          </label>
          <ButtonLink href={`/studio?plan=${planId}`} size="sm" className="pointer-events-auto">
            <span className="sm:hidden">{E.customiseShort}</span><span className="hidden sm:inline">{E.customise}</span>
          </ButtonLink>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex justify-center p-3 sm:p-4"><PresetBar className="max-w-full" /></div>
      </div>

      <aside className="border-s hairline bg-surface/60 lg:overflow-y-auto" aria-label={E.controls}>
        <div role="tablist" aria-label={E.panels} className="sticky top-0 z-10 flex border-b hairline bg-surface">
          {(["view", "inspect"] as const).map((t) => (
            <button key={t} role="tab" type="button" aria-selected={tab === t} onClick={() => setTab(t)}
              className={cn("flex-1 py-3 text-sm font-medium transition-colors", tab === t ? "border-b-2 border-accent text-ink" : "text-muted hover:text-ink")}>
              {t === "view" ? E.view : E.inspect}
            </button>
          ))}
        </div>
        <div className="space-y-6 p-5">
          {tab === "view" ? (
            <>
              <div>
                <h1 className="font-display text-3xl text-ink">{name}</h1>
                <p className="mt-1 text-sm leading-relaxed text-muted">{planDescription(m, plan)}</p>
              </div>
              <ControlGroup title={E.light}>
                <Slider label={E.timeOfDay} value={config.environment.time} min={5} max={22} step={0.25} format={(x) => formatTime(locale, x)} onChange={(x) => setEnvOverride((o) => ({ ...o, time: x }))} />
                <Slider label={E.sun} value={config.environment.sun} min={0} max={1.6} step={0.05} format={(x) => formatPercent(locale, x)} onChange={(x) => setEnvOverride((o) => ({ ...o, sun: x }))} />
                <Toggle label={E.interiorLights} checked={lightsOn} onChange={setLightsOn} />
              </ControlGroup>
              <ViewControls model={model} fullscreenTarget={stageRef} />
            </>
          ) : <Inspector model={model} config={config} />}
        </div>
      </aside>
    </div>
  );
}
