import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default function ResetPage() {
  return <AuthShell title="Choose a new password" subtitle="Signing in again will be required on all devices."><Suspense><ResetForm /></Suspense></AuthShell>;
}
