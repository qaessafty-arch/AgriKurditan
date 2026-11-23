import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default function RegisterPage() {
  return <AuthShell title="Create an account" subtitle="Free for clients. Architects and partners can upgrade to publish projects."><Suspense><RegisterForm /></Suspense></AuthShell>;
}
