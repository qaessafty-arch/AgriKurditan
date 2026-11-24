"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import { FormError, FormSuccess, TextArea, TextInput, formObject, useSubmit } from "./Field";

export function ReviewForm() {
  const { m } = useI18n();
  const R = m.pages.reviews;
  const { submit, busy, error, fields } = useSubmit<{ message: string }>("/api/reviews");
  const [rating, setRating] = useState(5);
  const [done, setDone] = useState<string | null>(null);
  if (done) return <FormSuccess message={done} />;
  return (
    <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); const r = await submit({ ...formObject(e.currentTarget), rating }); if (r) setDone(r.message); }}>
      <FormError message={error} />
      <fieldset>
        <legend className="field-label">{R.rating}</legend>
        <div className="flex gap-1" role="radiogroup" aria-label={R.rating}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={fmt(R.stars, { n })} onClick={() => setRating(n)}
              className={n <= rating ? "text-2xl text-accent" : "text-2xl text-ink/25"}>★</button>
          ))}
        </div>
      </fieldset>
      <TextInput label={R.reviewTitle} name="title" required maxLength={100} error={fields.title} />
      <TextArea label={R.body} name="body" required minLength={20} maxLength={2000} error={fields.body} />
      <Button type="submit" loading={busy}>{R.submit}</Button>
    </form>
  );
}
