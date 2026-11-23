import type { Metadata } from "next";
import { PageHeader } from "@/components/marketing/PageHeader";

export const metadata: Metadata = { title: "Newsletter", robots: { index: false } };
const MESSAGES: Record<string, [string, string]> = {
  confirmed: ["Subscription confirmed", "Thank you. You will receive our monthly project notes."],
  unsubscribed: ["You have been unsubscribed", "You will not receive any more newsletters from us."],
  invalid: ["This link is not valid", "It may have expired or already been used. Subscribe again from the footer of any page."],
};

export default async function NewsletterPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const [title, body] = MESSAGES[(await searchParams).status ?? ""] ?? MESSAGES.invalid!;
  return <PageHeader eyebrow="Newsletter" title={title}>{body}</PageHeader>;
}
