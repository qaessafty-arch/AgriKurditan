"use client";
/**
 * Design state for the customization studio with bounded undo/redo history.
 * Continuous controls (sliders, colour pickers) call `preview` while dragging and `commit` on
 * release, so one drag produces one history entry.
 */
import { create } from "zustand";
import { DEFAULT_CONFIG, type BuildingConfig } from "@/three/config";
import { DEFAULT_PLAN_ID, getPlan } from "@/three/plans";

const HISTORY_LIMIT = 100;

export type Section = keyof BuildingConfig;

interface DesignState {
  planId: string;
  config: BuildingConfig;
  past: BuildingConfig[];
  future: BuildingConfig[];
  /** Snapshot taken when a continuous edit started. */
  pending: BuildingConfig | null;
  dirty: boolean;
  setField: <S extends Section, K extends keyof BuildingConfig[S]>(section: S, key: K, value: BuildingConfig[S][K]) => void;
  preview: <S extends Section, K extends keyof BuildingConfig[S]>(section: S, key: K, value: BuildingConfig[S][K]) => void;
  commit: () => void;
  undo: () => void;
  redo: () => void;
  load: (planId: string, config: BuildingConfig, opts?: { keepHistory?: boolean }) => void;
  setPlan: (planId: string) => void;
  restoreDefaults: () => void;
  markSaved: () => void;
}

function patch<S extends Section, K extends keyof BuildingConfig[S]>(c: BuildingConfig, section: S, key: K, value: BuildingConfig[S][K]): BuildingConfig {
  return { ...c, [section]: { ...c[section], [key]: value } };
}

const pushPast = (past: BuildingConfig[], entry: BuildingConfig) => [...past, entry].slice(-HISTORY_LIMIT);

export const useDesign = create<DesignState>((set, get) => ({
  planId: DEFAULT_PLAN_ID,
  config: structuredClone(DEFAULT_CONFIG),
  past: [],
  future: [],
  pending: null,
  dirty: false,

  setField: (section, key, value) => {
    const { config, past } = get();
    if (config[section][key] === value) return;
    set({ past: pushPast(past, config), future: [], config: patch(config, section, key, value), pending: null, dirty: true });
  },

  preview: (section, key, value) => {
    const { config, pending } = get();
    set({ pending: pending ?? config, config: patch(config, section, key, value), dirty: true });
  },

  commit: () => {
    const { pending, past, config } = get();
    if (!pending) return;
    if (JSON.stringify(pending) === JSON.stringify(config)) return set({ pending: null });
    set({ past: pushPast(past, pending), future: [], pending: null });
  },

  undo: () => {
    const { past, future, config } = get();
    const prev = past[past.length - 1];
    if (!prev) return;
    set({ past: past.slice(0, -1), future: [config, ...future].slice(0, HISTORY_LIMIT), config: prev, pending: null, dirty: true });
  },

  redo: () => {
    const { past, future, config } = get();
    const next = future[0];
    if (!next) return;
    set({ past: pushPast(past, config), future: future.slice(1), config: next, pending: null, dirty: true });
  },

  load: (planId, config, opts) => {
    const { past, config: current } = get();
    set({
      planId,
      config: structuredClone(config),
      past: opts?.keepHistory ? pushPast(past, current) : [],
      future: [],
      pending: null,
      dirty: Boolean(opts?.keepHistory),
    });
  },

  setPlan: (planId) => {
    const plan = getPlan(planId);
    const { past, config } = get();
    set({ planId: plan.id, config: structuredClone(plan.defaultConfig), past: pushPast(past, config), future: [], dirty: true });
  },

  restoreDefaults: () => {
    const { planId, config, past } = get();
    const defaults = getPlan(planId).defaultConfig;
    if (JSON.stringify(defaults) === JSON.stringify(config)) return;
    set({ config: structuredClone(defaults), past: pushPast(past, config), future: [], dirty: true });
  },

  markSaved: () => set({ dirty: false }),
}));
