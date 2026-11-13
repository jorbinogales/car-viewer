# Car Viewer

Configurador web de vehículos 3D (hoy publica solo el VW Tiguan 2025; con dos o más vehículos aparece un selector en la cabecera): exploración 360°, selección de piezas, capas interiores, pintura, accesorios, despiece, puertas y portón. Funciona sin backend. Todo lo que el visor sabe del vehículo sale de un archivo de configuración tipado.

> **Licencias de los modelos:**
> - **JAC 6 PHEV: no se publica.** Su modelo se extrajo del configurador web público de JAC y **no tiene licencia**. El GLB está fuera de `public/` (en `../modelos_privados/jac-6-phev.glb`) para que no entre en el build; su config sigue en `src/config/jac6.ts`. Para activarlo en local: copia el GLB a `public/models/` y añade `JAC6_CONFIG` a `src/config/vehicles.ts`.
> - `public/models/vw-tiguan-2025.glb`: "Volkswagen Tiguan (2025)" de geyges, licencia **Sketchfab Free Standard** (uso comercial dentro de un proyecto; no se puede redistribuir el modelo por separado). La app muestra el crédito. Detalles en `docs/modelo-vw-tiguan.md`.

## Ejecutar y compilar

Requisitos: Node 24 y npm 11.

```bash
npm install        # también copia el decodificador Draco a public/draco (postinstall)
npm run dev        # desarrollo en http://localhost:5173
npm run build      # typecheck (tsc -b) + build de producción en dist/
npm run preview    # sirve dist/ en http://localhost:4173
npm run test       # Vitest: lógica pura (mapeo, accesorios, transforms, persistencia)
npm run lint       # ESLint
npm run qa         # QA en navegador real (requiere build previo): capturas en qa/
```

`npm run qa` usa `playwright-core` con el Chrome instalado (`C:/Program Files/Google/Chrome/Application/chrome.exe`; otra ruta con `CHROME_PATH=...`). Arranca su propio `vite preview` en el puerto 4174.

Versiones: React 19.3 · @react-three/fiber 9.8 · @react-three/drei 10.7 · three 0.187 · Zustand 5.1 · Vite 8.3 · TypeScript 6.0 · Vitest 5.1 · lucide-react 1.72 · @fontsource/manrope 5.3.

## Dónde poner los GLB

- Modelo principal: `public/models/<id>.glb` (p. ej. `public/models/vw-tiguan-2025.glb`, servido como `/models/vw-tiguan-2025.glb`). La ruta se lee de `assets[0].url` en la config del vehículo (`src/config/vw-tiguan.ts`).
- GLB adicionales (accesorios o piezas en archivos separados): añade entradas a `assets` en la config. Si no comparten coordenadas con el principal, indica `mount` (`parentNode`, `position`, `rotationDeg`, `scale`). El ajuste global (`transform`) se aplica al contenedor común, nunca pieza a pieza.
- Compresión: el GLB usa Draco y WebP. El decodificador se sirve en local desde `public/draco/` (lo copia `scripts/copy-draco.mjs` en `postinstall`, `predev` y `prebuild`). No depende de ningún CDN.
- Si el archivo falta, la app muestra "Falta el archivo del modelo" con la ruta exacta y un botón "Reintentar". Si está dañado o es incompatible, muestra "No se pudo cargar el modelo" con los detalles técnicos. Nunca deja una pantalla vacía.

## Añadir un vehículo

1. **GLB:** copia el modelo a `public/models/<id>.glb` (se sirve como `/models/<id>.glb`). Draco y WebP como el resto (ver "Dónde poner los GLB").
2. **Config:** crea `src/config/<id>.ts` con un `VehicleConfig` (usa `jac6.ts` como plantilla). Pon un `id` único y estable (es la clave de la URL y del guardado), `assets[0].url: 'models/<id>.glb'` y los nodos reales del GLB en `parts`, `views`, etc. Ajusta también `transform` y `idleRotation`.
3. **Créditos (licencias CC BY):** si el modelo lo exige, añade `credits: { title, author, license, url, licenseUrl }`. Se muestra al pie del panel con enlaces. Sin `credits` no se muestra nada.
4. **Registro:** en `src/config/vehicles.ts`, importa la config y añádela a `VEHICLES`. Con 2 o más aparece el selector "Vehículo" en la cabecera; con uno solo no se renderiza.
5. `npm run test`: el test de mapeo debe ampliarse con el GLB nuevo (hoy lee el del JAC 6).

Qué vehículo se abre: `?vehiculo=<id>` en la URL, si no la última elección (`localStorage['car-viewer:vehiculo']`), si no `DEFAULT_VEHICLE_ID`. Un id desconocido cae al predeterminado. Cambiar en el selector guarda la elección, actualiza la URL y recarga la página (libera todos los recursos de three.js). La configuración elegida se guarda por vehículo.

## Registrar una pieza nueva sin tocar el visor

1. En Blender, deja la pieza como un **nodo con nombre estable** (puede contener varias mallas) y exporta el GLB.
2. En `src/config/jac6.ts`, añade a `parts`:
   ```ts
   { id: 'retrovisores', name: 'Retrovisores', group: 'exterior',
     nodes: ['Espejo_I', 'Espejo_D'], description: 'Retrovisores exteriores.' },
   ```
   Cada malla pertenece a la pieza del **ancestro configurado más cercano**. Por eso un hijo configurado aparte (p. ej. `Caucho_DI` dentro de `Rueda_DI`) no se mezcla con su padre. Nunca se usan índices.
3. Opcional, según lo que tenga preparado el modelo:
   - Despiece: `explode: { NombreNodo: [x, y, z] }`, desplazamiento al 100 % en metros, en el espacio del padre (+X izquierda/conductor, +Y arriba, +Z frente).
   - Apertura: `openings` con `node` (cuyo origen debe ser la bisagra), `axis`, `sign` y `maxDeg`.
   - Accesorio: `accessories` con `partId`, más `requires` (dependencias) o `exclusiveGroup` (variantes excluyentes).
   - Variantes (p. ej. rines): `variantGroups`. Si hay opciones, la sección "Opciones" aparece sola.
   - Capas interiores: `layers.partIds`. Casco exterior que se oculta en la lente Capas: `layers.shellPartIds`.
   - Presentación de materiales muy oscuros: `materialTuning: { NombreMaterial: { envMapIntensity } }`.
4. Ejecuta `npm run test`. El test comprueba que **todos los nodos de la config existen en el GLB** (lee el chunk JSON del archivo real) y que ninguna malla queda sin pieza.
5. Abre la app con `?dev=1` para ver el inspector de jerarquía y mapeo nodo → pieza. También puedes forzar estados del visor con `?dev=1&estado=cargando|indeterminado|error|ausente|sinwebgl`, y ocultar el panel con `&inspector=0`.

La UI solo ofrece lo que el GLB trae de verdad: accesorios, aperturas y despiece se filtran contra el modelo cargado.

## Estructura

```
web/
  public/models/            GLB del vehículo
  public/draco/             decodificador Draco (generado)
  scripts/copy-draco.mjs    copia el decodificador
  scripts/qa.mjs            QA en navegador con capturas
  qa/                       capturas e informe.json de la última QA
  src/
    config/types.ts         esquema tipado (VehicleConfig)
    config/jac6.ts          CONFIGURACIÓN DE EJEMPLO del JAC 6 PHEV
    config/vehicles.ts      registro VEHICLES + DEFAULT_VEHICLE_ID
    config/active.ts        vehículo activo resuelto al arrancar
    logic/                  lógica pura sin React ni escena (con tests)
      mapping.ts            nodo → pieza → grupo
      visibility.ts         piezas disponibles / visibles / aisladas
      accessories.ts        dependencias y exclusividad
      transforms.ts         despiece (original + v·t) y aperturas
      persistence.ts        localStorage versionado y validado, por vehículo
      vehicle.ts            resolución del vehículo activo y cambio
      camera.ts             encuadre por vista, órbitas, easings
      logic.test.ts
    state/store.ts          estado global (Zustand)
    scene/                  objetos 3D
      loader.ts             carga con progreso real, caché, ausente/incompatible
      compose.ts            composición del vehículo, pintura, BVH, capas
      Vehicle.tsx           aplica estado → escena (visibilidad, pintura, animaciones)
      CameraRig.tsx         vistas, transiciones, límites, interior, reencuadre del sheet
      Picking.tsx           selección por clic/toque (sin hover)
      SelectionOutline.tsx  contorno de doble trazo
      Studio.tsx            entorno de estudio y sombras de contacto
      Viewer.tsx            Canvas, WebGL y pérdida de contexto
    ui/                     interfaz (cabecera, panel/sheet, pestañas, barra de vistas, estados, dev)
    styles/tokens.css       tokens de L.E.O.A.R.T (copia de design/tokens.css)
    styles/app.css
```

## Decisiones técnicas

- **Contorno de selección:** render propio solo con una pieza seleccionada. Es una máscara de la pieza con oclusión por profundidad de las mallas opacas (los vidrios no ocluyen), más una transformada de distancia separable en dos pasadas: línea #0A0A0A de 2 px y halo blanco de 2 px, en px CSS × dpr. Se descartó `<Outlines>` porque duplica la carrocería (0,9 M caras) por trazo y se abre en aristas duras. También se descartó un EffectComposer, que movería el tone mapping y el MSAA a posproceso en todos los frames. Sin selección, el coste es cero.
- **Picking:** `three-mesh-bvh` (`acceleratedRaycast`, `firstHitOnly`). Los BVH se construyen malla a malla en `requestIdleCallback` tras la carga (≈0,9–1,2 s repartidos). Solo se lanza un rayo al soltar un clic o toque de ≤ 6 px y ≤ 500 ms con un solo dedo. No hay hover.
- **Render bajo demanda:** `frameloop="demand"`. Cámara, despiece y puertas se animan con refs en `useFrame` e `invalidate()`, sin setState por frame. Las sombras de contacto se recalculan una vez cuando cambia la geometría visible.
- **Encuadre:** distancia exacta por vista, proyectando las 8 esquinas de la caja del coche con el FOV, la relación de aspecto y el área libre (la barra de vistas en escritorio; la tira de chips y el sheet en móvil, con `setViewOffset`).
- **Pintura:** el material `Pintura` se clona una vez y el clon se comparte en sus 6 usos. Se cambian color, metalness y roughness, y el clearcoat se conserva. "Original del modelo" restaura el snapshot inicial.
- **Iluminación:** estudio procedural de `Lightformer` (sin HDRI externo, así que no puede fallar su carga), tone mapping Neutral con exposición 1, sin bloom ni posproceso. Desde three r163, con `scene.environment` el renderer ignora `material.envMapIntensity`. Por eso los materiales de `materialTuning` reciben explícitamente el mapa del estudio y su factor (en tiempo de ejecución; el GLB no se modifica).
- **Persistencia:** `localStorage["car-viewer:estado:<vehicleId>"]`, una clave por vehículo, con `version` y `vehicleId`. Solo guarda pintura, accesorios y variantes (ocultas y despiece no). La clave antigua `jac-showroom:estado` se migra una sola vez al JAC 6 (`migrateLegacy`). Una versión distinta se descarta y los ids desconocidos se eliminan uno a uno.

## Recursos faltantes y funciones que dependen de ellos

| Falta | Efecto hoy |
|---|---|
| Licencia del modelo 3D | Solo para uso interno. |
| Logotipo JAC en SVG | Encabezado tipográfico provisional (`BrandMark` en `src/ui/Header.tsx`; colocar en `public/brand/jac-logo.svg` y sustituir ese componente). |
| Nombres comerciales y descripciones definitivas | Los textos de `parts` son provisionales y descriptivos (`provisionalCopy: true`). |
| Versión comercial | Solo se muestra "PHEV". |
| Textos de puntos informativos | La función "Puntos informativos" no se ofrece. |
| Más variantes de rines | Sin selector de rines (solo existe una). |
| Capó separado | Sin apertura de capó. |
| Variante negra de la canastilla | No se ofrece; anotado como `pending` en la config. |
| Dependencia portabicicletas ↔ enganche | Sin regla; anotada como `pending`. |
| Signos y límites de apertura | Se verificaron visualmente con capturas (`qa/*-06-puertas-y-porton-abiertos.png`): los valores de `docs/modelo-jac6.md` son correctos. |

## Comprobaciones

- `npm run build`: sin errores de TypeScript. `npm run lint`: sin avisos.
- `npm run test`: 21 tests. Cubren el mapeo contra el GLB real (nodos existentes, mallas sin pieza = 0, jerarquía Rueda → Caucho, puerta multi-malla), dependencia y exclusividad de accesorios, visibilidad/aislamiento, restauración bit a bit (≤ 1e-9) del despiece 0 → 1 → 0,37 → 0, cierre exacto de puertas y sentido de apertura, y persistencia (versión vieja, otro vehículo, ids desconocidos, variantes).
- `npm run qa`: 43 comprobaciones en escritorio 1440×900 y móvil 390×844. Cubren carga, encuadre completo, vistas, arrastre que no selecciona, selección real con clic o toque, sincronía visor-panel, contorno, ocultar/aislar/mostrar todo, capas con el casco oculto, despiece 100 % y vuelta exacta, puertas y portón, pintura que solo cambia `Pintura`, vista interior, Restablecer, guardado versionado, dependencia canastilla → barras, cero errores de consola, GLB ausente y GLB corrupto (se renombra y restaura en `dist/`). Resultados en `qa/informe.json`.
