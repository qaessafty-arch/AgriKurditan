"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, TextArea, useSubmit } from "@/components/forms/Field";

export function CheckoutForm({ offeringSlug, methods }: { offeringSlug: string; methods: { id: string; label: string; note: string }[] }) {
  const router = useRouter();
  const [method, setMethod] = useState(methods[0]!.id);
  const [notes, setNotes] = useState("");
  const { submit, busy, error, fields } = useSubmit<{ id: string }>("/api/orders");
  return (
    <form className="space-y-6" onSubmit={async (e) => { e.preventDefault(); const r = await submit({ offeringSlug, method, notes }); if (r) router.push(`/account/orders/${r.id}`); }}>
      <FormError message={error} />
      <fieldset className="space-y-3">
        <legend className="field-label">Payment method</legend>
        {methods.map((m) => (
          <label key={m.id} className="card flex cursor-pointer gap-3 p-4 has-[:checked]:border-accent">
            <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} className="mt-1 accent-[rgb(var(--accent))]" />
            <span><span className="block font-medium text-ink">{m.label}</span><span className="mt-1 block text-sm text-muted">{m.note}</span></span>
          </label>
        ))}
      </fieldset>
      <TextArea label="Notes for our team (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} error={fields.notes} />
      <p className="text-xs text-muted">Placing the order shows you the payment details and a reference. Nothing is charged automatically, and the order is confirmed once we verify your payment.</p>
      <Button type="submit" size="lg" loading={busy}>Place order</Button>
    </form>
  );
}
