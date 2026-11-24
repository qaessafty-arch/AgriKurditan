"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, TextInput } from "@/components/forms/Field";
import { useI18n, useLocaleRouter } from "@/i18n/client";
import { fmt } from "@/i18n/config";

export function PaymentForm({ orderId, amount, currency }: { orderId: string; amount: number; currency: string }) {
  const { m, locale } = useI18n();
  const F = m.order.form;
  const router = useLocaleRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault();
      setBusy(true); setError(null); setFields({});
      try {
        const res = await fetch(`/api/orders/${orderId}/payment`, { method: "POST", body: new FormData(e.currentTarget), headers: { "x-a3d-locale": locale } });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) { setError(json.error ?? F.couldNot); setFields(json.fields ?? {}); return; }
        router.refresh();
      } catch { setError(m.common.networkError); } finally { setBusy(false); }
    }}>
      <FormError message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label={F.reference} name="reference" required minLength={3} maxLength={80} error={fields.reference} dir="ltr" />
        <TextInput label={fmt(F.amount, { currency })} name="amount" type="number" step="0.01" min={0} defaultValue={amount} required error={fields.amount} />
        <TextInput label={F.payer} name="payerName" maxLength={120} error={fields.payerName} />
        <div>
          <label htmlFor="proof" className="field-label">{F.proof}</label>
          <input id="proof" name="proof" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="block w-full text-sm text-muted file:me-3 file:rounded file:border file:border-line-strong file:bg-transparent file:px-3 file:py-2 file:text-ink" />
          <p className="field-hint">{F.proofHint}</p>
        </div>
      </div>
      <Button type="submit" loading={busy}>{F.submit}</Button>
    </form>
  );
}
