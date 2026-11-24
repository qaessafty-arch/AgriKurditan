import Image from "next/image";
import { Link } from "@/i18n/client";
import { ElevationDrawing } from "@/components/three/ElevationDrawing";
import { generateBuilding } from "@/three/generate";
import { getPlan } from "@/three/plans";
import { coerceConfig } from "@/three/config";
import { fmt, type Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";
import { num } from "@/i18n/labels";

export interface ProjectCardData {
  slug: string; title: string; summary: string; styles: string[]; categories: string[];
  presetId: string; config: unknown; isConcept: boolean; areaM2: number | null; featured: boolean; cover: string | null;
}

export function ProjectCard({ p, m, locale, priority = false }: { p: ProjectCardData; m: Messages; locale: Locale; priority?: boolean }) {
  const P = m.projects;
  const tags = [...p.styles.map((s) => P.styles[s as keyof typeof P.styles] ?? s), ...p.categories.map((c) => P.categories[c as keyof typeof P.categories] ?? c)];
  return (
    <Link href={`/projects/${p.slug}`} className="group block">
      <div className="relative aspect-[16/10] overflow-hidden rounded-lg border hairline bg-surface">
        {p.cover ? (
          <Image src={p.cover} alt={fmt(P.renderedAlt, { title: p.title })} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-architectural group-hover:scale-[1.03]" priority={priority} />
        ) : (
          <div className="absolute inset-0 grid place-items-center p-6 text-stone">
            <ElevationDrawing model={generateBuilding(getPlan(p.presetId), coerceConfig(p.config))} className="h-full w-full" title={p.title} />
          </div>
        )}
        <div className="absolute start-3 top-3 flex gap-1.5">
          {p.featured && <span className="rounded bg-accent px-2 py-0.5 text-[11px] font-semibold text-[#101114]">{m.common.featured}</span>}
          {p.isConcept && <span className="rounded bg-canvas/80 px-2 py-0.5 text-[11px] font-medium text-ink backdrop-blur">{m.common.concept}</span>}
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-2xl text-ink transition-colors group-hover:text-accent-ink">{p.title}</h3>
        {p.areaM2 && <span className="shrink-0 text-xs text-muted">{num(locale, p.areaM2)} m²</span>}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-muted">{p.summary}</p>
      <p className="mt-2 text-xs uppercase tracking-wider text-muted">{tags.join(" · ")}</p>
    </Link>
  );
}
