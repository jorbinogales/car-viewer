import React from "react";
import { inOut, outExpo, prog } from "./ease";
import { INK, TEXT2, fontFamily } from "./theme";

/** Palabras con revelado de máscara (suben desde una caja invisible), escalonadas. */
export const Words: React.FC<{
  text: string;
  f: number;
  at: number;
  size: number;
  weight?: number;
  color?: string;
  stagger?: number;
  lineHeight?: number;
  letterSpacing?: string;
  align?: "left" | "center";
}> = ({ text, f, at, size, weight = 800, color = INK, stagger = 3, lineHeight = 1.05, letterSpacing = "-0.03em", align = "left" }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: align === "center" ? "center" : "flex-start" }}>
   {text.split("|").map((line, li, lines) => (
    <div key={li} style={{ display: "flex", flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start", columnGap: size * 0.26 }}>
    {line.split(" ").map((w, wi) => {
      const i = wi + (li > 0 ? lines.slice(0, li).join(" ").split(" ").length : 0);
      const p = prog(f, at + i * stagger, 26, outExpo);
      return (
        <span
          key={i}
          style={{
            display: "inline-block",
            overflow: "hidden",
            paddingBottom: size * 0.12,
            marginBottom: -size * 0.12,
            lineHeight,
          }}
        >
          <span
            style={{
              display: "inline-block",
              fontFamily,
              fontWeight: weight,
              fontSize: size,
              letterSpacing,
              color,
              transform: `translateY(${(1 - p) * 112}%)`,
              opacity: Math.min(1, p * 2.4),
            }}
          >
            {w}
          </span>
        </span>
      );
    })}
    </div>
   ))}
  </div>
);

export const Eyebrow: React.FC<{ text: string; f: number; at: number }> = ({ text, f, at }) => {
  const p = prog(f, at, 22, outExpo);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 16px 8px 12px",
        borderRadius: 999,
        border: "1px solid rgba(10,10,10,0.2)",
        background: "rgba(255,255,255,0.55)",
        fontFamily,
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: "0.22em",
        color: INK,
        opacity: p,
        transform: `translateY(${(1 - p) * 14}px)`,
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: INK }} />
      {text}
    </div>
  );
};

export const Support: React.FC<{ text: string; f: number; at: number; size?: number; width?: number }> = ({
  text,
  f,
  at,
  size = 28,
  width = 900,
}) => {
  const p = prog(f, at, 30, outExpo);
  return (
    <div
      style={{
        width,
        fontFamily,
        fontWeight: 600,
        fontSize: size,
        lineHeight: 1.32,
        letterSpacing: "-0.01em",
        color: TEXT2,
        opacity: p,
        transform: `translateY(${(1 - p) * 22}px)`,
      }}
    >
      {text}
    </div>
  );
};

/** Bloque de título: eyebrow + titular + apoyo, con salida coordinada (sube y se desvanece). */
export const TitleBlock: React.FC<{
  f: number;
  x: number;
  y: number;
  width: number;
  eyebrow: string;
  title: string;
  support: string;
  at: number;
  outAt: number;
  titleSize?: number;
  supportSize?: number;
  gap?: number;
}> = ({ f, x, y, width, eyebrow, title, support, at, outAt, titleSize = 76, supportSize = 28, gap = 14 }) => {
  const ex = prog(f, outAt - 6, 16, inOut);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap,
        opacity: 1 - ex,
        transform: `translateY(${-ex * 60}px)`,
      }}
    >
      <Eyebrow text={eyebrow} f={f} at={at} />
      <Words text={title} f={f} at={at + 6} size={titleSize} />
      <Support text={support} f={f} at={at + 18} size={supportSize} width={width} />
    </div>
  );
};
