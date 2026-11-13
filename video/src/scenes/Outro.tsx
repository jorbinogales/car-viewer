import React from "react";
import { Easing, useCurrentFrame } from "remotion";
import { SCENES } from "../timeline";
import { inOut, outExpo, prog, spr } from "../ease";
import { Card, Viewport, frameSrc } from "../ui";
import { Support, Words } from "../text";
import { INK, TEXT2, WHITE, fontFamily } from "../theme";

const S = SCENES.outro;
const K = 0.72;
const CARD_X = 880;
const CARD_Y = 236;
const LEFT = 170;

/** Escena 5 (f510–600): la ventana final (coche armado, color Iron Gray) sube mientras salen las de la escena 4. */
export const OutroInterface: React.FC = () => {
  const f = useCurrentFrame();
  if (f < S.inAt - 1) return null;
  const enter = spr(f, S.inAt + 4);
  const float = Math.sin((f - S.inAt) / 26) * 5 * enter;
  return (
    <Card
      x={CARD_X}
      y={CARD_Y}
      w={1220 * K}
      h={836 * K}
      opacity={Math.min(1, enter * 4)}
      transform={`translateY(${(1 - enter) * 820 + float}px)`}
    >
      <Viewport src={frameSrc("b", 149)} w={1220 * K} h={836 * K} cx={610} cy={482} s={K} />
    </Card>
  );
};

export const OutroTitles: React.FC = () => {
  const f = useCurrentFrame();
  if (f < S.titleAt - 2) return null;
  const at = S.titleAt;
  const row = prog(f, at + 14, 24, outExpo);
  const cta = prog(f, at + 36, 28, outExpo);
  const press = prog(f, 566, 4, Easing.linear) * (1 - prog(f, 570, 8, outExpo)); // pulsación sutil del botón
  const ripple = prog(f, 567, 22, outExpo);

  return (
    <div style={{ position: "absolute", left: LEFT, top: 0, height: 1080, width: 700, display: "flex", flexDirection: "column", justifyContent: "center", gap: 28 }}>
      <div style={{ display: "flex", gap: 40 }}>
        {["J", "A", "C"].map((l, i) => {
          const p = prog(f, at + i * 4, 28, outExpo);
          return (
            <span key={l} style={{ display: "inline-block", overflow: "hidden", lineHeight: 1, paddingBottom: 14, marginBottom: -14 }}>
              <span style={{ display: "inline-block", fontFamily, fontWeight: 800, fontSize: 150, color: INK, transform: `translateY(${(1 - p) * 115}%)` }}>
                {l}
              </span>
            </span>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontFamily,
          fontWeight: 700,
          fontSize: 26,
          color: INK,
          opacity: row,
          transform: `translateY(${(1 - row) * 14}px)`,
        }}
      >
        <span>JAC 6</span>
        <span style={{ border: `2px solid ${INK}`, borderRadius: 6, padding: "1px 9px", fontSize: 19, letterSpacing: "0.14em" }}>PHEV</span>
        <span style={{ width: 1, height: 24, background: "rgba(10,10,10,0.25)" }} />
        <span style={{ letterSpacing: "0.32em", color: TEXT2, fontSize: 20 }}>SHOWROOM 3D</span>
      </div>
      <div style={{ marginTop: 4 }}>
        <Words text="Color, puertas|y piezas: tú decides." f={f} at={at + 18} size={50} weight={700} stagger={3} letterSpacing="-0.025em" />
      </div>

      <div style={{ marginTop: 18, opacity: cta, transform: `translateY(${(1 - cta) * 24}px)`, alignSelf: "flex-start" }}>
        <div style={{ position: "relative", transform: `scale(${1 - press * 0.04})` }}>
          {ripple > 0 && ripple < 1 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 999,
                border: `2px solid ${INK}`,
                opacity: (1 - ripple) * 0.5,
                transform: `scale(${1 + ripple * 0.22})`,
              }}
            />
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              padding: "12px 12px 12px 38px",
              borderRadius: 999,
              background: INK,
              color: WHITE,
              fontFamily,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: "-0.01em",
              boxShadow: "0 24px 40px -14px rgba(10,10,10,0.45)",
            }}
          >
            Explóralo en 3D
            <span
              style={{
                width: 58,
                height: 58,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `translate(${press * 3}px, ${-press * 2}px)`,
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17 17 7M8 7h9v9" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
