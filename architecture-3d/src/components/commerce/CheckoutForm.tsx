"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, TextArea, useSubmit } from "@/components/forms/Field";
import { useI18n, useLocaleRouter } from "@/i18n/client";

export function CheckoutForm({ offeringSlug, methods }: { offeringSlug: string; methods: { id: "bank_transfer" | "cash"; note: string }[] }) {
  const { m } = useI18n();
  const C = m.checkout;
  const router = useLocaleRouter();
  const [method, setMethod] = useState(methods[0]!.id);
  const [notes, setNotes] = useState("");
  const { submit, busy, error, fields } = useSubmit<{ id: string }>("/api/orders");
  return (
    <form className="space-y-6" onSubmit={async (e) => { e.preventDefault(); const r = await submit({ offeringSlug, method, notes }); if (r) router.push(`/account/orders/${r.id}`); }}>
      <FormError message={error} />
      <fieldset className="space-y-3">
        <legend className="field-label">{C.method}</legend>
        {methods.map((x) => (
          <label key={x.id} className="card flex cursor-pointer gap-3 p-4 has-[:checked]:border-accent">
            <input type="radio" name="method" value={x.id} checked={method === x.id} onChange={() => setMethod(x.id)} className="mt-1 accent-[rgb(var(--accent))]" />
            <span><span className="block font-medium text-ink">{C.methods[x.id]}</span><span className="mt-1 block text-sm text-muted" dir="auto">{x.note}</span></span>
          </label>
        ))}
      </fieldset>
      <TextArea label={C.notes} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} error={fields.notes} />
      <p className="text-xs text-muted">{C.notice}</p>
      <Button type="submit" size="lg" loading={busy}>{C.place}</Button>
    </form>
  );
}
