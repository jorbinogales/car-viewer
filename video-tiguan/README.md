# Vídeo promocional · VW Tiguan 2025 · Car Viewer

20 s · 1920×1080 · 30 fps (600 fotogramas). React + TypeScript + Remotion 4.0.543.
Mismo diseño, tiempos y estructura que el vídeo del JAC 6 (`../video/`, que no se toca). Usa capturas **reales** de la app (`public/capture/`), con ventanas flotantes, cursor dibujado y textos sincronizados.

## Previsualizar

```bash
npm install
npx remotion studio src/index.ts      # o: npm run studio
```

## Renderizar (MP4 H.264)

```bash
npx remotion render src/index.ts Promo out/promo-tiguan.mp4 --codec h264 --concurrency 2 --crf 18
```

Los fotogramas de captura pesan (3200×1800): si falta memoria, baja `--concurrency` a 1–2.
Fotogramas sueltos para revisar: `node scripts/stills.mjs 30 110 240` → `out/checks/fNNN.png`.

## Dónde editar

| Qué | Dónde |
|---|---|
| **Todos los tiempos** (entrada/salida de cada escena, cuándo arranca cada captura) | `src/timeline.ts` |
| Copy (títulos y frases de apoyo) | `src/scenes/*.tsx` (props `title`, `support`, `eyebrow`) |
| Fondo continuo (luces, retícula, numerales, parallax) | `src/layers/Background.tsx` |
| Decoración (riel de progreso) | `src/layers/Decor.tsx` |
| Ventanas flotantes, recortes de captura, cursor | `src/ui.tsx` (`Card`, `Viewport`, `Pointer`) |
| Animación de texto (revelado por palabra) | `src/text.tsx` |
| Curvas y springs | `src/ease.ts` |
| Tipografía y colores de marca (Manrope, #0A0A0A, #EDEDED…) | `src/theme.ts` |

Escenas (cada una exporta una capa de *interfaz* y otra de *títulos*; `src/Promo.tsx` las apila):

1. `Intro` f0–60 · logotipo VW + propuesta de valor
2. `Explore` f60–210 · captura **a** (girar, abrir puertas y portón)
3. `Interior` f210–360 · captura **b** (clic en la vista Interior, entrar al puesto del conductor y mirar alrededor). En el vídeo del JAC 6 aquí iba "Color"; el Tiguan solo tiene su pintura original.
4. `Parts` f360–510 · captura **c** (desarmar, alejar, girar; asientos y tablero se quedan en su sitio) + detalle de Piezas
5. `Outro` f510–600 · logotipo + «Explóralo en 3D»

Para mover el momento de una captura cambia `seqStart` en `SCENES` (fotograma global en que se reproduce su fotograma 0).

## Sonido

`public/audio/soundtrack.wav` (música + efectos, ya sincronizados) se genera con:

```bash
python scripts/gen_audio.py      # requiere numpy y scipy
```

- Música (120 BPM, Re mayor), whooshes de los desplazamientos, impactos, campanas y el zumbido de los arrastres: sintetizados en el script.
- Clics, puertas e interfaz: grabaciones de los packs gratuitos de Shapeforms Audio (`Future UI`, `Cassette`), en la carpeta `SFX_DIR` del script.
  Su licencia permite usarlas dentro del video terminado pero no redistribuirlas, por eso `public/audio/` no está en el repo: hay que tener los packs para regenerarlo.
- Fotogramas de cada efecto: llamadas `fx(..., fotograma, ...)` en `effects()`. Si cambias tiempos en `src/timeline.ts`, muévelos también allí. Volumen de la música: `MUSIC_DB`.

## Volver a capturar la app

Con el Car Viewer en marcha (`cd ../web && npm run dev -- --port 5180` → http://localhost:5180/; el puerto 5173 lo usa otro proyecto):

```bash
node scripts/capture.mjs
```

Regenera `public/capture/{a,b,c}`, `stills/` y `manifest.json` (posiciones del cursor, rectángulos de la UI).
Si cambia el diseño de la app, revisa las constantes de recorte en `src/scenes/*.tsx` (centros `cx/cy` y escalas).
