"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, FormSuccess, SelectInput, TextInput, formObject, useSubmit } from "@/components/forms/Field";
import { Link, useI18n, useLocaleRouter } from "@/i18n/client";

/** Only allow same-site relative redirects after sign-in (prevents open redirects). */
export function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/account";
  return next;
}

export function LoginForm() {
  const { m } = useI18n();
  const A = m.auth;
  const params = useSearchParams();
  const router = useLocaleRouter();
  const { submit, busy, error, fields } = useSubmit<{ role: string }>("/api/auth/login");
  const next = params.get("next");
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault();
      const r = await submit(formObject(e.currentTarget));
      if (!r) return;
      const dest = safeNext(next);
      if (dest === "/account" && r.role === "ADMIN") window.location.assign("/admin");
      else { router.replace(dest); router.refresh(); }
    }}>
      <FormError message={error} />
      <TextInput label={A.email} name="email" type="email" autoComplete="email" required error={fields.email} />
      <TextInput label={A.password} name="password" type="password" autoComplete="current-password" required error={fields.password} />
      <div className="flex items-center justify-between"><Link href="/forgot-password" className="text-sm text-accent-ink hover:underline">{A.forgot}</Link></div>
      <Button type="submit" className="w-full" size="lg" loading={busy}>{A.signIn}</Button>
      <p className="text-center text-sm text-muted">{A.newHere} <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-accent-ink hover:underline">{A.createAccount}</Link></p>
    </form>
  );
}

export function RegisterForm() {
  const { m, locale } = useI18n();
  const A = m.auth;
  const params = useSearchParams();
  const router = useLocaleRouter();
  const { submit, busy, error, fields } = useSubmit("/api/auth/register");
  const [type, setType] = useState("CUSTOMER");
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault();
      const f = formObject(e.currentTarget);
      const ok = await submit({ ...f, marketingOptIn: f.marketingOptIn === "on", acceptTerms: f.acceptTerms === "on", locale });
      if (ok) { router.replace(safeNext(params.get("next"))); router.refresh(); }
    }}>
      <FormError message={error} />
      <TextInput label={A.fullName} name="name" autoComplete="name" required minLength={2} maxLength={80} error={fields.name} />
      <TextInput label={A.email} name="email" type="email" autoComplete="email" required error={fields.email} />
      <TextInput label={A.password} name="password" type="password" autoComplete="new-password" required minLength={10} error={fields.password} hint={A.passwordHint} />
      <SelectInput label={A.iAm} name="accountType" value={type} onChange={(e) => setType(e.target.value)} error={fields.accountType}
        options={(["CUSTOMER", "ARCHITECT", "PARTNER"] as const).map((v) => ({ value: v, label: A.types[v] }))} />
      {type !== "CUSTOMER" && <TextInput label={A.company} name="company" maxLength={120} error={fields.company} />}
      <label className="flex items-start gap-2.5 text-sm text-muted">
        <input type="checkbox" name="acceptTerms" required className="mt-0.5 h-4 w-4 accent-[rgb(var(--accent))]" />
        <span>{A.accept} <Link href="/terms" className="text-accent-ink hover:underline">{A.terms}</Link> {A.and} <Link href="/privacy" className="text-accent-ink hover:underline">{A.privacy}</Link>.</span>
      </label>
      {fields.acceptTerms && <p className="field-error">{fields.acceptTerms}</p>}
      <label className="flex items-start gap-2.5 text-sm text-muted">
        <input type="checkbox" name="marketingOptIn" className="mt-0.5 h-4 w-4 accent-[rgb(var(--accent))]" /><span>{A.marketing}</span>
      </label>
      <Button type="submit" className="w-full" size="lg" loading={busy}>{A.create}</Button>
      <p className="text-center text-sm text-muted">{A.already} <Link href="/login" className="text-accent-ink hover:underline">{A.signIn}</Link></p>
    </form>
  );
}

export function ForgotForm() {
  const { m } = useI18n();
  const { submit, busy, error, fields } = useSubmit<{ message: string }>("/api/auth/forgot");
  const [done, setDone] = useState<string | null>(null);
  return (
    <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); const r = await submit(formObject(e.currentTarget)); if (r) setDone(r.message); }}>
      <FormError message={error} />
      <FormSuccess message={done} />
      <TextInput label={m.auth.email} name="email" type="email" autoComplete="email" required error={fields.email} />
      <Button type="submit" className="w-full" size="lg" loading={busy} disabled={Boolean(done)}>{m.auth.sendLink}</Button>
      <p className="text-center text-sm text-muted"><Link href="/login" className="text-accent-ink hover:underline">{m.auth.backToSignIn}</Link></p>
    </form>
  );
}

export function ResetForm() {
  const { m } = useI18n();
  const A = m.auth;
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const { submit, busy, error, fields } = useSubmit("/api/auth/reset");
  const [done, setDone] = useState(false);
  if (!token) return <FormError message={A.needLink} />;
  return done ? (
    <div className="space-y-4"><FormSuccess message={A.resetDone} /><Link href="/login" className="text-sm text-accent-ink hover:underline">{A.signInNew}</Link></div>
  ) : (
    <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); const f = formObject(e.currentTarget); if (await submit({ token, password: f.password })) setDone(true); }}>
      <FormError message={error} />
      <TextInput label={A.newPassword} name="password" type="password" autoComplete="new-password" required minLength={10} error={fields.password} hint={A.passwordHint} />
      <Button type="submit" className="w-full" size="lg" loading={busy}>{A.setPassword}</Button>
    </form>
  );
}
