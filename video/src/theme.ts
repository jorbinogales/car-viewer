import { loadFont } from "@remotion/google-fonts/Manrope";

export const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700", "800"],
  subsets: ["latin"],
});

export const INK = "#0A0A0A";
export const WHITE = "#FFFFFF";
export const STAGE = "#EDEDED";
export const TEXT2 = "#5C5C5C";
export const SHADOW =
  "0 60px 90px -30px rgba(10,10,10,0.22), 0 24px 40px -16px rgba(10,10,10,0.10), 0 2px 6px rgba(10,10,10,0.05)";
