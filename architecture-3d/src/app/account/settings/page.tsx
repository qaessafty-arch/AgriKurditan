import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { PasswordForm, ProfileForm } from "@/components/account/SettingsForms";
import { SignOutButton } from "@/components/account/AccountActions";

export default async function SettingsPage() {
  const session = await requirePageUser("/account/settings");
  const user = await db.user.findUniqueOrThrow({ where: { id: session.id }, select: { name: true, email: true, phone: true, company: true, bio: true, marketingOptIn: true } });
  return (
    <div className="max-w-2xl space-y-12">
      <h1 className="text-display-md text-ink">Settings</h1>
      <section><h2 className="mb-4 font-display text-2xl text-ink">Profile</h2><ProfileForm user={user} /></section>
      <section><h2 className="mb-4 font-display text-2xl text-ink">Password</h2><PasswordForm /></section>
      <section><h2 className="mb-4 font-display text-2xl text-ink">Session</h2><SignOutButton /></section>
    </div>
  );
}
