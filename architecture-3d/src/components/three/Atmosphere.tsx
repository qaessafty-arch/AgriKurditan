"use client";
import { Environment, Lightformer, Sky, Stars } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, N8AO, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { BuildingConfig } from "@/three/config";
import { computeLighting } from "@/three/lighting";
import { useViewer } from "@/store/viewer";

/** Sun, sky, environment reflections, fog — all derived from the environment configuration. */
export function Atmosphere({ env, extent }: { env: BuildingConfig["environment"]; extent: number }) {
  const quality = useViewer((s) => s.quality);
  const gl = useThree((s) => s.gl);
  const L = useMemo(() => computeLighting(env), [env]);

  useEffect(() => {
    gl.toneMappingExposure = L.exposure;
  }, [gl, L.exposure]);

  const sunPos = useMemo(() => {
    const v = new THREE.Vector3(...L.sunDirection).normalize();
    return v.multiplyScalar(extent * 2.2);
  }, [L.sunDirection, extent]);

  const shadowSize = quality === "high" ? 4096 : 2048;
  const s = extent * 1.15;
  // Re-render the environment map only when lighting meaningfully changes.
  const envKey = `${Math.round(env.time * 2)}-${env.sky}-${Math.round(L.night * 4)}`;

  return (
    <>
      <color attach="background" args={[L.background]} />
      <fog attach="fog" args={[L.fog, extent * 3, extent * 9]} />
      {L.showSky && quality !== "low" && (
        <Sky distance={4500} sunPosition={sunPos.toArray()} {...L.sky} />
      )}
      {L.night > 0.35 && <Stars radius={400} depth={80} count={quality === "high" ? 3000 : 1200} factor={5} saturation={0} fade speed={0.3} />}
      <hemisphereLight args={[L.hemiSky, L.hemiGround, L.hemiIntensity]} />
      <directionalLight
        position={sunPos.toArray()}
        color={L.sunColor}
        intensity={L.sunIntensity}
        castShadow={quality !== "low"}
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.04}
        shadow-camera-near={1}
        shadow-camera-far={extent * 6}
        shadow-camera-left={-s}
        shadow-camera-right={s}
        shadow-camera-top={s}
        shadow-camera-bottom={-s}
      />
      <Environment key={envKey} frames={1} resolution={quality === "high" ? 256 : 128} environmentIntensity={Math.max(0.1, L.envIntensity)}>
        <color attach="background" args={[L.background]} />
        <Lightformer form="rect" intensity={2.2 * (1 - L.night * 0.8)} color={L.hemiSky} position={[0, 12, 0]} rotation-x={Math.PI / 2} scale={[40, 40, 1]} />
        <Lightformer form="rect" intensity={1.4 * (1 - L.night * 0.8)} color={L.sunColor} position={[L.sunDirection[0] * 20, 6, L.sunDirection[2] * 20]} scale={[14, 6, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.6} color="#d6cfc4" position={[-20, 4, -10]} scale={[18, 4, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={0.8} color="#ffffff" position={[12, 8, 18]} scale={4} target={[0, 0, 0]} />
      </Environment>
    </>
  );
}

export function Effects({ night }: { night: number }) {
  const quality = useViewer((s) => s.quality);
  if (quality === "low") return null;
  return (
    <EffectComposer multisampling={quality === "high" ? 4 : 2} enableNormalPass={quality === "high"}>
      {quality === "high" ? <N8AO aoRadius={1.4} intensity={1.6} distanceFalloff={0.6} halfRes /> : <></>}
      <Bloom luminanceThreshold={0.95} luminanceSmoothing={0.2} intensity={0.35 + night * 0.9} mipmapBlur />
      <Vignette offset={0.35} darkness={0.45} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
