import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { RenderStage } from "./RenderStage";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Off-screen render target used by scripts/render-covers.mjs to produce cover images from the real 3D model. */
export default async function RenderPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await db.project.findUnique({ where: { slug: (await params).slug } });
  if (!p) notFound();
  return <RenderStage presetId={p.presetId} config={p.config} />;
}
