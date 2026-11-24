import { Suspense } from "react";
import { StudioApp } from "@/components/studio/StudioApp";
import { getCurrentUser } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/entitlements";
import { getSetting } from "@/lib/settings";
import { pageMeta } from "@/lib/seo";
import { getI18n } from "@/i18n/server";

export async function generateMetadata() {
  const { m, locale } = await getI18n();
  return pageMeta({ title: m.studio.metaTitle, description: m.studio.metaDescription, path: "/studio", locale });
}

export default async function StudioPage() {
  const user = await getCurrentUser();
  const [ent, studio] = await Promise.all([getEntitlements(user), getSetting("studio")]);
  return (
    <Suspense>
      <StudioApp signedIn={Boolean(user)} pro={ent.has("studio_pro")} freeLimit={studio.freeDesignLimit} />
    </Suspense>
  );
}
