import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { PAINTS, SCENES } from "../timeline";
import { inOut, outExpo, prog } from "../ease";
import { INK, TEXT2, fontFamily } from "../theme";
import { colorClickPoint } from "../scenes/Color";

const NODES = [
  { label: "360°", at: SCENES.explore.from },
  { label: "COLOR", at: SCENES.color.from },
  { label: "PIEZAS", at: SCENES.parts.from },
];

/** Decoración: riel de progreso vertical + "floración" de color al cambiar de pintura. */
export const Decor: React.FC = () => {
  const f = useCurrentFrame();
  const railOp = prog(f, 62, 18) * (1 - prog(f, 500, 16));
  const active = f < SCENES.color.from - 6 ? 0 : f < SCENES.parts.from - 6 ? 1 : 2;

  // floración de color (solo durante la escena de color)
  const bloomOp = prog(f, 214, 14) * (1 - prog(f, 346, 22));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: bloomOp }}>
        {PAINTS.map((p, i) => {
          const g = prog(f, p.at, 46, outExpo);
          const d = 2600 * g;
          const dark = p.color === "#15181C";
          const c = colorClickPoint(i, f);
          return (
            <div
              key={p.name}
              style={{
                position: "absolute",
                left: c.x - d / 2,
                top: c.y - d / 2,
                width: d,
                height: d,
                borderRadius: "50%",
                background: `radial-gradient(circle,${p.color} 0%,${p.color} 40%,transparent 72%)`,
                opacity: dark ? 0.07 : i === 0 ? 0.2 : 0.1,
              }}
            />
          );
        })}
      </div>

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
