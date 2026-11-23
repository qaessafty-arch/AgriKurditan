"use client";
/**
 * Canvas shell shared by every 3D experience: WebGL detection with a static fallback, quality
 * tiers, adaptive resolution, clipping-plane context and screenshot capture.
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { createContext, Suspense, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { detectQuality, useViewer, type Quality } from "@/store/viewer";
import { setTextureAnisotropy } from "@/three/textures";

const ClipContext = createContext<THREE.Plane[]>([]);
export const useClipPlanes = () => useContext(ClipContext);

export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")));
  } catch {
    return false;
  }
}

const DPR: Record<Quality, [number, number]> = { low: [0.75, 1.25], medium: [1, 1.5], high: [1, 2] };

function ScreenshotCapture() {
  const gl = useThree((s) => s.gl);
  const setDpr = useThree((s) => s.setDpr);
  const viewport = useThree((s) => s.viewport);
  const req = useViewer((s) => s.screenshotRequest);
  const frames = useRef(-1);
  const restore = useRef(1);

  useEffect(() => {
    if (!req) return;
    restore.current = viewport.dpr;
    if (req.scale > 1) setDpr(Math.min(4, viewport.dpr * req.scale));
    frames.current = req.scale > 1 ? 3 : 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req?.nonce]);

  useFrame(() => {
    if (!req || frames.current < 0) return;
    if (frames.current-- > 0) return;
    const url = gl.domElement.toDataURL("image/png");
    if (req.scale > 1) setDpr(restore.current);
    req.resolve(url);
    useViewer.setState({ screenshotRequest: null });
    frames.current = -1;
  });
  return null;
}

function RendererSetup({ quality }: { quality: Quality }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.localClippingEnabled = true;
    setTextureAnisotropy(Math.min(gl.capabilities.getMaxAnisotropy(), quality === "high" ? 8 : quality === "medium" ? 4 : 2));
  }, [gl, quality]);
  return null;
}

export interface SceneCanvasProps {
  children: ReactNode;
  fallback: ReactNode;
  /** Required for screenshot export. Slight performance cost, so only the studio enables it. */
  preserveDrawingBuffer?: boolean;
  className?: string;
  camera?: { position: [number, number, number]; fov?: number };
  label: string;
  onPointerMissed?: () => void;
}

export function SceneCanvas({ children, fallback, preserveDrawingBuffer = false, className, camera, label, onPointerMissed }: SceneCanvasProps) {
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const quality = useViewer((s) => s.quality);
  const locked = useViewer((s) => s.qualityLocked);
  const [dpr, setDpr] = useState<number>(1);
  const planes = useMemo(
    () => [new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e5), new THREE.Plane(new THREE.Vector3(0, 0, -1), 1e5)],
    [],
  );

  useEffect(() => {
    setWebgl(isWebGLAvailable());
    if (!useViewer.getState().qualityLocked) useViewer.setState({ quality: detectQuality() });
  }, []);

  useEffect(() => {
    const [lo, hi] = DPR[quality];
    setDpr(Math.min(window.devicePixelRatio || 1, (lo + hi) / 2 + 0.25));
  }, [quality]);

  if (webgl === false) return <>{fallback}</>;
  if (webgl === null) return <div className={className} aria-hidden />;

  const [lo, hi] = DPR[quality];
  return (
    <div className={className} role="img" aria-label={label}>
      <Canvas
        shadows={quality === "low" ? false : { type: THREE.PCFSoftShadowMap }}
        dpr={dpr}
        camera={{ position: camera?.position ?? [30, 14, 34], fov: camera?.fov ?? 32, near: 0.1, far: 1200 }}
        gl={{ antialias: quality !== "high", powerPreference: "high-performance", preserveDrawingBuffer, alpha: false }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
        onPointerMissed={onPointerMissed}
      >
        <RendererSetup quality={quality} />
        <PerformanceMonitor
          bounds={() => [42, 58]}
          flipflops={2}
          onChange={({ factor }) => setDpr(Math.min(window.devicePixelRatio || 1, lo + (hi - lo) * factor))}
          onDecline={() => {
            if (locked) return;
            const q = useViewer.getState().quality;
            if (q === "high") useViewer.setState({ quality: "medium" });
            else if (q === "medium") useViewer.setState({ quality: "low" });
          }}
        />
        <ClipContext.Provider value={planes}>
          <Suspense fallback={null}>{children}</Suspense>
        </ClipContext.Provider>
        <ScreenshotCapture />
      </Canvas>
    </div>
  );
}
