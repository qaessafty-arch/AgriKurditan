import { Suspense } from "react";
import { ExplorerApp } from "@/components/explorer/ExplorerApp";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "3D building explorer",
  description: "Orbit, section, explode and measure architectural designs in real-time 3D. Inspect every room and material.",
  path: "/explore",
});

export default function ExplorePage() {
  return (
    <Suspense>
      <ExplorerApp />
    </Suspense>
  );
}
