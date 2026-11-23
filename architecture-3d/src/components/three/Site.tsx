"use client";
import { Instance, Instances } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { BuildingConfig } from "@/three/config";
import type { BuildingModel } from "@/three/generate";
import { computeLighting } from "@/three/lighting";
import { getTexture } from "@/three/textures";
import { useViewer } from "@/store/viewer";

const GROUND_SIZE = 420;
const FOLIAGE: Record<BuildingConfig["environment"]["landscape"], { leaf: string; dark: string }> = {
  lawn: { leaf: "#4f6b3a", dark: "#2f4626" },
  gravel: { leaf: "#6c7a4f", dark: "#3e4a32" },
  meadow: { leaf: "#7d8650", dark: "#4b5333" },
};

export function Site({ model, config }: { model: BuildingModel; config: BuildingConfig }) {
  const quality = useViewer((s) => s.quality);
  const env = config.environment;
  const lighting = useMemo(() => computeLighting(env), [env]);
  const texSize = quality === "high" ? 1024 : quality === "medium" ? 512 : 256;

  const groundMat = useMemo(() => {
    const name = env.landscape === "lawn" ? "grass" : env.landscape === "gravel" ? "gravel" : "meadow";
    const src = getTexture(name, texSize);
    const map = src.map.clone();
    map.needsUpdate = true;
    map.repeat.set(GROUND_SIZE / src.meters, GROUND_SIZE / src.meters);
    return new THREE.MeshStandardMaterial({ map, roughness: 1, color: "#ffffff" });
  }, [env.landscape, texSize]);
  useEffect(() => () => { groundMat.map?.dispose(); groundMat.dispose(); }, [groundMat]);

  const foliage = FOLIAGE[env.landscape];
  const trees = model.trees;
  const segments = quality === "low" ? 0 : 1;
  const offset: [number, number, number] = [-model.center[0], 0, -model.center[1]];
  const night = lighting.night;
  const lightsOn = env.outdoorLights && night > 0.2;

  const pointLights = useMemo(() => {
    if (!lightsOn || quality === "low") return [];
    const picks = model.outdoorLights.filter((_, i) => i % 4 === 0).slice(0, quality === "high" ? 4 : 2);
    return picks;
  }, [lightsOn, quality, model.outdoorLights]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow material={groundMat}>
        <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
      </mesh>

      <group position={offset}>
        {trees.length > 0 && (
          <>
            <Instances limit={trees.length} castShadow receiveShadow>
              <cylinderGeometry args={[0.12, 0.18, 1, 6]} />
              <meshStandardMaterial color="#5a4632" roughness={1} />
              {trees.filter((t) => t.kind !== "shrub").map((t, i) => (
                <Instance key={i} position={[t.x, (t.kind === "cypress" ? 0.6 : 1.4) * t.scale, t.z]} scale={[t.scale, (t.kind === "cypress" ? 1.2 : 2.8) * t.scale, t.scale]} />
              ))}
            </Instances>
            <Instances limit={trees.length} castShadow receiveShadow>
              <icosahedronGeometry args={[1, segments]} />
              <meshStandardMaterial color={foliage.leaf} roughness={0.95} flatShading />
              {trees.filter((t) => t.kind === "tree").map((t, i) => (
                <Instance key={i} position={[t.x, 3.6 * t.scale, t.z]} scale={[2.1 * t.scale, 1.8 * t.scale, 2.1 * t.scale]} />
              ))}
              {trees.filter((t) => t.kind === "shrub").map((t, i) => (
                <Instance key={`s${i}`} position={[t.x, 0.45 * t.scale, t.z]} scale={[0.9 * t.scale, 0.6 * t.scale, 0.9 * t.scale]} color={foliage.dark} />
              ))}
            </Instances>
            <Instances limit={trees.length} castShadow receiveShadow>
              <coneGeometry args={[1, 1, quality === "low" ? 6 : 10]} />
              <meshStandardMaterial color={foliage.dark} roughness={0.95} flatShading />
              {trees.filter((t) => t.kind === "cypress").map((t, i) => (
                <Instance key={i} position={[t.x, 4.2 * t.scale, t.z]} scale={[0.75 * t.scale, 7 * t.scale, 0.75 * t.scale]} />
              ))}
            </Instances>
          </>
        )}

        {env.outdoorLights && model.outdoorLights.length > 0 && (
          <Instances limit={model.outdoorLights.length}>
            <boxGeometry args={[0.14, 0.7, 0.14]} />
            <meshStandardMaterial color="#3a332b" emissive="#ffcf9a" emissiveIntensity={lightsOn ? 2.5 : 0} toneMapped={false} />
            {model.outdoorLights.map((l, i) => (
              <Instance key={i} position={[l.x, 0.35, l.z]} />
            ))}
          </Instances>
        )}
        {pointLights.map((l, i) => (
          <pointLight key={i} position={[l.x, 1.2, l.z]} color="#ffc98f" intensity={night * 8} distance={9} decay={2} />
        ))}
      </group>
    </group>
  );
}
