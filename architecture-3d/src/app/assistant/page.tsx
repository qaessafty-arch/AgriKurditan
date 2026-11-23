import { AssistantApp } from "@/components/assistant/AssistantApp";
import { PageHeader } from "@/components/marketing/PageHeader";
import { env } from "@/lib/env";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "AI architectural assistant", description: "Describe your land, budget and preferences and receive a preliminary design brief and a starting 3D design.", path: "/assistant" });

export default function AssistantPage() {
  const label = env.aiProvider === "claude"
    ? "Briefs are drafted by an AI model (Claude by Anthropic), which also reviews any photos you attach."
    : "Briefs are drafted by our built-in rules engine from your dimensions and preferences. It does not analyse photos; they are passed to the architect.";
  return (
    <>
      <PageHeader eyebrow="AI assistant" title="Start with a preliminary brief.">
        Describe your project and land. You get a suggested space programme, materials and a starting design to explore in 3D, ready to review with an architect.
      </PageHeader>
      <div className="container py-12"><AssistantApp providerLabel={label} /></div>
    </>
  );
}
