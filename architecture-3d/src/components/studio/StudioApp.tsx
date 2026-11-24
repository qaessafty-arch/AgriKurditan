"use client";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { BuildingScene, useBuildingModel } from "@/components/three/BuildingScene";
import { ExplorerCamera, MeasureOverlay } from "@/components/three/ExplorerCamera";
import { ElevationDrawing } from "@/components/three/ElevationDrawing";
import { PresetBar, ViewControls } from "@/components/explorer/ViewTools";
import { Inspector } from "@/components/explorer/Inspector";
import { EnvironmentPanel, ExteriorPanel, InteriorPanel } from "./OptionPanels";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/Controls";
import { useDesign } from "@/store/design";
import { useViewer } from "@/store/viewer";
import { PLANS, getPlan } from "@/three/plans";
import { coerceConfig, type BuildingConfig } from "@/three/config";
import { generateBuilding, type BuildingStats } from "@/three/generate";
import { decodeConfig, encodeConfig } from "@/three/share";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import { track } from "@/components/layout/ConsentBanner";
import { Link, useI18n, useLocaleRouter } from "@/i18n/client";
import { fmt, type Locale } from "@/i18n/config";
import { describeConfigL, diffConfigsL, num, planDescription, planName, summarizeModelL } from "@/i18n/labels";
import type { Messages } from "@/i18n/messages/en";

type Tab = "exterior" | "interior" | "environment" | "view" | "inspect";
interface SavedDesign { id: string; name: string; presetId: string; config: unknown; thumbnail: string | null; updatedAt: string }
interface Snapshot { id: string; name: string; presetId: string; config: BuildingConfig; thumbnail: string }

const DRAFT_KEY = "a3d-studio-draft";

async function thumbnailFrom(dataUrl: string, width = 640): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.round((img.height / img.width) * width);
  canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function download(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function StudioApp({ signedIn, pro, freeLimit }: { signedIn: boolean; pro: boolean; freeLimit: number }) {
  const { m, locale } = useI18n();
  const S = m.studio;
  const params = useSearchParams();
  const router = useLocaleRouter();
  const { planId, config, past, future, dirty, undo, redo, load, setPlan, restoreDefaults, markSaved } = useDesign();
  const plan = getPlan(planId);
  const pName = planName(m, plan);
  const model = useBuildingModel(planId, config);
  const [tab, setTab] = useState<Tab>("exterior");
  const [designId, setDesignId] = useState<string | null>(null);
  const [designName, setDesignName] = useState("");
  const [dialog, setDialog] = useState<null | "save" | "compare" | "summary" | "export">(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<SavedDesign[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [compareTarget, setCompareTarget] = useState<Snapshot | null>(null);
  const [currentThumb, setCurrentThumb] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const initialised = useRef(false);

  // ── Initial load: saved design, shared config, draft, or plan defaults ──
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    useViewer.getState().reset();
    const id = params.get("design");
    const shared = decodeConfig(params.get("config"));
    const plan = getPlan(params.get("plan"));
    track("studio_open", plan.id);
    if (id) {
      void api<{ design: SavedDesign }>(`/api/designs/${id}`).then((r) => {
        if (r.ok) {
          load(r.data.design.presetId, coerceConfig(r.data.design.config));
          setDesignId(r.data.design.id);
          setDesignName(r.data.design.name);
        } else {
          setNotice({ kind: "error", text: r.status === 401 ? S.signInSave : r.error });
          load(plan.id, plan.defaultConfig);
        }
      });
      return;
    }
    if (shared) return load(plan.id, shared);
    if (params.get("plan")) return load(plan.id, plan.defaultConfig);
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null") as { planId: string; config: unknown } | null;
      if (draft) return load(getPlan(draft.planId).id, coerceConfig(draft.config));
    } catch { /* no draft */ }
    load(plan.id, plan.defaultConfig);
  }, [params, load, S.signInSave]);

  // Keep a local draft so work survives a refresh even without an account.
  useEffect(() => {
    if (!initialised.current) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ planId, config })); } catch { /* storage unavailable */ }
  }, [planId, config]);

  // Keyboard shortcuts: undo / redo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable]")) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  // Warn before leaving with unsaved changes to a saved design.
  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => { if (dirty && designId) e.preventDefault(); };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [dirty, designId]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => useViewer.subscribe((s, prev) => {
    if (s.inspected !== prev.inspected && s.inspected) setTab("inspect");
  }), []);

  const capture = useCallback(async (scale = 1) => useViewer.getState().requestScreenshot(scale), []);

  const loadSaved = useCallback(async () => {
    if (!signedIn) return;
    const r = await api<{ designs: SavedDesign[] }>("/api/designs");
    if (r.ok) setSaved(r.data.designs);
  }, [signedIn]);

  // ── Actions ──
  const save = async (asNew: boolean) => {
    if (!designName.trim()) return setNotice({ kind: "error", text: S.nameRequired });
    setBusy(true);
    const thumbnail = await thumbnailFrom(await capture(1));
    const body = { name: designName.trim(), presetId: planId, config, thumbnail };
    const r = designId && !asNew
      ? await api<{ design: { id: string } }>(`/api/designs/${designId}`, { method: "PATCH", body })
      : await api<{ design: { id: string } }>("/api/designs", { body });
    setBusy(false);
    if (!r.ok) return setNotice({ kind: "error", text: r.error });
    setDesignId(r.data.design.id);
    markSaved();
    setDialog(null);
    setNotice({ kind: "ok", text: fmt(S.savedMsg, { name: designName.trim() }) });
    router.replace(`/studio?design=${r.data.design.id}`, { scroll: false });
  };

  const takeSnapshot = async () => {
    const thumbnail = await thumbnailFrom(await capture(1), 480);
    const n = snapshots.length + 1;
    setSnapshots((s) => [...s, { id: `snap-${Date.now()}`, name: fmt(S.snapshotName, { n: num(locale, n) }), presetId: planId, config: structuredClone(config), thumbnail }].slice(-6));
    setNotice({ kind: "ok", text: fmt(S.snapshotTaken, { n: num(locale, n) }) });
  };

  const openCompare = async () => {
    setCurrentThumb(await thumbnailFrom(await capture(1), 640));
    void loadSaved();
    setDialog("compare");
  };

  const exportImage = async (scale: number) => {
    setBusy(true);
    const url = await capture(scale);
    setBusy(false);
    download(url, `${plan.id}-${scale > 1 ? "4k" : "hd"}.png`);
    setDialog(null);
  };

  const summaryText = useMemo(() => {
    const lines = [fmt(S.summaryHeading, { name: pName }), "", ...summarizeModelL(m, locale, model).map((l) => `• ${l}`), ""];
    for (const sec of describeConfigL(m, locale, config)) {
      lines.push(sec.section);
      for (const r of sec.rows) lines.push(`  ${r.label}: ${r.value}`);
      lines.push("");
    }
    lines.push(fmt(S.summaryDisclaimer, { area: num(locale, model.stats.grossFloorArea) }));
    return lines.join("\n");
  }, [m, locale, pName, model, config, S]);

  const tabs: { id: Tab; label: string }[] = (["exterior", "interior", "environment", "view", "inspect"] as const).map((id) => ({ id, label: S.tabs[id] }));

  const actions = (
    <>
      <Button size="sm" variant="overlay" onClick={takeSnapshot}>{S.snapshot}</Button>
      <Button size="sm" variant="overlay" onClick={openCompare}>{S.compare}</Button>
      <Button size="sm" variant="overlay" onClick={() => setDialog("export")}>{S.export}</Button>
      <Button size="sm" variant="overlay" onClick={() => setDialog("summary")}>{S.summary}</Button>
      <Button size="sm" onClick={() => { if (!designName) setDesignName(fmt(S.variation, { name: pName })); setDialog("save"); }}>
        {designId ? (dirty ? S.saveChanges : S.savedState) : S.saveDesign}
      </Button>
    </>
  );
  const nextStudio = encodeURIComponent(`/studio?plan=${planId}&config=${encodeConfig(config)}`);

  return (
    <div className="lg:grid lg:h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,1fr)_380px]">
      <div ref={stageRef} className="relative h-[58dvh] min-h-[340px] bg-canvas lg:h-full">
        <SceneCanvas className="absolute inset-0" preserveDrawingBuffer label={fmt(S.modelLabel, { name: pName })}
          onPointerMissed={() => useViewer.getState().set({ inspected: null, selectedRoom: null })}
          fallback={
            <div className="absolute inset-0 grid place-items-center bg-surface p-6 text-center">
              <div className="w-full max-w-2xl">
                <ElevationDrawing model={model} className="mx-auto h-56 w-full text-stone" title={fmt(m.explorer.elevation, { name: pName })} />
                <p className="mt-4 text-sm text-muted">{S.noWebgl}</p>
              </div>
            </div>
          }>
          <BuildingScene model={model} config={config} interactive><MeasureOverlay /></BuildingScene>
          <ExplorerCamera model={model} />
        </SceneCanvas>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3 sm:p-4">
          <div className="pointer-events-auto flex flex-wrap items-center gap-2">
            <label className="glass flex items-center gap-2 rounded-lg border hairline px-3 py-2 text-sm">
              <span className="sr-only text-muted sm:not-sr-only">{m.explorer.building}</span>
              <select className="bg-transparent font-medium text-ink outline-none" value={planId} onChange={(e) => setPlan(e.target.value)} aria-label={S.buildingType}>
                {PLANS.map((p) => <option key={p.id} value={p.id} className="bg-canvas">{planName(m, p)}</option>)}
              </select>
            </label>
            <div className="glass flex gap-1 rounded-lg border hairline p-1" role="toolbar" aria-label={S.history}>
              <IconButton label={S.undo} onClick={undo} disabled={past.length === 0}>
                <svg className="rtl:-scale-x-100" width="18" height="18" viewBox="0 0 18 18" aria-hidden><path d="M7 4L3 8l4 4M3 8h8a4 4 0 010 8H8" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
              </IconButton>
              <IconButton label={S.redo} onClick={redo} disabled={future.length === 0}>
                <svg className="rtl:-scale-x-100" width="18" height="18" viewBox="0 0 18 18" aria-hidden><path d="M11 4l4 4-4 4M15 8H7a4 4 0 000 8h3" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
              </IconButton>
              <IconButton label={S.restore} onClick={restoreDefaults}>
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden><path d="M3 9a6 6 0 106-6H6M6 1v4h4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
              </IconButton>
            </div>
          </div>
          <div className="pointer-events-auto hidden flex-wrap gap-2 md:flex">{actions}</div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex justify-center p-3 sm:p-4"><PresetBar className="max-w-full" /></div>
        {notice && (
          <div role="status" className={cn("absolute inset-x-4 top-20 z-10 mx-auto w-fit max-w-[calc(100%-2rem)] rounded-lg border px-4 py-2.5 text-sm shadow-panel", notice.kind === "ok" ? "border-success/40 bg-raised text-ink" : "border-danger/40 bg-raised text-danger")}>
            {notice.text}
          </div>
        )}
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto border-b hairline bg-surface px-3 py-2 md:hidden" role="toolbar" aria-label={S.actions}>{actions}</div>

      <aside className="flex flex-col border-s hairline bg-surface/60 lg:overflow-hidden" aria-label={S.options}>
        <div role="tablist" aria-label={S.optionGroups} className="no-scrollbar flex shrink-0 overflow-x-auto border-b hairline bg-surface">
          {tabs.map((t) => (
            <button key={t.id} role="tab" type="button" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
              className={cn("shrink-0 flex-1 px-3 py-3 text-sm font-medium transition-colors", tab === t.id ? "border-b-2 border-accent text-ink" : "text-muted hover:text-ink")}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {designId && <p className="text-xs text-muted">{S.editing} <span className="text-ink">{designName}</span>{dirty ? ` — ${S.unsaved}` : ""}</p>}
          {tab === "exterior" && <ExteriorPanel />}
          {tab === "interior" && <InteriorPanel />}
          {tab === "environment" && <EnvironmentPanel hasPool={Boolean(plan.pool)} />}
          {tab === "view" && <ViewControls model={model} fullscreenTarget={stageRef} />}
          {tab === "inspect" && <Inspector model={model} config={config} />}
        </div>
        <div className="shrink-0 border-t hairline p-4">
          <ButtonLink href={designId && !dirty ? `/quote?design=${designId}` : "#"} className="w-full"
            onClick={(e) => {
              if (designId && !dirty) return;
              e.preventDefault();
              setNotice({ kind: "error", text: signedIn ? S.needSave : S.needSignIn });
              if (signedIn) { if (!designName) setDesignName(fmt(S.variation, { name: pName })); setDialog("save"); }
            }}>
            {S.requestQuote}
          </ButtonLink>
        </div>
      </aside>

      <Dialog open={dialog === "save"} onClose={() => setDialog(null)} title={designId ? S.saveTitleExisting : S.saveTitle}
        footer={signedIn ? (
          <>
            {designId && <Button variant="secondary" onClick={() => save(true)} loading={busy}>{S.saveAsNew}</Button>}
            <Button onClick={() => save(false)} loading={busy}>{designId ? S.saveChanges : m.common.save}</Button>
          </>
        ) : undefined}>
        {signedIn ? (
          <div className="space-y-3">
            <label className="field-label" htmlFor="design-name">{S.designName}</label>
            <input id="design-name" className="field" maxLength={80} value={designName} onChange={(e) => setDesignName(e.target.value)} autoFocus />
            {!pro && <p className="field-hint">{fmt(S.freeLimit, { n: num(locale, freeLimit) })} <Link className="text-accent-ink hover:underline" href="/pricing#studio-pro">{S.studioPro}</Link> {S.proRemoves}</p>}
          </div>
        ) : (
          <div className="space-y-4 text-sm text-muted">
            <p>{S.signedOutSave}</p>
            <div className="flex gap-2">
              <ButtonLink href={`/login?next=${nextStudio}`}>{m.common.signIn}</ButtonLink>
              <ButtonLink variant="secondary" href={`/register?next=${nextStudio}`}>{S.createAccount}</ButtonLink>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={dialog === "compare"} onClose={() => { setDialog(null); setCompareTarget(null); }} title={S.compareTitle} wide>
        <CompareView m={m} locale={locale} current={{ planId, config, thumbnail: currentThumb }} target={compareTarget}
          candidates={[...snapshots, ...saved.map((d) => ({ id: d.id, name: d.name, presetId: d.presetId, config: coerceConfig(d.config), thumbnail: d.thumbnail ?? "" }))]}
          onPick={setCompareTarget}
          onRestore={(s) => { load(s.presetId, s.config, { keepHistory: true }); setDialog(null); setCompareTarget(null); }}
          signedIn={signedIn} />
      </Dialog>

      <Dialog open={dialog === "export"} onClose={() => setDialog(null)} title={S.exportTitle}>
        <div className="space-y-3">
          <p className="text-sm text-muted">{S.exportBody}</p>
          <Button className="w-full" variant="secondary" loading={busy} onClick={() => exportImage(1)}>{S.screenRes}</Button>
          <Button className="w-full" variant="secondary" loading={busy} disabled={!pro} onClick={() => exportImage(2.5)}>{S.highRes}{pro ? "" : ` · ${S.studioPro}`}</Button>
          {!pro && <p className="text-xs text-muted">{S.proOnly} <Link href="/pricing#studio-pro" className="text-accent-ink hover:underline">{S.studioPro}</Link>.</p>}
        </div>
      </Dialog>

      <Dialog open={dialog === "summary"} onClose={() => setDialog(null)} title={S.summaryTitle} wide
        footer={
          <>
            <Button variant="secondary" onClick={() => { void navigator.clipboard?.writeText(summaryText); setNotice({ kind: "ok", text: S.copied }); }}>{S.copy}</Button>
            <Button variant="secondary" onClick={() => download(URL.createObjectURL(new Blob([summaryText], { type: "text/plain;charset=utf-8" })), `${plan.id}-summary.txt`)}>{S.download}</Button>
            <Button onClick={() => window.print()}>{S.print}</Button>
          </>
        }>
        <SummaryBody m={m} locale={locale} name={pName} description={planDescription(m, plan)} stats={model.stats} lines={summarizeModelL(m, locale, model)} config={config} />
      </Dialog>
    </div>
  );
}

function SummaryBody({ m, locale, name, description, stats, lines, config }: { m: Messages; locale: Locale; name: string; description: string; stats: BuildingStats; lines: string[]; config: BuildingConfig }) {
  return (
    <div className="print-area space-y-6">
      <div>
        <p className="eyebrow">{m.studio.summaryEyebrow}</p>
        <h3 className="mt-1 font-display text-3xl">{name}</h3>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <ul className="grid gap-2 text-sm sm:grid-cols-2">{lines.map((l) => <li key={l} className="rounded border hairline px-3 py-2">{l}</li>)}</ul>
      <div className="grid gap-6 sm:grid-cols-3">
        {describeConfigL(m, locale, config).map((s) => (
          <div key={s.section}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{s.section}</p>
            <dl className="mt-2 space-y-1.5 text-sm">
              {s.rows.map((r) => <div key={r.label} className="flex justify-between gap-3"><dt className="text-muted">{r.label}</dt><dd className="text-end">{r.value}</dd></div>)}
            </dl>
          </div>
        ))}
      </div>
      <p className="rounded border hairline bg-surface p-3 text-xs text-muted">{fmt(m.studio.summaryDisclaimer, { area: num(locale, stats.grossFloorArea) })}</p>
    </div>
  );
}

function CompareView({ m, locale, current, target, candidates, onPick, onRestore, signedIn }: {
  m: Messages; locale: Locale;
  current: { planId: string; config: BuildingConfig; thumbnail: string | null };
  target: Snapshot | null;
  candidates: Snapshot[];
  onPick: (s: Snapshot) => void;
  onRestore: (s: Snapshot) => void;
  signedIn: boolean;
}) {
  const S = m.studio;
  if (!target) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">{S.comparePick}</p>
        {candidates.length === 0 && <p className="rounded border hairline p-4 text-sm text-muted">{signedIn ? S.compareEmptyAccount : S.compareEmpty}</p>}
        <div className="grid gap-4 sm:grid-cols-3">
          {candidates.map((c) => (
            <button key={c.id} type="button" onClick={() => onPick(c)} className="group overflow-hidden rounded-lg border hairline text-start hover:border-accent">
              {c.thumbnail ? <img src={c.thumbnail} alt="" className="aspect-[16/10] w-full object-cover" /> : <div className="aspect-[16/10] bg-surface" />}
              <p className="px-3 py-2 text-sm text-ink">{c.name}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }
  const a = generateBuilding(getPlan(target.presetId), target.config).stats;
  const b = generateBuilding(getPlan(current.planId), current.config).stats;
  const diffs = target.presetId === current.planId ? diffConfigsL(m, locale, target.config, current.config) : [];
  const n = (v: number, d = 0) => num(locale, v, d);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {[{ label: target.name, src: target.thumbnail }, { label: S.current, src: current.thumbnail }].map((x) => (
          <figure key={x.label}>
            {x.src ? <img src={x.src} alt={x.label} className="aspect-[16/10] w-full rounded-lg border hairline object-cover" /> : <div className="aspect-[16/10] rounded-lg bg-surface" />}
            <figcaption className="mt-2 text-sm font-medium">{x.label}</figcaption>
          </figure>
        ))}
      </div>
      <table className="table-base">
        <thead><tr><th>{S.measureCol}</th><th>{target.name}</th><th>{S.current}</th></tr></thead>
        <tbody>
          {target.presetId !== current.planId && <tr><td>{S.buildingRow}</td><td>{planName(m, getPlan(target.presetId))}</td><td>{planName(m, getPlan(current.planId))}</td></tr>}
          <tr><td>{S.glazingArea}</td><td>{n(a.glazingArea)} m²</td><td>{n(b.glazingArea)} m²</td></tr>
          <tr><td>{S.glazingRatio}</td><td>{n(Math.round(a.glazingRatio * 100))}%</td><td>{n(Math.round(b.glazingRatio * 100))}%</td></tr>
          <tr><td>{S.height}</td><td>{n(a.height, 1)} m</td><td>{n(b.height, 1)} m</td></tr>
          {diffs.map((d) => <tr key={d.path}><td>{d.label}</td><td>{d.a}</td><td>{d.b}</td></tr>)}
          {diffs.length === 0 && target.presetId === current.planId && <tr><td colSpan={3} className="text-muted">{S.identical}</td></tr>}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => onRestore(target)}>{fmt(S.load, { name: target.name })}</Button></div>
    </div>
  );
}
