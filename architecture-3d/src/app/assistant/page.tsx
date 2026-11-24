import { AssistantApp } from "@/components/assistant/AssistantApp";
import { PageHeader } from "@/components/marketing/PageHeader";
import { env } from "@/lib/env";
import { pageMeta } from "@/lib/seo";
import { getI18n } from "@/i18n/server";

export async function generateMetadata() {
  const { m, locale } = await getI18n();
  return pageMeta({ title: m.assistant.metaTitle, description: m.assistant.metaDescription, path: "/assistant", locale });
}

export default async function AssistantPage() {
  const { m } = await getI18n();
  const A = m.assistant;
  return (
    <>
      <PageHeader eyebrow={A.eyebrow} title={A.title}>{A.intro}</PageHeader>
      <div className="container py-12"><AssistantApp providerLabel={env.aiProvider === "claude" ? A.providerClaude : A.providerRules} /></div>
    </>
  );
}
