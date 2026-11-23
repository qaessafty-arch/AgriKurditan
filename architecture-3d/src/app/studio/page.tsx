import { Suspense } from "react";
import { StudioApp } from "@/components/studio/StudioApp";
import { getCurrentUser } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/entitlements";
import { getSetting } from "@/lib/settings";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Design studio",
  description: "Customise facade materials, glazing, roof, interiors, landscape and daylight on real building designs, then save, compare and request a quote.",
  path: "/studio",
});

export default async function StudioPage() {
  const user = await getCurrentUser();
  const [ent, studio] = await Promise.all([getEntitlements(user), getSetting("studio")]);
  return (
    <Suspense>
      <StudioApp signedIn={Boolean(user)} pro={ent.has("studio_pro")} freeLimit={studio.freeDesignLimit} />
    </Suspense>
  );
}
