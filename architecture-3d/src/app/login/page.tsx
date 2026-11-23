import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return <AuthShell title="Sign in" subtitle="Access saved designs, quotes, consultations and orders."><Suspense><LoginForm /></Suspense></AuthShell>;
}
