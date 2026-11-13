// Renderiza fotogramas de comprobación a out/checks/ (un solo bundle).
//   node scripts/stills.mjs 30 110 134 ...
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const frames = process.argv.slice(2).map(Number);
mkdirSync(join(root, "out/checks"), { recursive: true });
const serveUrl = await bundle({ entryPoint: join(root, "src/index.ts") });
const composition = await selectComposition({ serveUrl, id: "Promo" });
for (const f of frames) {
  await renderStill({
    composition,
    serveUrl,
    frame: f,
    output: join(root, `out/checks/f${String(f).padStart(3, "0")}.png`),
    imageFormat: "png",
    timeoutInMS: 120000,
  });
  console.log("ok", f);
}
