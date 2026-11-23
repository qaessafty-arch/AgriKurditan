"use client";
/**
 * Viewer state shared by the 3D scene and its control panels (explorer, studio, cinematic).
 * Kept outside React state so 60 fps camera work never re-renders the UI tree.
 */
import { create } from "zustand";
import type { Slot } from "@/three/generate";

export type Quality = "low" | "medium" | "high";
export type CameraPreset = "hero" | "front" | "aerial" | "side" | "rear" | "interior" | "plan";

export interface MeasurePoint { x: number; y: number; z: number }

interface ViewerState {
  quality: Quality;
  qualityLocked: boolean;
  /** 0..1 — vertical separation between floors */
  explode: number;
  /** Section cut height in metres above ground, or null for none. */
  section: number | null;
  /** 0..1 — removes the street facade to reveal the interior */
  cutaway: number;
  /** Highest visible floor index; null = all floors and roof. */
  floorLimit: number | null;
  showFurniture: boolean;
  selectedRoom: string | null;
  inspected: { slot: Slot; room?: string } | null;
  measuring: boolean;
  measure: MeasurePoint[];
  cameraRequest: { preset: CameraPreset; nonce: number } | null;
  screenshotRequest: { scale: number; nonce: number; resolve: (url: string) => void } | null;
  set: (partial: Partial<Omit<ViewerState, "set" | "requestCamera" | "requestScreenshot" | "reset">>) => void;
  requestCamera: (preset: CameraPreset) => void;
  requestScreenshot: (scale?: number) => Promise<string>;
  reset: () => void;
}

const initial = {
  explode: 0,
  section: null,
  cutaway: 0,
  floorLimit: null,
  showFurniture: true,
  selectedRoom: null,
  inspected: null,
  measuring: false,
  measure: [],
  cameraRequest: null,
  screenshotRequest: null,
};

export function detectQuality(): Quality {
  if (typeof window === "undefined") return "medium";
  const nav = navigator as Navigator & { deviceMemory?: number };
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  if (coarse && small) return "low";
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 8;
  if (coarse || cores <= 4 || memory <= 4) return "medium";
  return "high";
}

export const useViewer = create<ViewerState>((set, get) => ({
  quality: "medium",
  qualityLocked: false,
  ...initial,
  set: (partial) => set(partial),
  requestCamera: (preset) => set({ cameraRequest: { preset, nonce: Date.now() + Math.random() } }),
  requestScreenshot: (scale = 1) =>
    new Promise<string>((resolve) => {
      set({ screenshotRequest: { scale, nonce: Date.now(), resolve } });
    }),
  reset: () => set({ ...initial, quality: get().quality, qualityLocked: get().qualityLocked }),
}));
