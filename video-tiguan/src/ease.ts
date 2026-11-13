import { Easing, interpolate, spring } from "remotion";
import { FPS } from "./timeline";

export const outExpo = Easing.bezier(0.16, 1, 0.3, 1);
export const outSoft = Easing.bezier(0.22, 1, 0.36, 1);
export const inOut = Easing.bezier(0.65, 0, 0.35, 1);
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Progreso 0→1 entre start y start+dur con una curva bezier. */
export const prog = (f: number, start: number, dur: number, easing: (t: number) => number = outExpo) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/** Spring muy amortiguado (rebote casi imperceptible, ~1 %). */
export const spr = (f: number, start: number, damping = 20, stiffness = 140) =>
  spring({ frame: Math.max(0, f - start), fps: FPS, config: { damping, stiffness, mass: 1 } });
