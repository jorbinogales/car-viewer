// Graba secuencias reales del showroom, fotograma a fotograma, con el reloj del navegador controlado
// (Playwright clock): cada fotograma avanza exactamente 1/30 s, así que giro, puertas, color y despiece
// salen fluidos y reproducibles. Requiere el showroom corriendo (cd ../web && npm run dev).
//
//   node scripts/capture.mjs [url]        (por defecto http://127.0.0.1:5173/)
//
// Salida: public/capture/{a,b,c}/NNN.jpg, public/capture/stills/*.jpg y public/capture/manifest.json
// (coordenadas en px CSS del viewport 1600×900; la imagen está a ×2).
import { createRequire } from 'node:module';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(join(root, '../web/package.json'))('playwright-core');
const URL = process.argv[2] ?? 'http://127.0.0.1:5173/';
const OUT = join(root, 'public/capture');
const VW = 1600, VH = 900, DPR = 2, FPS = 30, LEN = 150; // 5 s por secuencia
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2); // easeInOutCubic
const lerp = (a, b, t) => a + (b - a) * t;

rmSync(OUT, { recursive: true, force: true });
for (const d of ['a', 'b', 'c', 'stills']) mkdirSync(join(OUT, d), { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: DPR })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.clock.install();
await page.goto(`${URL}?dev=1&inspector=0`);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForFunction(() => window.__showroom?.store.getState().status === 'ready', null, { timeout: 120000 });
await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 200);
await page.clock.runFor(3500); // termina la animación de entrada de la cámara

let tick = 0;
const step = async () => { tick++; await page.clock.runFor(Math.round((tick * 1000) / FPS) - Math.round(((tick - 1) * 1000) / FPS)); };
const rect = (sel) => page.evaluate((s) => { const r = document.querySelector(s)?.getBoundingClientRect(); return r && { x: r.x, y: r.y, w: r.width, h: r.height }; }, sel);
const rectByLabel = (label) => page.evaluate((l) => {
  const el = [...document.querySelectorAll('button,[role=radio],[role=tab]')].find((e) => (e.getAttribute('aria-label') ?? e.textContent.trim()) === l);
  const r = el?.getBoundingClientRect();
  return r && { x: r.x, y: r.y, w: r.width, h: r.height };
}, label);
const center = (r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
const store = (fn, arg) => page.evaluate(([f, a]) => new Function('s', 'a', f)(window.__showroom.store.getState(), a), [fn, arg]);

const layout = {
  header: await rect('header'),
  canvas: await rect('canvas'),
  panel: await rect('aside') ?? await rect('[role=tabpanel]'),
  viewbar: await rect('[role=toolbar]'),
  swatches: {},
};
for (const n of ['Original del modelo', 'Ocean Blue', 'Iron Gray', 'Artic White', 'Onyx Black']) layout.swatches[n] = await rectByLabel(n);
layout.abrirTodo = await rectByLabel('Abrir todo');
layout.desarmar = await rectByLabel('Desarmar');

/**
 * Graba LEN fotogramas. `plan(f)` devuelve, para el fotograma f, la posición del cursor {x, y},
 * si el botón está pulsado (down) y si hay un clic en ese fotograma (click). Se aplica antes de avanzar el reloj.
 */
async function record(dir, plan, onFrame) {
  const cursor = [];
  let down = false;
  for (let f = 0; f < LEN; f++) {
    const p = plan(f);
    if (p) {
      await page.mouse.move(p.x, p.y);
      if (p.down && !down) await page.mouse.down();
      if (!p.down && down) await page.mouse.up();
      down = !!p.down;
      if (p.click) await page.mouse.click(p.x, p.y);
      cursor.push({ f, x: +p.x.toFixed(1), y: +p.y.toFixed(1), down, click: !!p.click });
    }
    if (onFrame) await onFrame(f);
    await step();
    await page.screenshot({ path: join(OUT, dir, `${String(f).padStart(3, '0')}.jpg`), type: 'jpeg', quality: 86 });
  }
  if (down) await page.mouse.up();
  return cursor;
}

const cv = center(layout.canvas);
// Trayectoria de arrastre suavizada entre fotogramas [f0, f1].
const drag = (f, f0, f1, from, to) => {
  const t = ease(Math.min(1, Math.max(0, (f - f0) / (f1 - f0))));
  return { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t), down: f >= f0 && f < f1 };
};
const glide = (f, f0, f1, from, to) => { const t = ease(Math.min(1, Math.max(0, (f - f0) / (f1 - f0)))); return { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t) }; };

// ---------- A · Explora en 360°: arrastrar para girar, abrir todas las puertas, girar de vuelta ----------
const abrir = center(layout.abrirTodo);
const a1 = { x: cv.x + 60, y: cv.y + 40 }, a2 = { x: cv.x - 170, y: cv.y + 30 };
const a3 = { x: cv.x - 220, y: cv.y + 60 }, a4 = { x: cv.x + 110, y: cv.y + 50 };
const cursorA = await record('a', (f) => {
  if (f < 8) return glide(f, 0, 8, { x: cv.x + 140, y: cv.y + 180 }, a1);
  if (f <= 62) return drag(f, 10, 62, a1, a2);
  if (f < 74) return glide(f, 62, 74, a2, abrir);
  if (f === 74) return { ...abrir, click: true };
  if (f < 90) return glide(f, 75, 90, abrir, a3);
  if (f <= 140) return drag(f, 92, 140, a3, a4);
  return a4;
});

// ---------- B · Color al instante (sin mover la cámara; el video hace zoom a las muestras) ----------
await store('s.setOpenings([]); s.goToView("tres-cuartos")');
await page.mouse.move(cv.x, cv.y + 300);
for (let i = 0; i < 75; i++) await step();
const sw = (n) => center(layout.swatches[n]);
const clicksB = [[16, 'Ocean Blue'], [60, 'Onyx Black'], [104, 'Iron Gray']];
const cursorB = await record('b', (f) => {
  let from = { x: cv.x + 320, y: cv.y + 120 };
  for (const [cf, name] of clicksB) {
    const to = sw(name);
    if (f < cf) return glide(f, cf - 14, cf, from, to);
    if (f === cf) return { ...to, click: true };
    from = to;
  }
  return from;
});
const paintsB = clicksB.map(([f, name]) => ({ f, name }));

// ---------- C · Desarma pieza a pieza: clic en Desarmar, despiece suave y giro para ver la profundidad ----------
const desarmar = center(layout.desarmar);
const c1 = { x: cv.x - 90, y: cv.y + 40 }, c2 = { x: cv.x + 80, y: cv.y + 30 };
const EX0 = 14, EX1 = 62; // despiece de 0 a 100 % en 1,6 s (el botón lo hace igual, solo que en ~0,2 s)
const cursorC = await record('c', (f) => {
  if (f < 12) return glide(f, 0, 12, sw('Iron Gray'), desarmar);
  if (f === 12) return desarmar;
  if (f < 70) return glide(f, 30, 70, desarmar, c1);
  if (f <= 142) return drag(f, 72, 142, c1, c2);
  return c2;
}, async (f) => {
  if (f >= EX0 && f <= EX1) await store('s.setExplode(a)', Math.round(ease((f - EX0) / (EX1 - EX0)) * 1000) / 10);
  if (f >= 62 && f < 70) await page.mouse.wheel(0, 90); // alejar con la rueda para que quepan todas las piezas al girar
});

// ---------- Fotos fijas (por si hacen falta tarjetas sueltas de interfaz) ----------
await store('s.setExplode(0); s.setOpenings([])');
for (let i = 0; i < 40; i++) await step();
await page.screenshot({ path: join(OUT, 'stills/explorar.jpg'), type: 'jpeg', quality: 90 });
await page.mouse.click(...Object.values(center(await rectByLabel('Piezas'))));
await store('s.select("volante")');
for (let i = 0; i < 40; i++) await step();
await page.screenshot({ path: join(OUT, 'stills/piezas-volante.jpg'), type: 'jpeg', quality: 90 });
await page.mouse.click(...Object.values(center(await rectByLabel('Personalizar'))));
await store('s.select(null)');
for (let i = 0; i < 20; i++) await step();
await page.screenshot({ path: join(OUT, 'stills/personalizar.jpg'), type: 'jpeg', quality: 90 });

const manifest = {
  note: 'Capturas reales del showroom. Coordenadas en px CSS (viewport 1600×900); las imágenes están a ×2 (3200×1800).',
  viewport: { w: VW, h: VH }, dpr: DPR, fps: FPS,
  sequences: {
    a: { dir: 'capture/a', frames: LEN, story: 'Arrastrar para girar (f10–62), clic en "Abrir todo" (f74, puertas animan ~18 f), girar de vuelta con puertas abiertas (f92–140).', cursor: cursorA },
    b: { dir: 'capture/b', frames: LEN, story: 'Cámara quieta. Clics en muestras de Pintura: Ocean Blue f16, Onyx Black f60, Iron Gray f104 (el coche cambia en ese fotograma).', paints: paintsB, cursor: cursorB },
    c: { dir: 'capture/c', frames: LEN, story: 'Clic en "Desarmar" (f12), despiece f14–62 (el botón pasa a "Armar"), alejar con la rueda f62–70, giro arrastrando f72–142. Color Iron Gray.', cursor: cursorC },
  },
  stills: ['capture/stills/explorar.jpg', 'capture/stills/piezas-volante.jpg', 'capture/stills/personalizar.jpg'],
  layout,
  brand: { app: 'JAC 6 PHEV · Showroom 3D', font: 'Manrope (400/600/700/800)', ink: '#0A0A0A', bg: '#FFFFFF', stage: '#EDEDED', text2: '#5C5C5C' },
  errors,
};
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ ok: true, errors, layout: { canvas: layout.canvas, panel: layout.panel } }));
await browser.close();
