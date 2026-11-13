import React from "react";
import { Easing, useCurrentFrame } from "remotion";
import { PAINTS, SCENES } from "../timeline";
import { clamp, inOut, outExpo, prog, spr } from "../ease";
import { Card, L, PAD, Pointer, Viewport, cursorState, frameSrc } from "../ui";
import { TitleBlock } from "../text";
import { INK, TEXT2, WHITE, fontFamily } from "../theme";

const S = SCENES.color;

// Ventana del lienzo (izquierda) y lupa de las muestras de Pintura (derecha).
const INNER_H = 640;
const K = INNER_H / 836;
const X0 = 140;
const Y0 = 300;
const LX = 1118; // marco de la lupa
const LW = 646; // contenido de la lupa
const LH = 268;
const S_FINAL = 1.9; // zoom final sobre las muestras (1.9 px de pantalla por px CSS de la captura)
const FOCUS = { x: 1402, y: 285 }; // centro de las muestras en la captura

/** Centro (pantalla) de cada clic de pintura dentro de la lupa, para la "floración" de color. */
export const colorClickPoint = (i: number, _f: number) => {
  const sw = (L.swatches as Record<string, { x: number; y: number; w: number; h: number }>)[PAINTS[i].name];
  return {
    x: LX + PAD + LW / 2 + (sw.x + sw.w / 2 - FOCUS.x) * S_FINAL,
    y: Y0 + PAD + LH / 2 + (sw.y + sw.h / 2 - FOCUS.y) * S_FINAL,
  };
};

/** Escena 3 (f210–360): secuencia b 1:1 + zoom real a las muestras de pintura. */
export const ColorInterface: React.FC = () => {
  const f = useCurrentFrame();
  if (f < S.inAt - 1 || f > S.outAt + 34) return null;
  const b = clamp(f - S.seqStart, 0, 149);
  const src = frameSrc("b", b);

  const enterC = spr(f, S.inAt);
  const enterL = spr(f, S.inAt + 6);
  const exitC = prog(f, S.outAt, 30, inOut);
  const exitL = prog(f, S.outAt + 5, 30, inOut);
  const yC = (1 - enterC) * 800 - exitC * 1100;
  const yL = (1 - enterL) * 800 - exitL * 1100;
  const fade = 1 - prog(f, S.outAt + 14, 14, Easing.linear);

  // zoom a la lupa: de la escala del panel a ×1.9, sin salirse de la captura por la derecha
  const s = 1.25 + (S_FINAL - 1.25) * prog(f, S.inAt + 8, 42, outExpo);
  const cx = Math.min(FOCUS.x, 1600 - LW / 2 / s);
  const cur = cursorState("b", b);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Card x={X0} y={Y0} w={1220 * K} h={INNER_H} opacity={Math.min(1, enterC * 4) * fade} transform={`translateY(${yC}px)`}>
        <Viewport src={src} w={1220 * K} h={INNER_H} cx={565} cy={490} s={1.0} />
      </Card>
      <Card x={LX} y={Y0} w={LW} h={LH} opacity={Math.min(1, enterL * 4) * fade} transform={`translateY(${yL}px)`}>
        <Viewport src={src} w={LW} h={LH} cx={cx} cy={FOCUS.y} s={s}>
          <Pointer x={cur.x} y={cur.y} size={38 / s} pressed={cur.pressed} ripple={cur.ripple} opacity={prog(f, 214, 6)} />
        </Viewport>
      </Card>
    </div>
  );
};

/** Textos coordinados con los clics: nombre de la pintura + fichas de progreso. */
export const ColorTitles: React.FC = () => {
  const f = useCurrentFrame();
  if (f < S.titleAt - 2 || f > S.outAt + 26) return null;
  const ex = prog(f, S.outAt - 6, 16, inOut);
  const label = prog(f, PAINTS[0].at - 2, 22, outExpo);
  const activeIdx = PAINTS.reduce((acc, p, i) => (f >= p.at + 4 ? i : acc), -1);

  return (
    <>
      <TitleBlock
        f={f}
        x={X0}
        y={62}
        width={1300}
        eyebrow="02 · COLOR"
        title="Cambia el color al instante"
        support="Cinco pinturas, un toque: el cambio se ve al momento."
        at={S.titleAt}
        outAt={S.outAt}
      />
      <div style={{ position: "absolute", left: LX, top: 622, width: LW + PAD * 2, opacity: 1 - ex, transform: `translateY(${-ex * 60}px)` }}>
        <div
          style={{
            fontFamily,
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "0.28em",
            color: TEXT2,
            opacity: label,
            transform: `translateY(${(1 - label) * 12}px)`,
          }}
        >
          PINTURA SELECCIONADA
        </div>
        <div style={{ position: "relative", height: 112, marginTop: 10, overflow: "hidden" }}>
          {PAINTS.map((p, i) => {
            const pin = prog(f, p.at + 6, 24, outExpo);
            const pout = i < PAINTS.length - 1 ? prog(f, PAINTS[i + 1].at, 14, outExpo) : 0;
            const ty = (1 - pin) * 115 - pout * 115;
            if (pin === 0 || pout === 1) return null;
            return (
              <div
                key={p.name}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  height: 112,
                  transform: `translateY(${ty}%)`,
                  fontFamily,
                  fontWeight: 800,
                  fontSize: 86,
                  letterSpacing: "-0.035em",
                  color: INK,
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: p.color,
                    boxShadow: "inset 0 0 0 1px rgba(10,10,10,0.18), 0 8px 18px -6px rgba(10,10,10,0.35)",
                  }}
                />
                {p.name}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 34 }}>
          {PAINTS.map((p, i) => {
            const on = i === activeIdx;
            const pin = prog(f, PAINTS[0].at + i * 3, 22, outExpo);
            return (
              <div
                key={p.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 18px 10px 12px",
                  borderRadius: 999,
                  background: on ? INK : "rgba(255,255,255,0.6)",
                  border: `1px solid ${on ? INK : "rgba(10,10,10,0.18)"}`,
                  color: on ? WHITE : INK,
                  fontFamily,
                  fontWeight: 700,
                  fontSize: 18,
                  opacity: pin,
                  transform: `translateY(${(1 - pin) * 14}px)`,
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: p.color,
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.45)",
                  }}
                />
                {p.name}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
