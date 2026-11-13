import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { Background } from "./layers/Background";
import { Decor } from "./layers/Decor";
import { ExploreInterface, ExploreTitles } from "./scenes/Explore";
import { InteriorInterface, InteriorTitles } from "./scenes/Interior";
import { PartsInterface, PartsTitles } from "./scenes/Parts";
import { OutroInterface, OutroTitles } from "./scenes/Outro";
import { IntroTitles } from "./scenes/Intro";
import { fontFamily } from "./theme";

// Capas, de abajo arriba: fondo continuo · decoración · interfaces flotantes · títulos.
// Sonido: public/audio/soundtrack.wav, generado por scripts/gen_audio.py (música + efectos ya sincronizados).
export const Promo: React.FC = () => (
  <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
    <Audio src={staticFile("audio/soundtrack.wav")} />
    <Background />
    <Decor />
    <AbsoluteFill>
      <ExploreInterface />
      <InteriorInterface />
      <PartsInterface />
      <OutroInterface />
    </AbsoluteFill>
    <AbsoluteFill>
      <IntroTitles />
      <ExploreTitles />
      <InteriorTitles />
      <PartsTitles />
      <OutroTitles />
    </AbsoluteFill>
  </AbsoluteFill>
);
