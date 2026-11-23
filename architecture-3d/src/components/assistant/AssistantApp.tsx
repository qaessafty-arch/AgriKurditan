"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FormError, SelectInput, TextArea, TextInput } from "@/components/forms/Field";
import { track } from "@/components/layout/ConsentBanner";
import { getPlan } from "@/three/plans";
import { mergeConfig } from "@/three/config";
import { encodeConfig } from "@/three/share";
import type { BriefOutput } from "@/lib/ai/schema";
import { cn } from "@/lib/cn";

const STYLES = [
  ["modern", "Modern"], ["minimalist", "Minimalist"], ["brutalist", "Brutalist"], ["classical", "Classical"], ["luxury", "Luxury"], ["regional", "Regional / traditional"],
] as const;
const MAX_PHOTOS = 4;
const MAX_BYTES = 8 * 1024 * 1024;

interface Result { id: string; output: BriefOutput; provider: "claude" | "rules"; model: string | null; notice: string | null; disclaimer: string }

export function AssistantApp({ providerLabel }: { providerLabel: string }) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => { track("assistant_open"); }, []);
  useEffect(() => {
    const urls = photos.map((p) => URL.createObjectURL(p));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  const addPhotos = (list: FileList | null) => {
    if (!list) return;
    const accepted: File[] = [];
    for (const f of Array.from(list)) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) { setError(`${f.name}: use JPEG, PNG or WebP.`); continue; }
      if (f.size > MAX_BYTES) { setError(`${f.name} is larger than 8 MB.`); continue; }
      accepted.push(f);
    }
    setPhotos((p) => [...p, ...accepted].slice(0, MAX_PHOTOS));
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true); setError(null); setFields({});
    const fd = new FormData(e.currentTarget);
    fd.delete("photos");
    photos.forEach((p) => fd.append("photos", p));
    styles.forEach((s) => fd.append("styles", s));
    try {
      const res = await fetch("/api/assistant", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(json.error ?? "Something went wrong."); setFields(json.fields ?? {}); return; }
      setResult(json as Result);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
      <form onSubmit={submit} className="space-y-5" aria-describedby="assistant-note">
        <FormError message={error} />
        <TextArea label="Describe what you want to build" name="description" required minLength={20} maxLength={3000} error={fields.description}
          placeholder="e.g. A family home for five with a garden, a guest room on the ground floor and a shaded terrace. We like natural stone and lots of daylight." />
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectInput label="Building type" name="buildingType" options={[{ value: "residential", label: "Residential" }, { value: "commercial", label: "Commercial" }]} />
          <TextInput label="Location (optional)" name="location" placeholder="City or region" maxLength={120} error={fields.location} />
          <TextInput label="Land width, m" name="landWidth" type="number" min={5} step="0.1" required inputMode="decimal" error={fields.landWidth} hint="Along the street" />
          <TextInput label="Land depth, m" name="landDepth" type="number" min={5} step="0.1" required inputMode="decimal" error={fields.landDepth} />
          <TextInput label="Floors (optional)" name="floors" type="number" min={1} max={6} inputMode="numeric" error={fields.floors} />
          <TextInput label="Bedrooms (optional)" name="bedrooms" type="number" min={0} max={12} inputMode="numeric" error={fields.bedrooms} />
          <TextInput label="Budget (optional)" name="budget" type="number" min={0} inputMode="decimal" error={fields.budget} />
          <SelectInput label="Currency" name="currency" options={[{ value: "USD", label: "USD" }, { value: "IQD", label: "IQD" }, { value: "EUR", label: "EUR" }]} />
        </div>
        <fieldset>
          <legend className="field-label">Architectural preferences</legend>
          <div className="flex flex-wrap gap-2">
            {STYLES.map(([id, label]) => {
              const on = styles.includes(id);
              return (
                <button key={id} type="button" aria-pressed={on} onClick={() => setStyles((s) => (on ? s.filter((x) => x !== id) : [...s, id].slice(0, 4)))}
                  className={cn("rounded-full border px-3.5 py-1.5 text-sm transition-colors", on ? "border-accent bg-accent/15 text-ink" : "border-line text-muted hover:text-ink")}>
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div>
          <label htmlFor="photos" className="field-label">Land photographs (optional, up to 4)</label>
          <input id="photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={photos.length >= MAX_PHOTOS}
            onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }}
            className="block w-full text-sm text-muted file:mr-3 file:rounded file:border file:border-line-strong file:bg-transparent file:px-3 file:py-2 file:text-ink" />
          {previews.length > 0 && (
            <ul className="mt-3 grid grid-cols-4 gap-2">
              {previews.map((src, i) => (
                <li key={src} className="relative">
                  <img src={src} alt={`Land photo ${i + 1}`} className="aspect-square w-full rounded object-cover" />
                  <button type="button" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded bg-canvas/80 px-1.5 text-xs text-ink" aria-label={`Remove photo ${i + 1}`}>×</button>
                </li>
              ))}
            </ul>
          )}
          <p className="field-hint">Photos are stored privately and shared only with our architects.</p>
        </div>
        <Button type="submit" size="lg" loading={busy}>{busy ? "Preparing your brief…" : "Generate preliminary brief"}</Button>
        <p id="assistant-note" className="text-xs leading-relaxed text-muted">{providerLabel} Suggestions are preliminary and must be reviewed by a qualified architect.</p>
      </form>

      <div ref={resultRef} aria-live="polite">
        {result ? <BriefView r={result} /> : (
          <div className="card grid h-full min-h-[320px] place-items-center p-8 text-center">
            <div className="max-w-sm">
              <p className="font-display text-2xl text-ink">Your brief appears here</p>
              <p className="mt-2 text-sm text-muted">You will get a suggested space programme, massing, materials, site observations and a starting design you can open in the 3D studio.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BriefView({ r }: { r: Result }) {
  const o = r.output;
  const plan = getPlan(o.suggestedPlanId);
  const c = o.suggestedConfig;
  const config = mergeConfig(plan.defaultConfig, {
    exterior: { wall: c.wall, accent: c.accent, pattern: c.pattern, windows: c.windows, glass: c.glass, roof: c.roof },
    interior: { floor: c.floor, furniture: c.furniture },
    environment: { landscape: c.landscape, pool: c.pool && Boolean(plan.pool), garden: c.garden },
  });
  const total = o.program.reduce((s, p) => s + p.areaM2, 0);
  return (
    <article className="space-y-8">
      <div role="note" className="rounded-lg border border-accent/50 bg-accent/10 p-4 text-sm leading-relaxed text-ink">
        <p className="font-semibold">Preliminary suggestion, not a construction document</p>
        <p className="mt-1 text-ink/85">{r.disclaimer}</p>
      </div>
      {r.notice && <p className="rounded border hairline p-3 text-sm text-muted">{r.notice}</p>}
      <div>
        <p className="eyebrow">Preliminary brief · {r.provider === "claude" ? "AI-assisted" : "Built-in rules engine"}</p>
        <p className="mt-3 text-lg leading-relaxed text-ink">{o.summary}</p>
      </div>
      <section><h2 className="font-display text-2xl text-ink">Site</h2><ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink/90">{o.siteObservations.map((s) => <li key={s}>{s}</li>)}</ul></section>
      <section>
        <h2 className="font-display text-2xl text-ink">Space programme</h2>
        <table className="table-base mt-3"><thead><tr><th>Space</th><th className="text-right">m²</th><th>Notes</th></tr></thead>
          <tbody>{o.program.map((p) => <tr key={p.space}><td>{p.space}</td><td className="text-right font-mono">{p.areaM2}</td><td className="text-muted">{p.notes}</td></tr>)}
            <tr><td className="font-medium">Total (approx.)</td><td className="text-right font-mono font-medium">{Math.round(total)}</td><td /></tr></tbody>
        </table>
      </section>
      <section><h2 className="font-display text-2xl text-ink">Massing</h2><p className="mt-2 text-sm leading-relaxed text-ink/90">{o.massing}</p></section>
      <section><h2 className="font-display text-2xl text-ink">Suggested materials</h2>
        <dl className="mt-3 space-y-2 text-sm">{o.materials.map((m) => <div key={m.name}><dt className="font-medium text-ink">{m.name}</dt><dd className="text-muted">{m.reason}</dd></div>)}</dl>
      </section>
      <section><h2 className="font-display text-2xl text-ink">For the architect and engineer to verify</h2><ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink/90">{o.considerations.map((s) => <li key={s}>{s}</li>)}</ul></section>
      <section><h2 className="font-display text-2xl text-ink">Budget</h2><p className="mt-2 text-sm text-ink/90">{o.budgetNote}</p></section>
      <section className="card p-5">
        <h2 className="font-display text-2xl text-ink">Starting design: {plan.name}</h2>
        <p className="mt-1 text-sm text-muted">{plan.description} Configured with your suggested materials. Adjust everything in the studio.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink href={`/studio?plan=${plan.id}&config=${encodeConfig(config)}`}>Open in 3D studio</ButtonLink>
          <ButtonLink href={`/consultation?brief=${r.id}&topic=${encodeURIComponent("Review my preliminary brief")}`} variant="secondary">Review with an architect</ButtonLink>
          <ButtonLink href={`/quote?brief=${r.id}`} variant="ghost">Request a quote</ButtonLink>
        </div>
      </section>
      <section><h2 className="font-display text-2xl text-ink">Next steps</h2><ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-ink/90">{o.nextSteps.map((s) => <li key={s}>{s}</li>)}</ol></section>
      <p className="text-xs text-muted">Brief reference {r.id}. <Link href="/privacy" className="underline">How we handle your data</Link>.</p>
    </article>
  );
}
