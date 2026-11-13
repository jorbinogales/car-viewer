import React from "react";
import { Img, staticFile } from "remotion";
import manifest from "../public/capture/manifest.json";
import { clamp, prog } from "./ease";
import { EXTRA_CLICKS } from "./timeline";
import { INK, SHADOW, WHITE } from "./theme";

export type Seq = "a" | "b" | "c";
export const LAST = 149;
export const SW = 1600; // viewport CSS de la captura
export const SH = 900;
export const PAD = 8; // marco exterior de las ventanas flotantes

export const frameSrc = (seq: Seq, f: number) =>
  staticFile(`capture/${seq}/${String(clamp(Math.round(f), 0, LAST)).padStart(3, "0")}.jpg`);

/** Rectángulos de la UI real (px CSS del viewport 1600×900). */
export const L = manifest.layout;

/** Ventana flotante: marco claro + sombra suave. (x,y) = esquina del marco; w×h = tamaño del contenido. */
export const Card: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  radius?: number;
  opacity?: number;
  transform?: string;
  children: React.ReactNode;
}> = ({ x, y, w, h, radius = 26, opacity = 1, transform, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w + PAD * 2,
      height: h + PAD * 2,
      padding: PAD,
      boxSizing: "border-box",
      borderRadius: radius,
      background: "rgba(255,255,255,0.62)",
      border: "1px solid rgba(10,10,10,0.07)",
      boxShadow: SHADOW,
      opacity,
      transform,
    }}
  >
    <div
      style={{
        position: "relative",
        width: w,
        height: h,
        overflow: "hidden",
        borderRadius: radius - PAD + 2,
        background: WHITE,
        boxShadow: "inset 0 0 0 1px rgba(10,10,10,0.05)",
      }}
    >
      {children}
    </div>
  </div>
);

/** Muestra una región de la captura: centro (cx,cy) en px CSS y escala s (px de pantalla por px CSS). */
export const Viewport: React.FC<{
  src: string;
  w: number;
  h: number;
  cx: number;
  cy: number;
  s: number;
  children?: React.ReactNode;
}> = ({ src, w, h, cx, cy, s, children }) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: SW,
        height: SH,
        transformOrigin: "0 0",
        transform: `translate(${w / 2 - cx * s}px, ${h / 2 - cy * s}px) scale(${s})`,
      }}
    >
      <Img src={src} style={{ position: "absolute", left: 0, top: 0, width: SW, height: SH, display: "block" }} />
      {children}
    </div>
  </div>
);

/** Anillo que resalta un botón real de la UI (coordenadas CSS de la captura). p: 0→1 entrada, pulse: 0→1 latido. */
export const Highlight: React.FC<{ rect: { x: number; y: number; w: number; h: number }; p: number; pulse: number }> = ({
  rect,
  p,
  pulse,
}) => {
  const grow = 14 * (1 - p) + pulse * 4;
  return (
    <div
      style={{
        position: "absolute",
        left: rect.x - 5 - grow,
        top: rect.y - 5 - grow,
        width: rect.w + 10 + grow * 2,
        height: rect.h + 10 + grow * 2,
        boxSizing: "border-box",
        borderRadius: 12 + grow,
        border: `2.5px solid ${INK}`,
        opacity: p * (0.85 - pulse * 0.45),
        pointerEvents: "none",
      }}
    />
  );
};

// ---------- Cursor (no existe en las capturas: se dibuja con las pistas del manifest) ----------

export const cursorAt = (seq: Seq, f: number) => {
  const t = manifest.sequences[seq].cursor;
  return t[clamp(Math.round(f), 0, t.length - 1)];
};

export const clicksOf = (seq: Seq): number[] => [
  ...manifest.sequences[seq].cursor.filter((c) => c.click).map((c) => c.f),
  ...(EXTRA_CLICKS[seq] ?? []),
];

/** Estado del cursor para el fotograma f de la secuencia: posición, pulsado y progreso de la onda. */
export const cursorState = (seq: Seq, f: number) => {
  const c = cursorAt(seq, f);
  const clicks = clicksOf(seq);
  const fr = Math.round(f);
  const last = clicks.filter((e) => e <= fr).pop();
  const since = last === undefined ? 999 : fr - last;
  return {
    x: c.x,
    y: c.y,
    pressed: c.down || (since >= 0 && since <= 3) || clicks.includes(fr + 1),
    ripple: since >= 0 && since < 18 ? since / 18 : -1,
  };
};

export const Pointer: React.FC<{
  x: number;
  y: number;
  size?: number;
  pressed: boolean;
  ripple: number;
  opacity?: number;
}> = ({ x, y, size = 38, pressed, ripple, opacity = 1 }) => {
  const rs = size * 2.1;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity, pointerEvents: "none" }}>
      {ripple >= 0 && (
        <div
          style={{
            position: "absolute",
            left: -rs / 2,
            top: -rs / 2,
            width: rs,
            height: rs,
            boxSizing: "border-box",
            borderRadius: "50%",
            border: `${Math.max(1.5, size * 0.06)}px solid ${INK}`,
            opacity: (1 - prog(ripple, 0, 1)) * 0.55,
            transform: `scale(${0.25 + prog(ripple, 0, 1) * 0.9})`,
          }}
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{
          position: "absolute",
          left: -size * 0.125,
          top: -size * 0.083,
          overflow: "visible",
          transformOrigin: `${size * 0.125}px ${size * 0.083}px`,
          transform: `scale(${pressed ? 0.86 : 1})`,
          filter: "drop-shadow(0 3px 5px rgba(10,10,10,0.35))",
        }}
      >
        <path
          d="M3 2 L3 20 L7.6 15.8 L10.6 22.4 L13.6 21 L10.7 14.5 L17.2 14.2 Z"
          fill={INK}
          stroke={WHITE}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
