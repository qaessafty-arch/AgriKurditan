import { Suspense } from "react";
import { ExplorerApp } from "@/components/explorer/ExplorerApp";
import { pageMeta } from "@/lib/seo";
import { getI18n } from "@/i18n/server";

export async function generateMetadata() {
  const { m, locale } = await getI18n();
  return pageMeta({ title: m.explorer.metaTitle, description: m.explorer.metaDescription, path: "/explore", locale });
}

export default function ExplorePage() {
  return (
    <Suspense>
      <ExplorerApp />
    </Suspense>
  );
}
