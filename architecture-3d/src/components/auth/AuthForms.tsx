"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, FormSuccess, SelectInput, TextInput, formObject, useSubmit } from "@/components/forms/Field";

/** Only allow same-site relative redirects after sign-in (prevents open redirects). */
export function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/account";
  return next;
}

export function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { submit, busy, error, fields } = useSubmit<{ role: string }>("/api/auth/login");
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await submit(formObject(e.currentTarget));
        if (r) { router.replace(safeNext(params.get("next")) === "/account" && r.role === "ADMIN" ? "/admin" : safeNext(params.get("next"))); router.refresh(); }
      }}
    >
      <FormError message={error} />
      <TextInput label="Email" name="email" type="email" autoComplete="email" required error={fields.email} />
      <TextInput label="Password" name="password" type="password" autoComplete="current-password" required error={fields.password} />
      <div className="flex items-center justify-between">
        <Link href="/forgot-password" className="text-sm text-accent-ink hover:underline">Forgot password?</Link>
      </div>
      <Button type="submit" className="w-full" size="lg" loading={busy}>Sign in</Button>
      <p className="text-center text-sm text-muted">New here? <Link href={`/register${params.get("next") ? `?next=${encodeURIComponent(params.get("next")!)}` : ""}`} className="text-accent-ink hover:underline">Create an account</Link></p>
    </form>
  );
}

export function RegisterForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { submit, busy, error, fields } = useSubmit("/api/auth/register");
  const [type, setType] = useState("CUSTOMER");
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = formObject(e.currentTarget);
        const ok = await submit({ ...f, marketingOptIn: f.marketingOptIn === "on", acceptTerms: f.acceptTerms === "on" });
        if (ok) { router.replace(safeNext(params.get("next"))); router.refresh(); }
      }}
    >
      <FormError message={error} />
      <TextInput label="Full name" name="name" autoComplete="name" required minLength={2} maxLength={80} error={fields.name} />
      <TextInput label="Email" name="email" type="email" autoComplete="email" required error={fields.email} />
      <TextInput label="Password" name="password" type="password" autoComplete="new-password" required minLength={10} error={fields.password} hint="At least 10 characters, with letters and a number." />
      <SelectInput label="I am" name="accountType" value={type} onChange={(e) => setType(e.target.value)} error={fields.accountType}
        options={[{ value: "CUSTOMER", label: "A homeowner or client" }, { value: "ARCHITECT", label: "An architect" }, { value: "PARTNER", label: "A developer or construction company" }]} />
      {type !== "CUSTOMER" && <TextInput label="Company or practice" name="company" maxLength={120} error={fields.company} />}
      <label className="flex items-start gap-2.5 text-sm text-muted">
        <input type="checkbox" name="acceptTerms" required className="mt-0.5 h-4 w-4 accent-[rgb(var(--accent))]" />
        <span>I accept the <Link href="/terms" className="text-accent-ink hover:underline">terms</Link> and <Link href="/privacy" className="text-accent-ink hover:underline">privacy policy</Link>.</span>
      </label>
      {fields.acceptTerms && <p className="field-error">{fields.acceptTerms}</p>}
      <label className="flex items-start gap-2.5 text-sm text-muted">
        <input type="checkbox" name="marketingOptIn" className="mt-0.5 h-4 w-4 accent-[rgb(var(--accent))]" />
        <span>Send me occasional project news (optional).</span>
      </label>
      <Button type="submit" className="w-full" size="lg" loading={busy}>Create account</Button>
      <p className="text-center text-sm text-muted">Already registered? <Link href="/login" className="text-accent-ink hover:underline">Sign in</Link></p>
    </form>
  );
}

export function ForgotForm() {
  const { submit, busy, error, fields } = useSubmit<{ message: string }>("/api/auth/forgot");
  const [done, setDone] = useState<string | null>(null);
  return (
    <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); const r = await submit(formObject(e.currentTarget)); if (r) setDone(r.message); }}>
      <FormError message={error} />
      <FormSuccess message={done} />
      <TextInput label="Email" name="email" type="email" autoComplete="email" required error={fields.email} />
      <Button type="submit" className="w-full" size="lg" loading={busy} disabled={Boolean(done)}>Send reset link</Button>
      <p className="text-center text-sm text-muted"><Link href="/login" className="text-accent-ink hover:underline">Back to sign in</Link></p>
    </form>
  );
}

export function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const { submit, busy, error, fields } = useSubmit("/api/auth/reset");
  const [done, setDone] = useState(false);
  if (!token) return <FormError message="This page needs the link from your reset email." />;
  return done ? (
    <div className="space-y-4">
      <FormSuccess message="Your password has been changed and other sessions were signed out." />
      <Link href="/login" className="text-sm text-accent-ink hover:underline">Sign in with your new password</Link>
    </div>
  ) : (
    <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); const f = formObject(e.currentTarget); if (await submit({ token, password: f.password })) setDone(true); }}>
      <FormError message={error} />
      <TextInput label="New password" name="password" type="password" autoComplete="new-password" required minLength={10} error={fields.password} hint="At least 10 characters, with letters and a number." />
      <Button type="submit" className="w-full" size="lg" loading={busy}>Set new password</Button>
    </form>
  );
}
