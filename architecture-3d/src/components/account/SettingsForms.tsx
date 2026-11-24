"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, FormSuccess, SelectInput, TextArea, TextInput, formObject, useSubmit } from "@/components/forms/Field";
import { useI18n, useLocaleRouter } from "@/i18n/client";
import { LOCALES, LOCALE_META } from "@/i18n/config";

export function ProfileForm({ user }: { user: { name: string; email: string; phone: string | null; company: string | null; bio: string | null; marketingOptIn: boolean; locale: string } }) {
  const { m } = useI18n();
  const A = m.account;
  const router = useLocaleRouter();
  const { submit, busy, error, fields } = useSubmit("/api/account/profile", "PATCH");
  const [saved, setSaved] = useState(false);
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setSaved(false);
      const f = formObject(e.currentTarget);
      if (await submit({ ...f, marketingOptIn: f.marketingOptIn === "on" })) { setSaved(true); router.refresh(); }
    }}>
      <FormError message={error} />
      {saved && <FormSuccess message={A.profileSaved} />}
      <TextInput label={m.auth.email} value={user.email} disabled hint={A.emailFixed} dir="ltr" />
      <TextInput label={m.auth.fullName} name="name" defaultValue={user.name} required error={fields.name} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label={A.phone} name="phone" type="tel" defaultValue={user.phone ?? ""} error={fields.phone} />
        <TextInput label={A.company} name="company" defaultValue={user.company ?? ""} error={fields.company} />
      </div>
      <TextArea label={A.bio} name="bio" defaultValue={user.bio ?? ""} maxLength={1000} error={fields.bio} />
      <SelectInput label={A.language} name="locale" defaultValue={user.locale} options={LOCALES.map((l) => ({ value: l, label: LOCALE_META[l].label }))} />
      <label className="flex items-center gap-2.5 text-sm text-muted"><input type="checkbox" name="marketingOptIn" defaultChecked={user.marketingOptIn} className="h-4 w-4 accent-[rgb(var(--accent))]" />{A.newsOptIn}</label>
      <Button type="submit" loading={busy}>{A.saveProfile}</Button>
    </form>
  );
}

export function PasswordForm() {
  const { m } = useI18n();
  const A = m.account;
  const { submit, busy, error, fields } = useSubmit("/api/account/password");
  const [saved, setSaved] = useState(false);
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setSaved(false);
      const form = e.currentTarget;
      if (await submit(formObject(form))) { setSaved(true); form.reset(); }
    }}>
      <FormError message={error} />
      {saved && <FormSuccess message={A.passwordChanged} />}
      <TextInput label={A.current} name="current" type="password" autoComplete="current-password" required error={fields.current} />
      <TextInput label={m.auth.newPassword} name="next" type="password" autoComplete="new-password" required minLength={10} error={fields.next} hint={m.auth.passwordHint} />
      <Button type="submit" loading={busy}>{A.change}</Button>
    </form>
  );
}
