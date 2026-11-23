"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const Viewer = dynamic(() => import("./ProjectViewer"), { ssr: false, loading: () => <div className="absolute inset-0 animate-pulse bg-surface" /> });

/** Loads three.js and the model only when the viewer scrolls into view or the visitor asks for it. */
export function LazyProjectViewer(props: { presetId: string; config: unknown; title: string; poster: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setActive(true); io.disconnect(); } }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border hairline bg-surface sm:aspect-[16/9]">
      {active ? <Viewer {...props} /> : props.poster ? (
        <img src={props.poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      {!active && (
        <button type="button" onClick={() => setActive(true)} className="absolute inset-0 grid place-items-center bg-canvas/30 text-sm font-medium text-ink">
          <span className="glass rounded-lg border hairline px-4 py-2">Load interactive 3D model</span>
        </button>
      )}
    </div>
  );
}
