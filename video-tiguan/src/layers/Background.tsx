import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BG_SHIFTS } from "../timeline";
import { inOut, prog } from "../ease";
import { fontFamily } from "../theme";

const GHOSTS = ["", "01", "02", "03", ""];
const STEP = 900;

/** Fondo único y continuo: nunca se corta; cada cambio de escena lo desplaza en vertical (parallax). */
export const Background: React.FC = () => {
  const f = useCurrentFrame();
  const scroll = BG_SHIFTS.reduce((acc, [s, e]) => acc + prog(f, s, e - s, inOut), 0); // 0..4
  const t = f / 30;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#F4F4F4 0%,#E9E9E9 100%)" }}>
      {/* luces suaves a la deriva */}
      <div
        style={{
          position: "absolute",
          width: 1500,
          height: 1500,
          left: -380 + Math.sin(t * 0.35) * 70,
          top: -520 + Math.cos(t * 0.3) * 60 - scroll * 90,
          borderRadius: "50%",
          background: "radial-gradient(circle,rgba(255,255,255,0.95) 0%,rgba(255,255,255,0) 62%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1300,
          height: 1300,
          left: 1100 + Math.cos(t * 0.28) * 80,
          top: 480 + Math.sin(t * 0.33) * 70 - scroll * 140,
          borderRadius: "50%",
          background: "radial-gradient(circle,rgba(255,255,255,0.7) 0%,rgba(255,255,255,0) 62%)",
        }}
      />
      {/* retícula de puntos (parallax 0.5) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle,rgba(10,10,10,0.13) 1.2px,transparent 1.8px)",
          backgroundSize: "56px 56px",
          backgroundPosition: `0px ${-scroll * STEP * 0.5}px`,
          WebkitMaskImage: "radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0.9) 0%,rgba(0,0,0,0) 78%)",
          maskImage: "radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0.9) 0%,rgba(0,0,0,0) 78%)",
        }}
      />
      {/* numerales fantasma: uno por escena, se deslizan en vertical */}
      {GHOSTS.map((g, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            right: 60,
            top: 540 + i * STEP - scroll * STEP - 330,
            fontFamily,
            fontWeight: 800,
            fontSize: 620,
            lineHeight: "660px",
            letterSpacing: "-0.04em",
            color: "transparent",
            WebkitTextStroke: "2px rgba(10,10,10,0.07)",
          }}
        >
          {g}
        </div>
      ))}
      {/* marcas de regla en el margen izquierdo (parallax 1) */}
      <div
        style={{
          position: "absolute",
          left: 56,
          top: 0,
          width: 22,
          height: 1080,
          backgroundImage: "repeating-linear-gradient(180deg,rgba(10,10,10,0.22) 0 1px,transparent 1px 60px)",
          backgroundPosition: `0 ${-scroll * STEP}px`,
        }}
      />
    </AbsoluteFill>
  );
};
