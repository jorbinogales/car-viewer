import React from "react";
import { Easing, staticFile, useCurrentFrame } from "remotion";
import { SCENES } from "../timeline";
import { clamp, inOut, outSoft, prog, spr } from "../ease";
import { Card, Highlight, L, PAD, Pointer, Viewport, cursorState, frameSrc } from "../ui";
import { TitleBlock } from "../text";

const S = SCENES.parts;

// Lienzo con sangrado a la izquierda: la pieza del tablero que se sale por el borde queda fuera del vídeo.
const INNER_H = 744;
const K = INNER_H / 836;
const CW = 1220 * K;
const PW = 380 * K;
const X0 = -150;
const Y0 = 150;
const GAP = 24;
const PX = X0 + CW + PAD * 2 + GAP;
const GAP_OFFSET = PX - X0 - 1220 * K;
const TEXT_X = 1370;

// Empuje de cámara sobre el lienzo tras alejar con la rueda (c f64 → f94): el coche despiezado gana presencia.
const zoomOf = (c: number) => {
  const p = prog(c, 64, 30, outSoft);
  return { z: 1 + 0.2 * p, vx: 610 - 10 * p, vy: 482 - 42 * p };
};

const mapPoint = (cx: number, cy: number, c: number) => {
  const { z, vx, vy } = zoomOf(c);
  const t = clamp((cx - 1180) / 60, 0, 1);
  const blend = t * t * (3 - 2 * t);
  const canvasX = X0 + PAD + CW / 2 + (cx - vx) * K * z;
  const panelX = PX + PAD + (cx - 1220) * K;
  return { x: canvasX + (panelX - canvasX) * blend, y: Y0 + PAD + INNER_H / 2 + (cy - vy) * K * z, blend };
};

/** Escena 4 (f360–510): secuencia c a 1:1 (desarmar → alejar → girar) + detalle de la pestaña Piezas. */
export const PartsInterface: React.FC = () => {
  const f = useCurrentFrame();
  if (f < S.inAt - 1 || f > S.outAt + 34) return null;
  const c = clamp(f - S.seqStart, 0, 149);
  const src = frameSrc("c", c);

  const enterC = spr(f, S.inAt);
  const enterP = spr(f, S.inAt + 3);
  const exitC = prog(f, S.outAt, 30, inOut);
  const exitP = prog(f, S.outAt + 4, 30, inOut);
  const yC = (1 - enterC) * 800 - exitC * 1100;
  const yP = (1 - enterP) * 800 - exitP * 1100;
  const fade = 1 - prog(f, S.outAt + 14, 14, Easing.linear);

  const cur = cursorState("c", c);
  const pt = mapPoint(cur.x, cur.y, c);
  const zm = zoomOf(c);
  const cy = yC + (yP - yC) * pt.blend;

  const ring = prog(c, 0, 14) * (1 - prog(c, 24, 12));
  const pulse = prog(c, 12, 16);

  // detalle flotante: la pestaña Piezas (captura real "piezas-volante")
  const dAt = S.seqStart + 76;
  const enterD = spr(f, dAt, 18, 120);
  const exitD = prog(f, S.outAt - 2, 30, inOut);
  const yD = (1 - enterD) * 520 - exitD * 1100;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Card x={X0} y={Y0} w={CW} h={INNER_H} opacity={Math.min(1, enterC * 4) * fade} transform={`translateY(${yC}px)`}>
        <Viewport src={src} w={CW} h={INNER_H} cx={zm.vx} cy={zm.vy} s={K * zm.z} />
      </Card>
      <Card x={PX} y={Y0} w={PW} h={INNER_H} opacity={Math.min(1, enterP * 4) * fade} transform={`translateY(${yP}px)`}>
        <Viewport src={src} w={PW} h={INNER_H} cx={1410} cy={482} s={K}>
          <Highlight rect={L.desarmar} p={ring} pulse={pulse} />
        </Viewport>
      </Card>
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${cy}px)` }}>
        <Pointer x={pt.x} y={pt.y} pressed={cur.pressed} ripple={cur.ripple} opacity={prog(f, 352, 8) * fade} />
      </div>
      <Card
        x={TEXT_X}
        y={540}
        w={291}
        h={288}
        radius={24}
        opacity={Math.min(1, enterD * 3) * fade}
        transform={`translateY(${yD}px) rotate(${-1.2 * enterD}deg)`}
      >
        <Viewport src={staticFile("capture/stills/piezas-volante.jpg")} w={291} h={288} cx={1410} cy={715} s={0.8} />
      </Card>
    </div>
  );
};

export const PartsTitles: React.FC = () => {
  const f = useCurrentFrame();
  if (f < S.titleAt - 2 || f > S.outAt + 26) return null;
  return (
    <TitleBlock
      f={f}
      x={TEXT_X}
      y={190}
      width={430}
      eyebrow="03 · DESPIECE"
      title="Desarma|pieza a pieza"
      support="Descubre cada componente, por dentro y por fuera."
      at={S.titleAt}
      outAt={S.outAt}
      titleSize={58}
      supportSize={26}
    />
  );
};
