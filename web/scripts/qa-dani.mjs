// QA de la rotación por inactividad y del despiece ampliado, contra un servidor ya en marcha
// (dev o `vite preview`). Uso: BASE=http://127.0.0.1:5173/ node scripts/qa-dani.mjs
// Capturas en web/qa/dani/. No levanta servidor propio.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'qa', 'dani');
mkdirSync(out, { recursive: true });
const BASE = process.env.BASE ?? 'http://127.0.0.1:5173/';
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const IDLE_MS = 6000;

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const report = { checks: [], metrics: {} };
const check = (name, ok, detail = '') => {
  report.checks.push({ name, ok, detail });
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ` · ${detail}` : ''}`);
};
const wait = (page, ms) => page.waitForTimeout(ms);

/** Azimut (°) de la cámara respecto al centro del coche y distancia al centro. */
const pose = (page) =>
  page.evaluate(() => {
    const { camera, getRuntime } = window.__showroom;
    const c = getRuntime().bounds.getCenter(camera.position.clone());
    return { az: (Math.atan2(camera.position.x - c.x, camera.position.z - c.z) * 180) / Math.PI, dist: camera.position.distanceTo(c), y: camera.position.y };
  });
const frames = (page) => page.evaluate(() => window.__frames ?? 0);
const state = (page) => page.evaluate(() => { const s = window.__showroom.store.getState(); return { autoRotate: s.autoRotate, activeView: s.activeView, explode: s.explode, interior: s.interior }; });
const angDiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

/** Frames renderizados en `ms` ms. */
async function framesIn(page, ms) {
  const f0 = await frames(page);
  await wait(page, ms);
  return (await frames(page)) - f0;
}

/** Cuánto se sale de la zona libre (px) cualquier malla visible. 0 = todo cabe. */
const overflow = (page) =>
  page.evaluate(() => {
    const { camera, gl, getRuntime } = window.__showroom;
    const r = gl.domElement.getBoundingClientRect();
    const panel = document.querySelector('.panel')?.getBoundingClientRect();
    const freeBottom = panel && panel.top > r.top && panel.top < r.bottom ? panel.top - r.top : r.height;
    camera.updateMatrixWorld(true);
    let worst = 0;
    const rt = getRuntime();
    rt.root.updateMatrixWorld(true);
    for (const [m] of rt.index.meshPart) {
      if (!m.visible) continue;
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      const b = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld);
      for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) {
        const p = b.min.clone().set(x, y, z).project(camera);
        const px = ((p.x + 1) / 2) * r.width, py = ((1 - p.y) / 2) * r.height;
        worst = Math.max(worst, -px, px - r.width, -py, py - freeBottom);
      }
    }
    return Math.round(worst);
  });

async function run(label, viewport, mobile) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`${BASE}?dev=1&inspector=0`);
  await page.waitForFunction(() => window.__showroom?.store.getState().status === 'ready', null, { timeout: 120000 });
  const shot = (name) => page.screenshot({ path: join(out, `${label}-${name}.png`) });

  // 1. Gira solo tras la carga (intro 1,4 s + rampa).
  await page.waitForFunction(() => window.__showroom.store.getState().autoRotate === true, null, { timeout: 15000 });
  check(`${label}: gira solo al terminar la carga`, true);
  await wait(page, 1800); // fuera de la rampa
  const fRot = await framesIn(page, 2000);
  report.metrics[`${label}.fpsGirando`] = Math.round(fRot / 2);
  const a1 = await pose(page);
  await shot('01-girando-a');
  await wait(page, 3000);
  const a2 = await pose(page);
  await shot('02-girando-b');
  const turned = angDiff(a1.az, a2.az);
  check(`${label}: dos capturas separadas 3 s muestran giro`, turned > 20 && turned < 45, `${turned.toFixed(1)}° en 3 s (esperado ≈30°)`);
  check(`${label}: rotando, el icono de la vista inicial sigue activo`, (await state(page)).activeView === 'tres-cuartos');
  check(`${label}: mientras gira se renderiza de forma continua`, fRot / 2 >= 30, `${Math.round(fRot / 2)} fps`);

  // 2. pointerdown en el canvas la detiene en el acto.
  const box = await page.locator('.stage canvas').boundingBox();
  const px = box.x + box.width * 0.5, py = box.y + box.height * 0.08; // zona vacía sobre el coche
  const cdp = mobile ? await ctx.newCDPSession(page) : null;
  if (mobile) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: px, y: py }] });
  } else {
    await page.mouse.move(px, py);
    await page.mouse.down();
  }
  await wait(page, 60);
  const p0 = await pose(page);
  const stoppedNow = (await state(page)).autoRotate === false;
  check(`${label}: pointerdown detiene la rotación en el acto`, stoppedNow);
  await wait(page, 400);
  await shot('03-tras-pointerdown');
  const p1 = await pose(page);
  check(`${label}: tras pointerdown la cámara no se mueve`, angDiff(p0.az, p1.az) < 0.05, `${angDiff(p0.az, p1.az).toFixed(3)}°`);
  if (!mobile) await page.mouse.up();
  else await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

  // 3. En reposo y detenida no se renderiza en bucle.
  await wait(page, 600); // asienta (damping)
  const fIdle = await framesIn(page, 3000);
  report.metrics[`${label}.framesEnReposo3s`] = fIdle;
  check(`${label}: en reposo (rotación detenida) no hay renderizado continuo`, fIdle <= 3, `${fIdle} frames en 3 s`);

  // 4. Rueda detiene; el resto de acciones por el store.
  await page.waitForFunction(() => window.__showroom.store.getState().autoRotate === true, null, { timeout: IDLE_MS + 4000 });
  check(`${label}: se reanuda tras ${IDLE_MS / 1000} s sin acciones`, true);
  const q0 = await pose(page);
  await wait(page, 500);
  const q1 = await pose(page);
  // la rampa: en los primeros 0,5 s gira menos que a velocidad plena (5°)
  check(`${label}: la reanudación es suave (rampa)`, angDiff(q0.az, q1.az) < 5, `${angDiff(q0.az, q1.az).toFixed(2)}° en 0,5 s`);
  const stopBy = async (name, fn) => {
    await page.waitForFunction(() => window.__showroom.store.getState().autoRotate === true, null, { timeout: IDLE_MS + 4000 });
    await fn();
    await wait(page, 80);
    check(`${label}: ${name} detiene la rotación`, (await state(page)).autoRotate === false);
  };
  await stopBy('rueda', () => page.mouse.wheel(0, 120));
  await stopBy('teclado', () => page.keyboard.press('Shift'));
  const storeAct = (n, fn) => stopBy(`store.${n}`, () => page.evaluate(fn));
  await storeAct('select', () => window.__showroom.store.getState().select('volante'));
  await storeAct('toggleIsolate', () => window.__showroom.store.getState().toggleIsolate('volante'));
  await storeAct('showAll', () => window.__showroom.store.getState().showAll());
  await storeAct('setOpening', () => window.__showroom.store.getState().setOpening('puerta-di', true));
  await storeAct('setOpening(cerrar)', () => window.__showroom.store.getState().setOpening('puerta-di', false));
  await storeAct('setPaint', () => window.__showroom.store.getState().setPaint('onyx-black'));
  await storeAct('setAccessory', () => window.__showroom.store.getState().setAccessory('tapete', true));
  await storeAct('setAccessory(off)', () => window.__showroom.store.getState().setAccessory('tapete', false));
  await storeAct('goToView', () => window.__showroom.store.getState().goToView('lateral-izquierdo'));
  await storeAct('select(null)', () => window.__showroom.store.getState().select(null));

  // 5. Interior: no rota ni reanuda.
  await page.evaluate(() => window.__showroom.store.getState().goToView('interior'));
  await wait(page, IDLE_MS + 2500);
  check(`${label}: en vista interior no se reanuda`, (await state(page)).autoRotate === false);
  const fInt = await framesIn(page, 2000);
  check(`${label}: en interior no hay renderizado continuo`, fInt <= 3, `${fInt} frames en 2 s`);

  // 6. Restablecer vuelve al estado inicial y reactiva el giro.
  await page.evaluate(() => window.__showroom.store.getState().resetAll());
  await page.waitForFunction(() => window.__showroom.store.getState().autoRotate === true, null, { timeout: 8000 });
  check(`${label}: restablecer reactiva la rotación`, true);

  // 7. Despiece al 100 % con el casco oculto, en 3/4, reencuadrado.
  await page.evaluate(() => {
    const s = window.__showroom.store.getState();
    s.goToView('tres-cuartos');
    if (window.innerWidth < 600) s.setSheet('half');
  });
  await wait(page, 1800);
  const dist0 = (await pose(page)).dist;
  await page.evaluate(() => {
    const s = window.__showroom.store.getState();
    s.setHiddenMany(['carroceria', 'puerta-di', 'puerta-dd', 'puerta-ti', 'puerta-td', 'porton', 'techo', 'cortinilla'], true);
    s.setExplode(100);
  });
  await wait(page, 2200);
  const o3 = await overflow(page);
  check(`${label}: despiece 100 % reencuadrado, sin piezas cortadas`, o3 <= 0, `desborde máx ${o3} px`);
  await shot('04-despiece-100-casco-oculto-3-4');

  // 7b. Con el casco visible también cabe.
  await page.evaluate(() => window.__showroom.store.getState().showAll());
  await wait(page, 700);
  const o4 = await overflow(page);
  check(`${label}: despiece 100 % con casco visible, sin piezas cortadas`, o4 <= 0, `desborde máx ${o4} px`);
  await shot('05-despiece-100-casco-visible');
  await page.evaluate(() => window.__showroom.store.getState().setHiddenMany(['carroceria', 'puerta-di', 'puerta-dd', 'puerta-ti', 'puerta-td', 'porton', 'techo', 'cortinilla'], true));

  // 7c. Girando con el despiece abierto no se corta en ningún azimut.
  await page.waitForFunction(() => window.__showroom.store.getState().autoRotate === true, null, { timeout: IDLE_MS + 4000 });
  await wait(page, 3000);
  let worst = 0;
  for (let i = 0; i < 12; i++) {
    worst = Math.max(worst, await overflow(page));
    await wait(page, 1100);
  }
  check(`${label}: girando con despiece no se corta en ningún azimut`, worst <= 0, `desborde máx ${worst} px`);
  await shot('06-despiece-girando');

  // 7d. Plegar vuelve al encuadre normal.
  await page.evaluate(() => { const s = window.__showroom.store.getState(); s.setExplode(0); s.showAll(); s.goToView('tres-cuartos'); });
  await wait(page, 2200);
  const o5 = await overflow(page);
  const base = await pose(page);
  check(`${label}: plegado vuelve al encuadre normal`, o5 <= 0 && Math.abs(base.dist - dist0) / dist0 < 0.02, `desborde ${o5} px, distancia ${base.dist.toFixed(2)} m (antes del despiece ${dist0.toFixed(2)} m)`);
  report.metrics[`${label}.distanciaPlegado`] = +base.dist.toFixed(2);
  await shot('07-plegado');

  check(`${label}: cero errores de consola`, errors.length === 0, errors.join(' | '));
  await ctx.close();
}

try {
  await run('escritorio', { width: 1440, height: 900 }, false);
  await run('movil', { width: 390, height: 844 }, true);
} finally {
  writeFileSync(join(out, 'informe.json'), JSON.stringify(report, null, 2));
  console.log('Métricas', report.metrics);
  await browser.close();
}
const failed = report.checks.filter((c) => !c.ok);
console.log(`${report.checks.length - failed.length}/${report.checks.length} comprobaciones OK`);
process.exit(failed.length ? 1 : 0);
