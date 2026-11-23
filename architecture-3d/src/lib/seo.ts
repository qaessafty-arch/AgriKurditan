import type { Metadata } from "next";
import { SITE } from "./site";

/** Serialize JSON-LD safely for inline <script> tags (prevents `</script>` injection). */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export function pageMeta({ title, description, path, image }: { title: string; description: string; path: string; image?: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: `${SITE.url}${path}`, ...(image ? { images: [{ url: image }] } : {}) },
    twitter: { title, description },
  };
}
