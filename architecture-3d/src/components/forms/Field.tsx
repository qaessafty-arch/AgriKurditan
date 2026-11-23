"use client";
import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { api } from "@/lib/client-api";

export function Field({ label, error, hint, children, id }: { label: string; error?: string; hint?: string; children: (id: string, describedBy?: string) => ReactNode; id?: string }) {
  const auto = useId();
  const fid = id ?? auto;
  const describedBy = error ? `${fid}-error` : hint ? `${fid}-hint` : undefined;
  return (
    <div>
      <label htmlFor={fid} className="field-label">{label}</label>
      {children(fid, describedBy)}
      {error ? <p id={`${fid}-error`} className="field-error" role="alert">{error}</p> : hint ? <p id={`${fid}-hint`} className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function TextInput({ label, error, hint, ...rest }: { label: string; error?: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(id, d) => <input id={id} aria-invalid={Boolean(error) || undefined} aria-describedby={d} className="field" {...rest} />}
    </Field>
  );
}

export function TextArea({ label, error, hint, ...rest }: { label: string; error?: string; hint?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(id, d) => <textarea id={id} aria-invalid={Boolean(error) || undefined} aria-describedby={d} className="field min-h-[7rem] resize-y" {...rest} />}
    </Field>
  );
}

export function SelectInput({ label, error, hint, options, ...rest }: { label: string; error?: string; hint?: string; options: { value: string; label: string }[] } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(id, d) => (
        <select id={id} aria-invalid={Boolean(error) || undefined} aria-describedby={d} className="field" {...rest}>
          {options.map((o) => <option key={o.value} value={o.value} className="bg-canvas">{o.label}</option>)}
        </select>
      )}
    </Field>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <div role="alert" className="rounded border border-danger/40 bg-danger/10 px-3 py-2.5 text-sm text-danger">{message}</div>;
}

export function FormSuccess({ message }: { message?: string | null }) {
  if (!message) return null;
  return <div role="status" className="rounded border border-success/40 bg-success/10 px-3 py-2.5 text-sm text-ink">{message}</div>;
}

/** Submit JSON to an API and expose loading, top-level and per-field errors. */
export function useSubmit<T = unknown>(url: string, method = "POST") {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const submit = async (body: unknown): Promise<T | null> => {
    setBusy(true); setError(null); setFields({});
    const r = await api<T>(url, { method, body });
    setBusy(false);
    if (!r.ok) { setError(r.error); setFields(r.fields ?? {}); return null; }
    return r.data;
  };
  return { submit, busy, error, fields, setError };
}

export function formObject(form: HTMLFormElement): Record<string, FormDataEntryValue> {
  return Object.fromEntries(new FormData(form).entries());
}
