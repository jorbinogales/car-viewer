import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { SCENES } from "../timeline";
import { inOut, prog } from "../ease";
import { INK, TEXT2, fontFamily } from "../theme";

const NODES = [
  { label: "360°", at: SCENES.explore.from },
  { label: "INTERIOR", at: SCENES.interior.from },
  { label: "PIEZAS", at: SCENES.parts.from },
];

/** Decoración: riel de progreso vertical (el Tiguan tiene una sola pintura: sin floración de color). */
export const Decor: React.FC = () => {
  const f = useCurrentFrame();
  const railOp = prog(f, 62, 18) * (1 - prog(f, 500, 16));
  const active = f < SCENES.interior.from - 6 ? 0 : f < SCENES.parts.from - 6 ? 1 : 2;

  return (
    <AbsoluteFill>
      {/* riel de progreso */}
      <div style={{ position: "absolute", right: 52, top: 0, width: 40, height: 1080, opacity: railOp }}>
        <div style={{ position: "absolute", left: 19, top: 300, width: 1, height: 480, background: "rgba(10,10,10,0.18)" }} />
        {NODES.map((n, i) => {
          const y = 300 + i * 240;
          const on = prog(f, n.at - 6, 22, inOut);
          const isActive = i === active;
          return (
            <React.Fragment key={n.label}>
              <div
                style={{
                  position: "absolute",
                  left: 13,
                  top: y - 7,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  boxSizing: "border-box",
                  background: isActive ? INK : "#F2F2F2",
                  border: `1.5px solid ${isActive ? INK : "rgba(10,10,10,0.35)"}`,
                  transform: `scale(${isActive ? 0.8 + on * 0.3 : 1})`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 13,
                  top: y + 22,
                  width: 14,
                  writingMode: "vertical-rl",
                  textAlign: "left",
                  fontFamily,
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: "0.28em",
                  whiteSpace: "nowrap",
                  color: isActive ? INK : TEXT2,
                  opacity: isActive ? 1 : 0.6,
                }}
              >
                {n.label}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
