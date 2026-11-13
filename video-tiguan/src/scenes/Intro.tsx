import React from "react";
import { useCurrentFrame } from "remotion";
import { SCENES } from "../timeline";
import { inOut, outExpo, prog } from "../ease";
import { INK, TEXT2, fontFamily } from "../theme";
import { Words } from "../text";

const LETTERS = ["V", "W"];

/** Escena 1 (f0–60): logotipo + propuesta de valor. Sale hacia arriba mientras la ventana de la app sube. */
export const IntroTitles: React.FC = () => {
  const f = useCurrentFrame();
  if (f > SCENES.intro.outAt + 20) return null;
  const ex = prog(f, SCENES.intro.outAt, 16, inOut);
  const line = prog(f, 4, 20, outExpo);
  const row = prog(f, 6, 20, outExpo);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 26,
        opacity: 1 - ex,
        transform: `translateY(${-ex * 150}px)`,
      }}
    >
      <div style={{ display: "flex", gap: 54, paddingLeft: 0 }}>
        {LETTERS.map((l, i) => {
          const p = prog(f, 2 + i * 4, 28, outExpo);
          return (
            <span key={l} style={{ display: "inline-block", overflow: "hidden", lineHeight: 1, paddingBottom: 18, marginBottom: -18 }}>
              <span
                style={{
                  display: "inline-block",
                  fontFamily,
                  fontWeight: 800,
                  fontSize: 200,
                  color: INK,
                  transform: `translateY(${(1 - p) * 115}%)`,
                }}
              >
                {l}
              </span>
            </span>
          );
        })}
      </div>

      <div style={{ width: 120 * line, height: 2, background: INK }} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 22,
          fontFamily,
          fontWeight: 700,
          fontSize: 30,
          color: INK,
          opacity: row,
          transform: `translateY(${(1 - row) * 16}px)`,
        }}
      >
        <span>VW Tiguan</span>
        <span
          style={{
            border: `2px solid ${INK}`,
            borderRadius: 7,
            padding: "2px 11px",
            fontSize: 22,
            letterSpacing: "0.14em",
          }}
        >
          2025
        </span>
        <span style={{ width: 1, height: 28, background: "rgba(10,10,10,0.25)" }} />
        <span style={{ letterSpacing: "0.34em", color: TEXT2, fontSize: 24 }}>CAR VIEWER</span>
      </div>

      <div style={{ width: 1180, marginTop: 14 }}>
        <Words text="Explora, entra y desarma|el VW Tiguan en 3D." f={f} at={8} size={50} weight={700} stagger={1.5} align="center" letterSpacing="-0.025em" />
      </div>
    </div>
  );
};
