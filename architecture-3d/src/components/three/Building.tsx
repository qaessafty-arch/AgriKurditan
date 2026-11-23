"use client";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { BuildingConfig } from "@/three/config";
import type { BuildingModel, Slot } from "@/three/generate";
import { batchBySlot, buildBoxesGeometry, FURNITURE_SLOTS, TRANSPARENT_SLOTS } from "@/three/geometry";
import { createMaterials, disposeMaterials } from "@/three/materials";
import { computeLighting, LIGHT_COLORS } from "@/three/lighting";
import { useViewer } from "@/store/viewer";
import { useClipPlanes } from "./SceneCanvas";

const TEXTURE_SIZE = { low: 256, medium: 512, high: 1024 } as const;
const EXPLODE_GAP = 3.2;

export interface BuildingProps {
  model: BuildingModel;
  config: BuildingConfig;
  interactive?: boolean;
  /** Overrides viewer store values (used by the cinematic scroll engine). */
  driven?: MutableRefObject<{ explode: number; cutaway: number; section: number | null; floorLimit: number | null } | null>;
}

export function Building({ model, config, interactive = false, driven }: BuildingProps) {
  const quality = useViewer((s) => s.quality);
  const selectedRoom = useViewer((s) => s.selectedRoom);
  const planes = useClipPlanes();
  const lighting = useMemo(() => computeLighting(config.environment), [config.environment]);

  const materials = useMemo(
    () => createMaterials(config, { textureSize: TEXTURE_SIZE[quality], clippingPlanes: planes, night: lighting.night }),
    [config, quality, planes, lighting.night],
  );
  useEffect(() => () => disposeMaterials(materials), [materials]);

  const nFloors = model.floors.length;
  const groups = useMemo(() => {
    const out: { index: number; elevation: number; batches: ReturnType<typeof batchBySlot> }[] = [];
    for (let f = 0; f <= nFloors; f++) {
      const elevation = f < nFloors ? (model.floors[f]?.elevation ?? 0) : model.roofElevation;
      out.push({ index: f, elevation, batches: batchBySlot(model.parts.filter((p) => p.floor === f), elevation, new Set<Slot>(["floorFinish"])) });
    }
    return out;
  }, [model, nFloors]);

  const roomFloors = useMemo(
    () => model.parts.filter((p) => p.slot === "floorFinish" && p.room).map((p) => ({
      part: p,
      geometry: buildBoxesGeometry([p], model.floors[p.floor]?.elevation ?? 0),
    })),
    [model],
  );

  useEffect(() => () => {
    groups.forEach((g) => g.batches.forEach((b) => b.geometry.dispose()));
    roomFloors.forEach((r) => r.geometry.dispose());
  }, [groups, roomFloors]);

  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const furnitureRefs = useRef<THREE.Mesh[]>([]);
  const halfDepth = model.size[2] / 2;
  const maxDim = Math.max(model.size[0], model.size[2]);

  // Animate explode, floor isolation, clipping planes and furniture LOD without React re-renders.
  useFrame((state, delta) => {
    const v = useViewer.getState();
    const d = driven?.current;
    const explode = d ? d.explode : v.explode;
    const cutaway = d ? d.cutaway : v.cutaway;
    const section = d ? d.section : v.section;
    const floorLimit = d ? d.floorLimit : v.floorLimit;
    const k = 1 - Math.pow(0.0015, delta);

    groupRefs.current.forEach((g, f) => {
      if (!g) return;
      const target = (groups[f]?.elevation ?? 0) + f * explode * EXPLODE_GAP;
      g.position.y += (target - g.position.y) * k;
      const visible = floorLimit === null ? true : f <= floorLimit && f < nFloors;
      g.visible = visible;
    });

    const [sectionPlane, cutPlane] = planes;
    if (sectionPlane) sectionPlane.constant = section === null ? 1e5 : section;
    if (cutPlane) cutPlane.constant = cutaway <= 0.001 ? 1e5 : halfDepth + 0.6 - cutaway * (model.size[2] * 0.58);

    const dist = state.camera.position.length();
    const revealing = cutaway > 0.01 || section !== null || floorLimit !== null || explode > 0.01;
    const showFurniture = v.showFurniture && (revealing || dist < maxDim * 2.4 + 20 || quality === "high");
    furnitureRefs.current.forEach((m) => { if (m) m.visible = showFurniture; });
  });

  const handleClick = (e: ThreeEvent<MouseEvent>, slot: Slot, room?: string) => {
    if (!interactive) return;
    e.stopPropagation();
    const v = useViewer.getState();
    if (v.measuring) {
      const pts = v.measure.length >= 2 ? [] : v.measure;
      v.set({ measure: [...pts, { x: e.point.x, y: e.point.y, z: e.point.z }] });
      return;
    }
    v.set({ inspected: { slot, room }, selectedRoom: room ?? null });
  };

  const setCursor = (on: boolean) => {
    if (interactive) document.body.style.cursor = on ? "pointer" : "";
  };
  useEffect(() => () => { document.body.style.cursor = ""; }, []);

  furnitureRefs.current = [];
  const lightsOn = config.interior.lightsOn && lighting.night > 0.15;
  const maxPointLights = quality === "low" ? 0 : quality === "medium" ? 2 : 4;

  return (
    <group position={[-model.center[0], 0, -model.center[1]]}>
      {groups.map((g) => (
        <group key={g.index} ref={(el) => { groupRefs.current[g.index] = el; }} position={[0, g.elevation, 0]}>
          {g.batches.map((b) => {
            const transparent = TRANSPARENT_SLOTS.has(b.slot);
            const isFurniture = FURNITURE_SLOTS.has(b.slot);
            return (
              <mesh
                key={b.slot}
                geometry={b.geometry}
                material={materials[b.slot]}
                castShadow={!transparent && b.slot !== "lamp" && quality !== "low"}
                receiveShadow={!transparent}
                renderOrder={transparent ? 2 : 0}
                ref={isFurniture ? (m: THREE.Mesh | null) => { if (m) furnitureRefs.current.push(m); } : undefined}
                onClick={(e) => handleClick(e, b.slot)}
                onPointerOver={() => setCursor(true)}
                onPointerOut={() => setCursor(false)}
              />
            );
          })}
          {roomFloors.filter((r) => r.part.floor === g.index).map((r) => (
            <mesh
              key={r.part.room}
              geometry={r.geometry}
              material={materials.floorFinish}
              receiveShadow
              onClick={(e) => handleClick(e, "floorFinish", r.part.room)}
              onPointerOver={() => setCursor(true)}
              onPointerOut={() => setCursor(false)}
            />
          ))}
          {selectedRoom && roomFloors.filter((r) => r.part.floor === g.index && r.part.room === selectedRoom).map((r) => (
            <mesh key="sel" position={[r.part.p[0], r.part.p[1] + 0.03, r.part.p[2]]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
              <planeGeometry args={[r.part.s[0] - 0.1, r.part.s[2] - 0.1]} />
              <meshBasicMaterial color="#B69A72" transparent opacity={0.35} depthWrite={false} clippingPlanes={planes} />
            </mesh>
          ))}
          {lightsOn && g.index < nFloors && g.index < maxPointLights && model.interiorLights[g.index] && (
            <pointLight
              position={[model.interiorLights[g.index]!.x, model.interiorLights[g.index]!.y, model.interiorLights[g.index]!.z]}
              color={LIGHT_COLORS[config.interior.lighting]}
              intensity={lighting.night * 60}
              distance={Math.max(model.size[0], model.size[2]) * 1.1}
              decay={2}
            />
          )}
        </group>
      ))}
    </group>
  );
}
