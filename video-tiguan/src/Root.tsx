import React from "react";
import { Composition } from "remotion";
import { Promo } from "./Promo";
import { FPS, HEIGHT, TOTAL, WIDTH } from "./timeline";

export const Root: React.FC = () => (
  <Composition id="Promo" component={Promo} durationInFrames={TOTAL} fps={FPS} width={WIDTH} height={HEIGHT} />
);
