"use client";
import { useState } from "react";
import { api } from "@/lib/client-api";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/client";

export function NewsletterForm() {
  const { m } = useI18n();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{ kind: "idle" | "loading" | "done" | "error"; message?: string }>({ kind: "idle" });
  return (
    <form className="flex flex-col gap-2 sm:flex-row" onSubmit={async (e) => {
      e.preventDefault();
      setState({ kind: "loading" });
      const r = await api<{ message: string }>("/api/newsletter", { body: { email, source: "footer" } });
      setState(r.ok ? { kind: "done", message: r.data.message } : { kind: "error", message: r.fields?.email ?? r.error });
    }}>
      <label htmlFor="newsletter-email" className="sr-only">{m.newsletter.email}</label>
      <input id="newsletter-email" type="email" required autoComplete="email" placeholder={m.newsletter.placeholder} value={email} onChange={(e) => setEmail(e.target.value)} className="field sm:max-w-xs" />
      <Button type="submit" variant="secondary" loading={state.kind === "loading"}>{m.newsletter.subscribe}</Button>
      <p role="status" className={state.kind === "error" ? "text-xs text-danger sm:self-center" : "text-xs text-muted sm:self-center"}>{state.message}</p>
    </form>
  );
}
