"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, SelectInput, TextArea, TextInput, formObject, useSubmit } from "@/components/forms/Field";

export function ProjectSubmitForm({ designs }: { designs: { id: string; name: string }[] }) {
  const router = useRouter();
  const { submit, busy, error, fields } = useSubmit("/api/account/projects");
  const [done, setDone] = useState(false);
  if (done) return <p role="status" className="rounded border border-success/40 bg-success/10 p-3 text-sm">Submitted. We review projects before they appear in the gallery.</p>;
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const f = formObject(e.currentTarget);
      if (await submit({ ...f, styles: fd.getAll("styles"), categories: fd.getAll("categories"), showLocation: f.showLocation === "on", isConcept: f.isConcept === "on" })) { setDone(true); router.refresh(); }
    }}>
      <FormError message={error} />
      <SelectInput label="3D model (saved design)" name="designId" options={designs.map((d) => ({ value: d.id, label: d.name }))} error={fields.designId} />
      <TextInput label="Title" name="title" required maxLength={100} error={fields.title} />
      <TextInput label="Summary" name="summary" required maxLength={200} error={fields.summary} />
      <TextArea label="Description" name="description" required minLength={30} error={fields.description} />
      <fieldset><legend className="field-label">Styles</legend><div className="flex flex-wrap gap-3 text-sm">
        {["modern", "minimalist", "brutalist", "classical", "luxury"].map((s) => <label key={s} className="flex items-center gap-1.5 capitalize"><input type="checkbox" name="styles" value={s} className="accent-[rgb(var(--accent))]" />{s}</label>)}
      </div>{fields.styles && <p className="field-error">{fields.styles}</p>}</fieldset>
      <fieldset><legend className="field-label">Categories</legend><div className="flex flex-wrap gap-3 text-sm">
        {["residential", "commercial", "interior", "landscape"].map((s) => <label key={s} className="flex items-center gap-1.5 capitalize"><input type="checkbox" name="categories" value={s} className="accent-[rgb(var(--accent))]" />{s}</label>)}
      </div>{fields.categories && <p className="field-error">{fields.categories}</p>}</fieldset>
      <TextInput label="Location (optional)" name="location" maxLength={120} />
      <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="showLocation" className="accent-[rgb(var(--accent))]" />The client has authorised showing the location</label>
      <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="isConcept" defaultChecked className="accent-[rgb(var(--accent))]" />This is a concept study (not built)</label>
      <Button type="submit" loading={busy}>Submit for review</Button>
    </form>
  );
}
