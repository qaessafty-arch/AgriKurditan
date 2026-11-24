"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "@/i18n/client";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { BuildingScene, useBuildingModel } from "@/components/three/BuildingScene";
import { ElevationDrawing } from "@/components/three/ElevationDrawing";
import { ButtonLink } from "@/components/ui/Button";
import { getPlan } from "@/three/plans";
import type { BuildingConfig } from "@/three/config";
import type { BuildingModel } from "@/three/generate";
import { evaluate, MATERIAL_VARIANTS, SCENES } from "./timeline";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import { track } from "@/components/layout/ConsentBanner";

const PLAN_ID = "villa-horizon";

type Driven = { explode: number; cutaway: number; section: number | null; floorLimit: number | null };

function CinematicRig({
  model, progress, reduced, driven, onDiscrete,
}: {
  model: BuildingModel;
  progress: MutableRefObject<number>;
  reduced: boolean;
  driven: MutableRefObject<Driven | null>;
  onDiscrete: (time: number, variant: number) => void;
}) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const look = useRef(new THREE.Vector3());
  const wanted = useRef(new THREE.Vector3());
  const wantedTarget = useRef(new THREE.Vector3());
  const last = useRef({ time: -1, variant: -1 });
  const first = useRef(true);

  useFrame((state, delta) => {
    const s = evaluate(progress.current, model, size.width / Math.max(1, size.height), reduced);
    wanted.current.set(...s.position);
    wantedTarget.current.set(...s.target);
    if (!reduced && s.scene === 0) {
      const t = state.clock.elapsedTime;
      wanted.current.x += Math.sin(t * 0.18) * 0.6;
      wanted.current.y += Math.sin(t * 0.23) * 0.25;
    }
    const k = reduced || first.current ? 1 : 1 - Math.pow(0.02, delta);
    first.current = false;
    camera.position.lerp(wanted.current, k);
    look.current.lerp(wantedTarget.current, k);
    camera.lookAt(look.current);

    driven.current = { explode: s.explode, cutaway: s.cutaway, section: s.section, floorLimit: null };
    if (s.time !== last.current.time || s.materialVariant !== last.current.variant) {
      last.current = { time: s.time, variant: s.materialVariant };
      onDiscrete(s.time, s.materialVariant);
    }
  });
  return null;
}

export function CinematicExperience() {
  const { m } = useI18n();
  const H = m.home;
  const plan = getPlan(PLAN_ID);
  const reducedPref = useReducedMotion();
  const reduced = Boolean(reducedPref);
  const container = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const driven = useRef<Driven | null>(null);
  const [scene, setScene] = useState(0);
  const [discrete, setDiscrete] = useState({ time: 17.4, variant: 0 });

  const config = useMemo<BuildingConfig>(() => {
    const base = plan.defaultConfig;
    return {
      exterior: { ...base.exterior, ...MATERIAL_VARIANTS[discrete.variant] },
      interior: { ...base.interior, lightsOn: true },
      environment: { ...base.environment, time: discrete.time },
    };
  }, [plan, discrete]);
  const model = useBuildingModel(PLAN_ID, config);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const el = container.current;
    if (!el) return;
    const state = { p: 0 };
    const tween = gsap.to(state, {
      p: 1,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        scrub: reduced ? true : 0.9,
        onUpdate: (self) => {
          const idx = Math.min(SCENES.length - 1, Math.floor(self.progress * SCENES.length * 0.99999));
          setScene((prev) => (prev === idx ? prev : idx));
        },
      },
      onUpdate: () => { progress.current = state.p; },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);

  const goTo = (i: number) => {
    const el = container.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + span * ((i + 0.5) / SCENES.length), behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <section ref={container} className="relative" aria-label={H.sceneLabel}>
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden">
        <SceneCanvas
          className="absolute inset-0"
          label={H.canvasLabel}
          camera={{ position: [40, 8, 50], fov: 34 }}
          fallback={
            <div className="absolute inset-0 grid place-items-center bg-surface">
              <ElevationDrawing model={model} className="h-[45vh] w-[90vw] max-w-4xl text-stone" title={fmt(m.explorer.elevation, { name: m.plans["villa-horizon"]!.name })} />
            </div>
          }
        >
          <BuildingScene model={model} config={config} driven={driven} />
          <CinematicRig model={model} progress={progress} reduced={reduced} driven={driven} onDiscrete={(time, variant) => setDiscrete((d) => (d.time === time && d.variant === variant ? d : { time, variant }))} />
        </SceneCanvas>
        {/* Legibility gradient: text sits left, the building stays clear on the right. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r rtl:bg-gradient-to-l from-canvas/85 via-canvas/25 to-transparent max-lg:bg-gradient-to-t max-lg:from-canvas/90 max-lg:via-canvas/20" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-canvas/80 to-transparent" />

        <nav aria-label={H.chaptersLabel} className="absolute end-4 top-1/2 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
          {SCENES.map((s, i) => (
            <button key={s.id} type="button" onClick={() => goTo(i)} className="group flex items-center justify-end gap-3" aria-label={fmt(H.goTo, { chapter: H.chapters[i]! })} aria-current={scene === i ? "step" : undefined}>
              <span className={cn("text-xs transition-opacity", scene === i ? "text-ink opacity-100" : "text-muted opacity-0 group-hover:opacity-100")}>{H.chapters[i]}</span>
              <span className={cn("block h-px transition-all", scene === i ? "w-8 bg-accent" : "w-4 bg-ink/40")} />
            </button>
          ))}
        </nav>

        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
          <span className={cn("flex flex-col items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted transition-opacity duration-500", scene === 0 ? "opacity-100" : "opacity-0")}>
            {H.scroll}
            <span className="relative h-10 w-px overflow-hidden bg-ink/20">
              <span className="absolute inset-x-0 top-0 h-4 animate-[scrollcue_2s_ease-in-out_infinite] bg-accent motion-reduce:animate-none" />
            </span>
          </span>
        </div>
      </div>

      <div className="relative -mt-[100dvh]">
        {SCENES.map((s, i) => (
          <div key={s.id} id={`scene-${s.id}`} className={cn("flex items-end lg:items-center", i === 0 ? "h-[120dvh]" : "h-[115dvh]")}>
            <div className="container pb-24 lg:pb-0">
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: 0.5, margin: "-10% 0px -10% 0px" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className={cn("max-w-xl", i === 0 ? "lg:max-w-2xl" : "")}
              >
                <p className="eyebrow">{H.scenes[i]!.eyebrow}</p>
                {i === 0 ? (
                  <h1 className="mt-4 text-display-xl text-ink text-balance">{H.scenes[i]!.title}</h1>
                ) : (
                  <h2 className="mt-3 text-display-lg text-ink text-balance">{H.scenes[i]!.title}</h2>
                )}
                <p className="mt-5 max-w-md text-base leading-relaxed text-ink/80 sm:text-lg">{H.scenes[i]!.body}</p>
                {i === 0 && (
                  <div className="mt-8 flex flex-wrap gap-3">
                    <ButtonLink href={`/explore?plan=${PLAN_ID}`} size="lg" onClick={() => track("cta_click", "hero_explore")}>{H.exploreProject}</ButtonLink>
                    <ButtonLink href="/consultation" variant="secondary" size="lg" onClick={() => track("cta_click", "hero_consult")}>{m.common.requestConsultation}</ButtonLink>
                  </div>
                )}
                {i === 5 && (
                  <Link href="/studio" className="mt-6 inline-flex text-sm font-medium text-accent-ink underline-offset-4 hover:underline">{H.openStudio} {m.common.arrow}</Link>
                )}
                {i === SCENES.length - 1 && (
                  <div className="mt-8 flex flex-wrap gap-3">
                    <ButtonLink href="/consultation" size="lg" onClick={() => track("cta_click", "final_consult")}>{H.bookConsultation}</ButtonLink>
                    <ButtonLink href="/studio" variant="secondary" size="lg">{H.startStudio}</ButtonLink>
                    <ButtonLink href="/assistant" variant="ghost" size="lg">{H.tryAssistant}</ButtonLink>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
