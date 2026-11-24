import type { Metadata } from "next";
import { PageHeader } from "@/components/marketing/PageHeader";
import { getI18n } from "@/i18n/server";

export const metadata: Metadata = { robots: { index: false } };

export default async function NewsletterPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { m } = await getI18n();
  const N = m.pages.newsletter;
  const status = (await searchParams).status;
  const msg = status === "confirmed" ? N.confirmed : status === "unsubscribed" ? N.unsubscribed : N.invalid;
  return <PageHeader eyebrow={N.eyebrow} title={msg.title}>{msg.body}</PageHeader>;
}
