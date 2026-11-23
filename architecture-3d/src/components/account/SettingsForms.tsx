"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, FormSuccess, TextArea, TextInput, formObject, useSubmit } from "@/components/forms/Field";

export function ProfileForm({ user }: { user: { name: string; email: string; phone: string | null; company: string | null; bio: string | null; marketingOptIn: boolean } }) {
  const router = useRouter();
  const { submit, busy, error, fields } = useSubmit("/api/account/profile", "PATCH");
  const [saved, setSaved] = useState(false);
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setSaved(false);
      const f = formObject(e.currentTarget);
      if (await submit({ ...f, marketingOptIn: f.marketingOptIn === "on" })) { setSaved(true); router.refresh(); }
    }}>
      <FormError message={error} />
      {saved && <FormSuccess message="Profile saved." />}
      <TextInput label="Email" value={user.email} disabled hint="Contact us to change your sign-in email." />
      <TextInput label="Full name" name="name" defaultValue={user.name} required error={fields.name} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Phone" name="phone" type="tel" defaultValue={user.phone ?? ""} error={fields.phone} />
        <TextInput label="Company or practice" name="company" defaultValue={user.company ?? ""} error={fields.company} />
      </div>
      <TextArea label="About (optional)" name="bio" defaultValue={user.bio ?? ""} maxLength={1000} error={fields.bio} />
      <label className="flex items-center gap-2.5 text-sm text-muted"><input type="checkbox" name="marketingOptIn" defaultChecked={user.marketingOptIn} className="h-4 w-4 accent-[rgb(var(--accent))]" />Receive occasional project news</label>
      <Button type="submit" loading={busy}>Save profile</Button>
    </form>
  );
}

export function PasswordForm() {
  const { submit, busy, error, fields } = useSubmit("/api/account/password");
  const [saved, setSaved] = useState(false);
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setSaved(false);
      const form = e.currentTarget;
      if (await submit(formObject(form))) { setSaved(true); form.reset(); }
    }}>
      <FormError message={error} />
      {saved && <FormSuccess message="Password changed. Other devices have been signed out." />}
      <TextInput label="Current password" name="current" type="password" autoComplete="current-password" required error={fields.current} />
      <TextInput label="New password" name="next" type="password" autoComplete="new-password" required minLength={10} error={fields.next} hint="At least 10 characters, with letters and a number." />
      <Button type="submit" loading={busy}>Change password</Button>
    </form>
  );
}
