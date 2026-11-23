"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, FormSuccess, TextArea, TextInput, formObject, useSubmit } from "./Field";

export function ReviewForm() {
  const { submit, busy, error, fields } = useSubmit<{ message: string }>("/api/reviews");
  const [rating, setRating] = useState(5);
  const [done, setDone] = useState<string | null>(null);
  if (done) return <FormSuccess message={done} />;
  return (
    <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); const r = await submit({ ...formObject(e.currentTarget), rating }); if (r) setDone(r.message); }}>
      <FormError message={error} />
      <fieldset>
        <legend className="field-label">Rating</legend>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)}
              className={n <= rating ? "text-2xl text-accent" : "text-2xl text-ink/25"}>★</button>
          ))}
        </div>
      </fieldset>
      <TextInput label="Title" name="title" required maxLength={100} error={fields.title} />
      <TextArea label="Your review" name="body" required minLength={20} maxLength={2000} error={fields.body} />
      <Button type="submit" loading={busy}>Submit review</Button>
    </form>
  );
}
