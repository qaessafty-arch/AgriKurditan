"use client";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function ControlGroup({ title, children, hint }: { title: string; children: ReactNode; hint?: string }) {
  return (
    <fieldset className="space-y-2.5">
      <legend className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</legend>
      {children}
      {hint && <p className="text-xs leading-relaxed text-muted">{hint}</p>}
    </fieldset>
  );
}

export function Segmented<T extends string>({
  label, value, options, onChange, size = "md",
}: { label: string; value: T; options: readonly { id: T; label: string; note?: string }[]; onChange: (v: T) => void; size?: "sm" | "md" }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.note ?? o.label}
            onClick={() => onChange(o.id)}
            className={cn(
              "rounded border text-left transition-colors",
              size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm",
              active ? "border-accent bg-accent/15 text-ink" : "border-line text-muted hover:border-line-strong hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Slider({
  label, value, min, max, step, onChange, onCommit, format, disabled,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; onCommit?: () => void; format?: (v: number) => string; disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className={cn(disabled && "opacity-50")}>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <label htmlFor={id} className="text-ink">{label}</label>
        <span className="font-mono text-xs text-muted" aria-hidden>{format ? format(value) : value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={format ? format(value) : String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
        onBlur={onCommit}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink/15 accent-[rgb(var(--accent))]"
      />
    </div>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-sm text-ink" title={hint}>{label}</label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative h-6 w-11 shrink-0 rounded-full border transition-colors", checked ? "border-accent bg-accent/70" : "border-line-strong bg-ink/10")}
      >
        <span className={cn("absolute left-0.5 top-0.5 h-4 w-4 rounded-full transition-transform", checked ? "translate-x-5 bg-[#101114]" : "translate-x-0 bg-ink")} />
      </button>
    </div>
  );
}

export function ColorField({ label, value, onChange, onCommit }: { label: string; value: string; onChange: (v: string) => void; onCommit: () => void }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-sm text-ink">{label}</label>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-muted">{value.toUpperCase()}</span>
        <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value)} onBlur={onCommit} onPointerUp={onCommit}
          className="h-8 w-10 cursor-pointer rounded border border-line-strong bg-transparent p-0.5" />
      </div>
    </div>
  );
}

export function IconButton({ label, onClick, active, children, disabled }: { label: string; onClick: () => void; active?: boolean; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "grid h-10 w-10 place-items-center rounded border transition-colors disabled:opacity-40",
        active ? "border-accent bg-accent/20 text-ink" : "border-line bg-canvas/40 text-muted hover:border-line-strong hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
