/**
 * Time-of-day lighting model. Pure maths so it can be unit tested and shared by every scene.
 * The sun rises at 06:00 on the building's right (east), crosses in front of the street facade,
 * and sets at 18:00 on the left (west) — a south-facing facade for a northern-hemisphere site.
 */
import type { BuildingConfig } from "./config";

export interface LightingState {
  sunDirection: [number, number, number];
  sunColor: string;
  sunIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  envIntensity: number;
  /** 0 = full daylight, 1 = full night */
  night: number;
  background: string;
  fog: string;
  sky: { turbidity: number; rayleigh: number; mieCoefficient: number; mieDirectionalG: number };
  exposure: number;
  showSky: boolean;
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => Math.round(((pa >> shift) & 255) * (1 - t) + ((pb >> shift) & 255) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}

/** Solar elevation as sine, -1..1, for a simplified equinox day. */
export function sunAltitude(hour: number): number {
  return Math.sin(((hour - 6) / 12) * Math.PI) * Math.sin((68 * Math.PI) / 180);
}

export function computeLighting(env: BuildingConfig["environment"]): LightingState {
  const h = env.time;
  const t = ((h - 6) / 12) * Math.PI; // 0 at sunrise, π at sunset
  const alt = sunAltitude(h);
  const elev = Math.asin(clamp(alt, -1, 1));
  const day = smooth(-0.06, 0.22, alt);
  const night = 1 - smooth(-0.18, 0.02, alt);
  const golden = day * (1 - smooth(0.12, 0.45, alt));

  const conditions = {
    clear: { sun: 1, turbidity: 3.2, rayleigh: 1.1, haze: 0 },
    hazy: { sun: 0.72, turbidity: 11, rayleigh: 2.6, haze: 0.5 },
    overcast: { sun: 0.28, turbidity: 20, rayleigh: 0.4, haze: 1 },
  }[env.sky];

  let sunDirection: [number, number, number];
  if (alt > -0.05) {
    const az = Math.cos(t);
    sunDirection = [az * Math.cos(elev), Math.max(0.03, Math.sin(elev)), 0.55 + Math.sin(t) * 0.45 * Math.cos(elev)];
  } else {
    sunDirection = [-0.3, 0.85, 0.45]; // moonlight from high in front
  }

  const sunColor = alt > -0.05 ? mix("#ff9a5a", "#fff3e2", smooth(0.02, 0.5, alt)) : "#9fb4e6";
  const sunIntensity = alt > -0.05
    ? (0.15 + day * 3.1) * conditions.sun * env.sun
    : 0.55 * env.sun;

  const daySky = mix("#9fb9d4", "#c9c6bf", conditions.haze);
  const dusk = "#c88a68";
  const nightSky = "#0c1220";
  let background = mix(daySky, dusk, golden * (1 - conditions.haze * 0.6));
  background = mix(background, nightSky, night);

  return {
    sunDirection,
    sunColor,
    sunIntensity,
    hemiSky: mix(mix("#c8d8ea", "#ffd1b0", golden), "#3a4a6e", night),
    hemiGround: mix("#8c7f6a", "#2a2621", night),
    hemiIntensity: (0.25 + day * 0.55 + conditions.haze * 0.35) * (1 - night) + night * 0.75,
    envIntensity: Math.max(0.3, 0.25 + day * 0.75 + conditions.haze * 0.2),
    night,
    background,
    fog: mix(mix("#b7c2cc", "#d6b49c", golden), "#0d121c", night),
    sky: {
      turbidity: conditions.turbidity,
      rayleigh: conditions.rayleigh + golden * 1.4,
      mieCoefficient: 0.004 + conditions.haze * 0.01,
      mieDirectionalG: 0.82,
    },
    exposure: 1.0 + night * 0.15,
    showSky: night < 0.92,
  };
}

export const LIGHT_COLORS: Record<BuildingConfig["interior"]["lighting"], string> = {
  warm: "#ffc58a",
  neutral: "#ffe2c0",
  cool: "#f4f1ea",
};
