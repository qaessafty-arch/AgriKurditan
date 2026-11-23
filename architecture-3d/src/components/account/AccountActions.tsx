"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/client-api";

/** Generic "call an endpoint then refresh" button for account and admin actions. */
export function ActionButton({ url, method = "POST", body, label, confirm, variant = "secondary", size = "sm", redirect }: {
  url: string; method?: string; body?: unknown; label: string; confirm?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md"; redirect?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button size={size} variant={variant} loading={busy} onClick={async () => {
        if (confirm && !window.confirm(confirm)) return;
        setBusy(true); setError(null);
        const r = await api(url, { method, body: body ?? {} });
        setBusy(false);
        if (!r.ok) return setError(r.error);
        if (redirect) router.push(redirect);
        router.refresh();
      }}>{label}</Button>
      {error && <span role="alert" className="text-xs text-danger">{error}</span>}
    </span>
  );
}

export function SignOutButton() {
  const router = useRouter();
  return <Button variant="secondary" size="sm" onClick={async () => { await api("/api/auth/logout", { body: {} }); router.push("/"); router.refresh(); }}>Sign out</Button>;
}
