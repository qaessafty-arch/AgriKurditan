"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/cn";

export type FieldSpec =
  | { name: string; label: string; type: "text" | "number" | "textarea" | "date" | "datetime-local" | "email"; value?: string | number | null; hint?: string }
  | { name: string; label: string; type: "select"; value?: string; options: { value: string; label: string }[] }
  | { name: string; label: string; type: "checkbox"; value?: boolean };

/** Small form that sends edited fields to an admin endpoint and refreshes the page. */
export function PatchForm({ url, method = "PATCH", fields, submitLabel = "Save", compact, extra, onDone }: {
  url: string; method?: string; fields: FieldSpec[]; submitLabel?: string; compact?: boolean; extra?: Record<string, unknown>; onDone?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [errs, setErrs] = useState<Record<string, string>>({});
  return (
    <form className={cn(compact ? "flex flex-wrap items-end gap-2" : "space-y-3")} onSubmit={async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const body: Record<string, unknown> = { ...extra };
      for (const f of fields) {
        if (f.type === "checkbox") body[f.name] = fd.get(f.name) === "on";
        else if (f.type === "number") { const v = fd.get(f.name); body[f.name] = v === "" ? null : Number(v); }
        else body[f.name] = fd.get(f.name);
      }
      setBusy(true); setMsg(null); setErrs({});
      const r = await api(url, { method, body });
      setBusy(false);
      if (!r.ok) { setMsg({ ok: false, text: r.error }); setErrs(r.fields ?? {}); return; }
      setMsg({ ok: true, text: "Saved" });
      onDone?.();
      router.refresh();
    }}>
      {fields.map((f) => (
        <label key={f.name} className={cn("block text-sm", f.type === "checkbox" && "flex items-center gap-2", compact && f.type !== "checkbox" && "min-w-[8rem]")}>
          {f.type === "checkbox" ? (
            <><input type="checkbox" name={f.name} defaultChecked={Boolean(f.value)} className="h-4 w-4 accent-[rgb(var(--accent))]" /><span>{f.label}</span></>
          ) : (
            <>
              <span className={cn("mb-1 block text-muted", compact ? "text-xs" : "text-sm")}>{f.label}</span>
              {f.type === "textarea" ? <textarea name={f.name} defaultValue={(f.value as string) ?? ""} className="field min-h-[5rem]" />
                : f.type === "select" ? <select name={f.name} defaultValue={f.value} className="field">{f.options.map((o) => <option key={o.value} value={o.value} className="bg-canvas">{o.label}</option>)}</select>
                : <input name={f.name} type={f.type} step={f.type === "number" ? "0.01" : undefined} defaultValue={f.value ?? ""} className="field" />}
              {"hint" in f && f.hint && <span className="field-hint block">{f.hint}</span>}
            </>
          )}
          {errs[f.name] && <span className="field-error block">{errs[f.name]}</span>}
        </label>
      ))}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" loading={busy}>{submitLabel}</Button>
        {msg && <span role="status" className={cn("text-xs", msg.ok ? "text-success" : "text-danger")}>{msg.text}</span>}
      </div>
    </form>
  );
}
