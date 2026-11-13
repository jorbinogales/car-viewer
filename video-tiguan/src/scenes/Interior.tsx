import React from "react";
import { Easing, useCurrentFrame } from "remotion";
import { SCENES } from "../timeline";
import { clamp, inOut, outSoft, prog, spr } from "../ease";
import { Card, Highlight, L, PAD, Pointer, Viewport, cursorState, frameSrc } from "../ui";
import { TitleBlock } from "../text";

const S = SCENES.interior;

// Misma geometría que la escena Explora: lienzo 3D y panel recortados del MISMO fotograma de la captura.
const INNER_H = 744;
const K = INNER_H / 836; // px de pantalla por px CSS
const CW = 1220 * K;
const PW = 380 * K;
const X0 = 220;
const Y0 = 270;
const GAP = 24;
const PX = X0 + CW + PAD * 2 + GAP; // x del marco del panel
const GAP_OFFSET = PX - X0 - 1220 * K;

const mapPoint = (cx: number, cy: number) => {
  const t = clamp((cx - 1180) / 60, 0, 1);
  const blend = t * t * (3 - 2 * t);
  return { x: X0 + PAD + cx * K + GAP_OFFSET * blend, y: Y0 + PAD + (cy - 64) * K };
};

/** Escena 3 (f210–360): secuencia b 1:1. Clic en la vista "Interior", la cámara entra y se mira alrededor. */
export const InteriorInterface: React.FC = () => {
  const f = useCurrentFrame();
  if (f < S.inAt - 1 || f > S.outAt + 34) return null;
  const b = clamp(f - S.seqStart, 0, 149);
  const src = frameSrc("b", b);

  const enterC = spr(f, S.inAt);
  const enterP = spr(f, S.inAt + 5);
  const exitC = prog(f, S.outAt, 30, inOut);
  const exitP = prog(f, S.outAt + 4, 30, inOut);
  const yC = (1 - enterC) * 800 - exitC * 1100;
  const yP = (1 - enterP) * 800 - exitP * 1100;
  const fade = 1 - prog(f, S.outAt + 14, 14, Easing.linear);
  const oC = Math.min(1, enterC * 4) * fade;
  const oP = Math.min(1, enterP * 4) * fade;

  // empuje de cámara al entrar en la cabina (b f14 → f44) y vuelta al final (f116 → f146)
  const push = prog(b, 14, 30, outSoft) - prog(b, 116, 30, inOut);
  const scale = 1 + 0.05 * push;

  const cur = cursorState("b", b);
  const pt = mapPoint(cur.x, cur.y);
  const cOp = prog(f, 210, 8) * fade;

  const ring = prog(b, 0, 12) * (1 - prog(b, 30, 14));
  const pulse = prog(b, 10, 18);

  return (
    <div style={{ position: "absolute", inset: 0, transformOrigin: "780px 700px", transform: `scale(${scale})` }}>
      <Card x={X0} y={Y0} w={1220 * K} h={INNER_H} opacity={oC} transform={`translateY(${yC}px)`}>
        <Viewport src={src} w={1220 * K} h={INNER_H} cx={610} cy={482} s={K}>
          <Highlight rect={L.interior} p={ring} pulse={pulse} />
        </Viewport>
      </Card>
      <Card x={PX} y={Y0} w={PW} h={INNER_H} opacity={oP} transform={`translateY(${yP}px)`}>
        <Viewport src={src} w={PW} h={INNER_H} cx={1410} cy={482} s={K} />
      </Card>
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${yC}px)` }}>
        <Pointer x={pt.x} y={pt.y} pressed={cur.pressed} ripple={cur.ripple} opacity={cOp} />
      </div>
    </div>
  );
};

export const InteriorTitles: React.FC = () => {
  const f = useCurrentFrame();
  if (f < S.titleAt - 2 || f > S.outAt + 26) return null;
  return (
    <TitleBlock
      f={f}
      x={X0}
      y={62}
      width={1100}
      eyebrow="02 · INTERIOR"
      title="Siéntate al volante"
      support="Entra en la cabina y mira a tu alrededor."
      at={S.titleAt}
      outAt={S.outAt}
    />
  );
};
