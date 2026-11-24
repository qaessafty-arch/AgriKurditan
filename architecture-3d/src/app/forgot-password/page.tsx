import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotForm } from "@/components/auth/AuthForms";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: m.auth.forgotTitle, robots: { index: false } };
}

export default async function Page() {
  const { m } = await getI18n();
  return <AuthShell title={m.auth.forgotTitle} subtitle={m.auth.forgotSubtitle}><Suspense><ForgotForm /></Suspense></AuthShell>;
}
