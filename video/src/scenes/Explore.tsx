import React from "react";
import { Easing, useCurrentFrame } from "remotion";
import { SCENES } from "../timeline";
import { clamp, inOut, outSoft, prog, spr } from "../ease";
import { Card, Highlight, L, PAD, Pointer, Viewport, cursorState, frameSrc } from "../ui";
import { TitleBlock } from "../text";

const S = SCENES.explore;

// Geometría: dos ventanas flotantes (lienzo 3D y panel) recortadas del MISMO fotograma de la captura.
const INNER_H = 744;
const K = INNER_H / 836; // px de pantalla por px CSS
const CW = 1220 * K;
const PW = 380 * K;
const X0 = 220;
const Y0 = 270;
const GAP = 24;
const PX = X0 + CW + PAD * 2 + GAP; // x del marco del panel
const GAP_OFFSET = PX - X0 - 1220 * K; // desplazamiento extra al cruzar de lienzo a panel

/** Coordenadas CSS de la captura → píxeles de pantalla (continuo al cruzar el hueco entre ventanas). */
const mapPoint = (cx: number, cy: number) => {
  const t = clamp((cx - 1180) / 60, 0, 1);
  const blend = t * t * (3 - 2 * t);
  return { x: X0 + PAD + cx * K + GAP_OFFSET * blend, y: Y0 + PAD + (cy - 64) * K };
};

/** Escena 2 (f60–210): secuencia a 1:1. Ventanas, cursor y anillo de "Abrir todo". */
export const ExploreInterface: React.FC = () => {
  const f = useCurrentFrame();
  if (f < S.inAt - 1 || f > S.outAt + 34) return null;
  const a = clamp(f - S.seqStart, 0, 149);
  const src = frameSrc("a", a);

  const enterC = spr(f, S.inAt);
  const enterP = spr(f, S.inAt + 5);
  const exitC = prog(f, S.outAt, 30, inOut);
  const exitP = prog(f, S.outAt + 4, 30, inOut);
  const yC = (1 - enterC) * 800 - exitC * 1100;
  const yP = (1 - enterP) * 800 - exitP * 1100;
  const fade = 1 - prog(f, S.outAt + 14, 14, Easing.linear);
  const oC = Math.min(1, enterC * 4) * fade;
  const oP = Math.min(1, enterP * 4) * fade;

  // empuje sutil de cámara mientras se abren las puertas (a f68 → f94), vuelve a f118 → f152
  const push = prog(a, 68, 26, outSoft) - prog(a, 118, 34, inOut);
  const scale = 1 + 0.04 * push;

  const cur = cursorState("a", a);
  const pt = mapPoint(cur.x, cur.y);
  const cOp = prog(f, 60, 8) * fade;

  const ring = prog(a, 60, 14) * (1 - prog(a, 100, 14));
  const pulse = prog(a, 72, 18);

  return (
    <div style={{ position: "absolute", inset: 0, transformOrigin: "780px 700px", transform: `scale(${scale})` }}>
      <Card x={X0} y={Y0} w={1220 * K} h={INNER_H} opacity={oC} transform={`translateY(${yC}px)`}>
        <Viewport src={src} w={1220 * K} h={INNER_H} cx={610} cy={482} s={K} />
      </Card>
      <Card x={PX} y={Y0} w={PW} h={INNER_H} opacity={oP} transform={`translateY(${yP}px)`}>
        <Viewport src={src} w={PW} h={INNER_H} cx={1410} cy={482} s={K}>
          <Highlight rect={L.abrirTodo} p={ring} pulse={pulse} />
        </Viewport>
      </Card>
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${yC}px)` }}>
        <Pointer x={pt.x} y={pt.y} pressed={cur.pressed} ripple={cur.ripple} opacity={cOp} />
      </div>
    </div>
  );
};

export const ExploreTitles: React.FC = () => {
  const f = useCurrentFrame();
  if (f < S.titleAt - 2 || f > S.outAt + 26) return null;
  return (
    <TitleBlock
      f={f}
      x={X0}
      y={62}
      width={1100}
      eyebrow="01 · EXPLORA"
      title="Explora en 360°"
      support="Arrastra para girar. Abre puertas y portón con un toque."
      at={S.titleAt}
      outAt={S.outAt}
    />
  );
};
