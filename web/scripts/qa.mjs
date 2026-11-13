// QA en navegador real contra `vite preview` (ejecutar antes `npm run build`).
// Uso: npm run qa   ·   CHROME_PATH=... para otro Chrome/Edge.
// Guarda capturas en web/qa/ y falla si hay errores de consola en el flujo principal.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const qaDir = join(root, 'qa');
const glb = join(root, 'dist/models/jac-6-phev.glb');
const PORT = 4174;
const BASE = `http://localhost:${PORT}/`;
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
mkdirSync(qaDir, { recursive: true });

const server = spawn(process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(PORT), '--strictPort'], { cwd: root, stdio: 'pipe' });
await new Promise((res, rej) => {
  server.stdout.on('data', (d) => String(d).includes(String(PORT)) && res());
  server.on('exit', (c) => rej(new Error(`vite preview terminó (${c})`)));
});

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const report = { checks: [], errors: [], metrics: {} };
const check = (name, ok, detail = '') => {
  report.checks.push({ name, ok, detail });
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ` · ${detail}` : ''}`);
};

async function open(viewport, label, { mobile = false } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  const t0 = Date.now();
  await page.goto(`${BASE}?dev=1&inspector=0`);
  await page.waitForFunction(() => window.__showroom?.store.getState().status === 'ready', null, { timeout: 120000 });
  report.metrics[`${label}.readyMs`] = Date.now() - t0;
  report.metrics[`${label}.glbLoadMs`] = await page.evaluate(() => window.__showroomLoadMs);
  return { ctx, page, errors };
}

const S = (page) => (fn, arg) => page.evaluate(([f, a]) => new Function('s', 'a', `return (${f})(s, a)`)(window.__showroom.store.getState(), a), [fn.toString(), arg]);
const settle = (page, ms = 1600) => page.waitForTimeout(ms);
const shot = (page, name) => page.screenshot({ path: join(qaDir, `${name}.png`) });

/** Cuenta píxeles blanco puro (halo del contorno) en el visor, decodificando una captura en la página. */
async function whitePixels(page) {
  const box = await page.locator('.stage canvas').boundingBox();
  const panel = await page.locator('.panel').boundingBox();
  // En móvil, solo el área libre por encima del sheet.
  if (panel && panel.y > box.y && panel.y < box.y + box.height) box.height = panel.y - box.y;
  const png = await page.screenshot({ clip: box });
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] >= 254 && d[i + 1] >= 254 && d[i + 2] >= 254) n++;
    return n;
  }, png.toString('base64'));
}

async function flow(viewport, label, mobile) {
  const { ctx, page, errors } = await open(viewport, label, { mobile });
  const st = S(page);
  await settle(page, 2000);
  await shot(page, `${label}-01-carga-inicial`);
  check(`${label}: carga sin piezas perdidas`, (await st((s) => s.model.partIds.length)) === 21);

  // Encuadre: el coche cabe entero en el área libre (proyección de la caja).
  const fit = await page.evaluate(() => {
    const { camera, getRuntime, gl } = window.__showroom;
    const b = getRuntime().bounds;
    const pts = [];
    for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) pts.push(b.min.clone().set(x, y, z).project(camera));
    const r = gl.domElement.getBoundingClientRect();
    const xs = pts.map((p) => (p.x + 1) / 2 * r.width), ys = pts.map((p) => (1 - p.y) / 2 * r.height);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys), w: r.width, h: r.height };
  });
  check(`${label}: coche completo en encuadre inicial`, fit.minX >= 0 && fit.maxX <= fit.w && fit.minY >= 0 && fit.maxY <= fit.h, JSON.stringify(fit, (k, v) => typeof v === 'number' ? Math.round(v) : v));

  // Rotación automática: gira sola al cargar, se detiene al interactuar y se reanuda tras la inactividad.
  const azimuth = () => page.evaluate(() => {
    const { camera, getRuntime } = window.__showroom;
    const c = getRuntime().bounds.getCenter(camera.position.clone());
    return (Math.atan2(camera.position.x - c.x, camera.position.z - c.z) * 180) / Math.PI;
  });
  const dAz = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
  const rotating = () => st((s) => s.autoRotate);
  await page.waitForFunction(() => window.__showroom.store.getState().autoRotate === true, null, { timeout: 15000 });
  check(`${label}: gira solo al terminar la carga`, true);
  const bar = page.getByRole('toolbar', { name: 'Vistas de cámara' });
  check(`${label}: el icono de la vista inicial está activo al cargar`, (await bar.getByRole('button', { name: 'Tres cuartos frontal' }).getAttribute('aria-pressed')) === 'true');
  const g1 = await azimuth();
  await settle(page, 1500);
  const g2 = await azimuth();
  check(`${label}: en reposo gira`, dAz(g1, g2) > 8, `${dAz(g1, g2).toFixed(1)}° en 1,5 s`);
  const rbox = await page.locator('.stage canvas').boundingBox();
  await page.mouse.move(rbox.x + rbox.width / 2, rbox.y + rbox.height * 0.4);
  await page.mouse.down();
  await settle(page, 80);
  check(`${label}: se detiene al interactuar`, (await rotating()) === false);
  const h1 = await azimuth();
  await settle(page, 500);
  check(`${label}: detenida, la cámara no se mueve`, dAz(h1, await azimuth()) < 0.05);
  await page.mouse.move(rbox.x + rbox.width / 2 + 40, rbox.y + rbox.height * 0.4, { steps: 4 }); // arrastre: no selecciona
  await page.mouse.up();
  await page.waitForFunction(() => window.__showroom.store.getState().autoRotate === true, null, { timeout: 15000 });
  check(`${label}: se reanuda tras la inactividad`, true);

  // Cambio de vista desde la barra/tira.
  await page.getByRole('toolbar', { name: 'Vistas de cámara' }).getByRole('button', { name: 'Lateral izquierdo' }).click();
  await settle(page);
  check(`${label}: vista activa tras cambio`, (await st((s) => s.activeView)) === 'lateral-izquierdo');
  await shot(page, `${label}-02-vista-lateral-izquierdo`);

  // Girar con arrastre: no selecciona y anula la vista activa.
  const canvas = page.locator('.stage canvas');
  const box = await canvas.boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height * (mobile ? 0.35 : 0.5);
  if (!mobile) {
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 160, cy, { steps: 8 });
    await page.mouse.up();
    await settle(page, 600);
    check(`${label}: arrastrar gira sin seleccionar`, (await st((s) => [s.selected, s.activeView])).every((v) => v === null));
    await page.mouse.wheel(0, -300);
    await settle(page, 600);
  }

  // Selección real con clic/toque sobre la puerta delantera izquierda (proyección de su centro).
  await page.getByRole('toolbar', { name: 'Vistas de cámara' }).getByRole('button', { name: 'Tres cuartos frontal' }).click();
  await settle(page);
  const target = await page.evaluate(() => {
    const { camera, getRuntime, gl } = window.__showroom;
    const rt = getRuntime();
    const box = rt.bounds.clone().makeEmpty();
    for (const m of rt.index.partMeshes.get('puerta-di')) box.expandByObject(m);
    const p = box.getCenter(rt.bounds.min.clone()).project(camera);
    const r = gl.domElement.getBoundingClientRect();
    return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height };
  });
  if (mobile) await page.touchscreen.tap(target.x, target.y);
  else await page.mouse.click(target.x, target.y);
  await settle(page, 900);
  const sel = await st((s) => [s.selected, s.tab]);
  check(`${label}: clic en el 3D selecciona la pieza y abre Piezas`, sel[0] === 'puerta-di' && sel[1] === 'piezas', String(sel));
  const rowSelected = await page.locator('[data-part-row="puerta-di"].is-selected').count();
  check(`${label}: visor y panel sincronizados`, rowSelected === 1);
  // Halo = píxeles blancos con selección − sin selección (mismo encuadre y mismo panel).
  const white1 = await whitePixels(page);
  await st((s) => s.select(null));
  await settle(page, 300);
  const white0 = await whitePixels(page);
  await st((s) => s.select('puerta-di'));
  await settle(page, 300);
  const outline = white1 - white0;
  check(`${label}: contorno de selección dibujado`, outline > 200, `+${outline} px de halo blanco`);
  await shot(page, `${label}-03-pieza-seleccionada`);

  // Ocultar / aislar / mostrar todo.
  await page.getByRole('button', { name: 'Aislar' }).click();
  await settle(page, 500);
  const iso = await page.evaluate(() => [...window.__showroom.getRuntime().index.meshPart].filter(([m]) => m.visible).map(([, p]) => p));
  check(`${label}: aislar deja solo la pieza`, iso.length > 0 && iso.every((p) => p === 'puerta-di'));
  await page.getByRole('button', { name: 'Mostrar todo' }).click();
  await page.getByRole('button', { name: 'Ocultar Puerta delantera izquierda' }).click();
  check(`${label}: ocultar pieza`, (await st((s) => s.hidden)).includes('puerta-di'));
  await page.getByRole('button', { name: 'Mostrar todo' }).click();
  check(`${label}: mostrar todo restaura`, (await st((s) => [s.hidden.length, s.isolated])).join() === '0,');
  await page.getByRole('button', { name: 'Cerrar ficha' }).click();

  // Despiece al 100 % (botón Desarmar de Explorar) y vuelta exacta a 0 con Armar.
  const before = await page.evaluate(() => window.__showroom.getRuntime().explode.map((e) => e.node.position.toArray()));
  await page.getByRole('tab', { name: 'Explorar' }).click();
  await page.getByRole('button', { name: 'Desarmar' }).click();
  await settle(page, 1200);
  check(`${label}: despiece al 100 %`, (await st((s) => s.explode)) === 100);
  await shot(page, `${label}-05-despiece-100`);
  await page.getByRole('button', { name: 'Armar', exact: true }).click();
  await settle(page, 1200);
  const after = await page.evaluate(() => window.__showroom.getRuntime().explode.map((e) => e.node.position.toArray()));
  check(`${label}: despiece restaura posiciones exactas`, JSON.stringify(before) === JSON.stringify(after));

  // Puertas y portón (botones con icono de Explorar).
  await page.getByRole('tab', { name: 'Explorar' }).click();
  const plan = (name) => page.locator(`.opening-grid button[aria-label="${name}"]`);
  await plan('Abrir puerta delantera izquierda').click();
  await plan('Abrir puerta trasera izquierda').click();
  await plan('Abrir portón trasero').click();
  check(`${label}: los botones abren apertura a apertura`, (await st((s) => s.openings.length)) === 3);
  await page.getByRole('button', { name: 'Abrir todo' }).click();
  check(`${label}: Abrir todo abre las 5 aperturas`, (await st((s) => s.openings.length)) === 5 && (await st((s) => s.model.openingIds.length)) === 5);
  await page.getByRole('toolbar', { name: 'Vistas de cámara' }).getByRole('button', { name: 'Tres cuartos frontal' }).click();
  await settle(page, 1600);
  await page.evaluate(() => {
    // Vista trasera 3/4 izquierda para ver puertas y portón a la vez.
    const { camera, invalidate, getRuntime } = window.__showroom;
    const c = getRuntime().bounds.getCenter(camera.position.clone());
    camera.position.set(c.x + 7.5, c.y + 3.2, c.z - 7.5);
    camera.lookAt(c);
    invalidate();
  });
  await settle(page, 400);
  await shot(page, `${label}-06-puertas-y-porton-abiertos`);
  const doorX = await page.evaluate(() => {
    const rt = window.__showroom.getRuntime();
    const box = rt.bounds.clone().makeEmpty();
    for (const m of rt.index.partMeshes.get('puerta-di')) box.expandByObject(m);
    return box.max.x;
  });
  check(`${label}: puerta abre hacia fuera`, doorX > 1.2, `max.x = ${doorX.toFixed(2)} m`);
  await page.getByRole('button', { name: 'Cerrar todo' }).click();
  check(`${label}: Cerrar todo cierra las 5 aperturas`, (await st((s) => s.openings.length)) === 0);

  // Pintura Onyx Black: solo cambia el material de pintura.
  const snap = () => page.evaluate(() => {
    const out = {};
    window.__showroom.getRuntime().root.traverse((o) => {
      if (!o.isMesh) return;
      for (const m of [].concat(o.material)) out[m.uuid] = `${m.name}:${m.color?.getHexString()}:${m.metalness}:${m.roughness}`;
    });
    return out;
  });
  const m0 = await snap();
  await page.getByRole('tab', { name: 'Explorar' }).click();
  await page.getByRole('radio', { name: 'Onyx Black' }).click();
  await page.getByRole('toolbar', { name: 'Vistas de cámara' }).getByRole('button', { name: 'Tres cuartos frontal' }).click();
  await settle(page, 1400);
  const m1 = await snap();
  const changed = Object.keys(m1).filter((k) => m0[k] !== m1[k]).map((k) => m1[k].split(':')[0]);
  check(`${label}: pintura solo cambia "Pintura"`, changed.length === 1 && changed[0] === 'Pintura', changed.join(','));
  await shot(page, `${label}-07-pintura-onyx-black`);

  // Vista interior.
  await page.getByRole('toolbar', { name: 'Vistas de cámara' }).getByRole('button', { name: 'Interior' }).click();
  await settle(page, 1800);
  await shot(page, `${label}-08-vista-interior`);
  check(`${label}: vista interior activa`, (await st((s) => s.interior)) === true);

  // Restablecer: cámara, visibilidad y configuración.
  await page.getByRole('button', { name: 'Restablecer' }).click();
  await settle(page, 1600);
  const reset = await st((s) => ({ v: s.activeView, p: s.paintId, h: s.hidden.length, e: s.explode, o: s.openings.length, a: s.accessories.length, i: s.interior }));
  check(`${label}: restablecer recupera todo`, reset.v === 'tres-cuartos' && reset.p === 'original' && !reset.h && !reset.e && !reset.o && !reset.a && !reset.i, JSON.stringify(reset));
  await page.waitForFunction(() => window.__showroom.store.getState().autoRotate === true, null, { timeout: 15000 });
  check(`${label}: restablecer reactiva la rotación`, true);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('jac-showroom:estado')));
  check(`${label}: estado guardado versionado y serializable`, saved?.version === 2 && saved.paintId === 'original');
  check(`${label}: no se guardan ocultas ni despiece (arranca ensamblado)`, saved && !('hidden' in saved) && !('explode' in saved));

  // Accesorios: canastilla arrastra barras; quitar barras quita canastilla.
  await page.getByRole('tab', { name: 'Personalizar' }).click();
  await page.getByRole('switch', { name: 'Canastilla de techo' }).click();
  const acc1 = await st((s) => s.accessories);
  await page.getByRole('switch', { name: 'Barras de techo' }).click();
  const acc2 = await st((s) => s.accessories);
  check(`${label}: dependencia canastilla → barras`, acc1.join() === 'barras,canastilla' && acc2.length === 0, `${acc1} / ${acc2}`);

  // Rendimiento: frames renderizados durante 3 s girando solo (frameloop="demand": en reposo no se renderiza).
  if (!mobile) {
    const framesIn = (ms) => page.evaluate((t) => new Promise((res) => {
      const f0 = window.__frames;
      setTimeout(() => res((window.__frames - f0) / (t / 1000)), t);
    }), ms);
    await page.waitForFunction(() => window.__showroom.store.getState().autoRotate === true, null, { timeout: 15000 });
    await settle(page, 1800);
    report.metrics[`${label}.fpsAutoRotate`] = Math.round(await framesIn(3000));
    await st((s) => s.select('carroceria'));
    await settle(page, 700);
    report.metrics[`${label}.framesEnReposo3s`] = Math.round((await framesIn(3000)) * 3);
    check(`${label}: en reposo no hay renderizado continuo`, report.metrics[`${label}.framesEnReposo3s`] <= 3, `${report.metrics[`${label}.framesEnReposo3s`]} frames en 3 s`);
    await page.waitForFunction(() => window.__showroom.store.getState().autoRotate === true, null, { timeout: 15000 });
    await settle(page, 1800);
    report.metrics[`${label}.fpsAutoRotateConCarroceriaSeleccionada`] = Math.round(await framesIn(3000));
    report.metrics[`${label}.bvhMs`] = await page.evaluate(() => window.__showroom.getRuntime().bvhMs);
  }

  check(`${label}: cero errores de consola en el flujo principal`, errors.length === 0, errors.join(' | '));
  report.errors.push(...errors.map((e) => `${label}: ${e}`));
  await ctx.close();
}

async function errorState(viewport, label, mobile) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  await page.goto(BASE);
  await page.getByRole('alert').waitFor({ timeout: 30000 });
  const title = await page.getByRole('alert').locator('h2').textContent();
  check(`${label}: GLB ausente muestra estado con ruta y Reintentar`, /Falta el archivo/.test(title) && (await page.getByText('web/public/models/jac-6-phev.glb').count()) === 1 && (await page.getByRole('button', { name: 'Reintentar' }).count()) === 1, title);
  await shot(page, `${label}-09-error-modelo-ausente`);
  await ctx.close();
}

async function corruptState(viewport, label) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto(BASE);
  await page.getByRole('alert').waitFor({ timeout: 30000 });
  const title = await page.getByRole('alert').locator('h2').textContent();
  check(`${label}: GLB corrupto muestra error comprensible`, /No se pudo cargar/.test(title), title);
  await shot(page, `${label}-10-error-modelo-incompatible`);
  await ctx.close();
}

try {
  await flow({ width: 1440, height: 900 }, 'escritorio', false);
  await flow({ width: 390, height: 844 }, 'movil', true);

  // Estado de error: GLB renombrado temporalmente en dist (se restaura siempre).
  const moved = `${glb}.qa-tmp`;
  renameSync(glb, moved);
  try {
    await errorState({ width: 1440, height: 900 }, 'escritorio', false);
    await errorState({ width: 390, height: 844 }, 'movil', true);
    writeFileSync(glb, 'esto no es un GLB');
    await corruptState({ width: 1440, height: 900 }, 'escritorio');
  } finally {
    renameSync(moved, glb);
  }
  check('GLB restaurado tras la prueba de error', existsSync(glb));
} finally {
  writeFileSync(join(qaDir, 'informe.json'), JSON.stringify(report, null, 2));
  console.log('Métricas', report.metrics);
  await browser.close();
  server.kill();
}
const failed = report.checks.filter((c) => !c.ok);
console.log(`${report.checks.length - failed.length}/${report.checks.length} comprobaciones OK`);
process.exit(failed.length ? 1 : 0);
