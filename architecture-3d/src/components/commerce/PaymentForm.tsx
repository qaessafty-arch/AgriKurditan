"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, TextInput } from "@/components/forms/Field";

export function PaymentForm({ orderId, amount, currency }: { orderId: string; amount: number; currency: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault();
      setBusy(true); setError(null); setFields({});
      try {
        const res = await fetch(`/api/orders/${orderId}/payment`, { method: "POST", body: new FormData(e.currentTarget) });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) { setError(json.error ?? "Could not submit."); setFields(json.fields ?? {}); return; }
        router.refresh();
      } catch { setError("Network error. Try again."); } finally { setBusy(false); }
    }}>
      <FormError message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Transfer reference or receipt number" name="reference" required minLength={3} maxLength={80} error={fields.reference} />
        <TextInput label={`Amount paid (${currency})`} name="amount" type="number" step="0.01" min={0} defaultValue={amount} required error={fields.amount} />
        <TextInput label="Payer name (optional)" name="payerName" maxLength={120} error={fields.payerName} />
        <div>
          <label htmlFor="proof" className="field-label">Receipt or screenshot (optional)</label>
          <input id="proof" name="proof" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="block w-full text-sm text-muted file:mr-3 file:rounded file:border file:border-line-strong file:bg-transparent file:px-3 file:py-2 file:text-ink" />
          <p className="field-hint">JPEG, PNG, WebP or PDF, up to 8 MB.</p>
        </div>
      </div>
      <Button type="submit" loading={busy}>Submit payment details</Button>
    </form>
  );
}
