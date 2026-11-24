"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, SelectInput, TextArea, TextInput, formObject, useSubmit } from "@/components/forms/Field";
import { useI18n, useLocaleRouter } from "@/i18n/client";

export function ProjectSubmitForm({ designs }: { designs: { id: string; name: string }[] }) {
  const { m } = useI18n();
  const F = m.account.pf, P = m.projects;
  const router = useLocaleRouter();
  const { submit, busy, error, fields } = useSubmit("/api/account/projects");
  const [done, setDone] = useState(false);
  if (done) return <p role="status" className="rounded border border-success/40 bg-success/10 p-3 text-sm">{F.done}</p>;
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const f = formObject(e.currentTarget);
      if (await submit({ ...f, styles: fd.getAll("styles"), categories: fd.getAll("categories"), showLocation: f.showLocation === "on", isConcept: f.isConcept === "on" })) { setDone(true); router.refresh(); }
    }}>
      <FormError message={error} />
      <SelectInput label={F.model} name="designId" options={designs.map((d) => ({ value: d.id, label: d.name }))} error={fields.designId} />
      <TextInput label={F.title} name="title" required maxLength={100} error={fields.title} />
      <TextInput label={F.summary} name="summary" required maxLength={200} error={fields.summary} />
      <TextArea label={F.description} name="description" required minLength={30} error={fields.description} />
      <fieldset><legend className="field-label">{F.styles}</legend><div className="flex flex-wrap gap-3 text-sm">
        {(Object.keys(P.styles) as (keyof typeof P.styles)[]).map((s) => <label key={s} className="flex items-center gap-1.5"><input type="checkbox" name="styles" value={s} className="accent-[rgb(var(--accent))]" />{P.styles[s]}</label>)}
      </div>{fields.styles && <p className="field-error">{fields.styles}</p>}</fieldset>
      <fieldset><legend className="field-label">{F.categories}</legend><div className="flex flex-wrap gap-3 text-sm">
        {(Object.keys(P.categories) as (keyof typeof P.categories)[]).map((s) => <label key={s} className="flex items-center gap-1.5"><input type="checkbox" name="categories" value={s} className="accent-[rgb(var(--accent))]" />{P.categories[s]}</label>)}
      </div>{fields.categories && <p className="field-error">{fields.categories}</p>}</fieldset>
      <TextInput label={F.location} name="location" maxLength={120} />
      <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="showLocation" className="accent-[rgb(var(--accent))]" />{F.showLocation}</label>
      <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="isConcept" defaultChecked className="accent-[rgb(var(--accent))]" />{F.concept}</label>
      <Button type="submit" loading={busy}>{F.submit}</Button>
    </form>
  );
}
