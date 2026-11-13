# JAC 6 PHEV · Showroom 3D — Dirección visual y especificación de UI

Autor: L.E.O.A.R.T · Destinatario: D.A.N.I (React + TS + Vite + R3F + Drei + Zustand)
Tokens: `./tokens.css` (todo valor numérico de este documento sale de ahí; si difieren, manda el token).

## 0. Contrato de dirección

| Decisión | Valor |
|---|---|
| Modo | Experience con shell de Operate: el vehículo lidera, la interfaz se retira |
| Dirección | **Showroom blanco, tinta negra** (monocromo, hairlines, mucho aire) |
| Fuente | **Manrope** vía `@fontsource/manrope` 5.3.0, pesos 400 / 600 / 700 / 800 |
| Iconos | `lucide-react` (1.72.0), trazo 1.5, 20 px |
| Color | Blanco `#FFFFFF`, gris de escenario `#EDEDED`, tinta `#0A0A0A`. Cero acentos. Cero degradados decorativos. Cero glass |
| Motion | Presupuesto bajo: cámara (900 ms), sheet (320 ms), fades (160 ms). Nada decorativo en bucle |
| Tema | Solo claro. No hay tema oscuro (el estudio claro es mandato del cliente) |

Lo que NO debe parecer: dashboard administrativo (tablas densas, cards apiladas con sombras, chips de estado, KPI). Debe parecer un configurador de marca: pocas palabras, títulos claros, filas amplias, el coche protagonista.

## 1. Referencias: observado vs decidido

Ambas URL cargaron, pero **solo entregaron texto/DOM, no captura visual**. Por eso no afirmo nada sobre colores, tipografía real, espaciados ni animaciones de ninguna de las dos.

### 1.1 https://nomad-camper-studio.vercel.app/ (cargó, contenido casi vacío)
- **Observado**: título "NOMAD Studio — Configura una HYMER Venture S en 3D"; es un configurador 3D de un vehículo; el HTML expone solo el crédito del autor y dos enlaces externos. La UI es una app renderizada por JS/canvas; no pude leer paneles, pestañas, controles, hotspots ni estados.
- **No observado** (no lo uso como fuente): layout, secciones del panel, tipografía, color, loading.
- **Tomado**: únicamente el género (configurador 3D de vehículo con exploración libre). El resto de la estructura (header + visor + panel + barra de vistas) viene del brief del cliente y de decisiones mías.

### 1.2 https://jacvenezuela.com/ (cargó, solo texto)
- **Observado**: el header muestra "JAC Motors" con dos archivos de logo (estándar y alt); los titulares van en MAYÚSCULAS (ej. "TU FAMILIA MERECE UN JAC"); los nombres de modelo van en negrita con una línea debajo; taglines cortos; fichas de modelo con nombre, tagline, líneas de especificación breves y un botón; filtros PASAJEROS / CAMIONES / UTILITARIOS; copy en español de Venezuela, tono directo ("¡Escríbenos!"). No aparecen "JAC 6" ni "PHEV" en el contenido leído.
- **No observado**: colores, tipografía real, forma del logo, espaciados, imágenes.
- **Tomado de lo observado**: (a) nombre de modelo en negrita con filete debajo → el nombre del vehículo y los títulos de pestaña llevan peso 700 y un filete de 1 px (la línea bajo la pestaña activa); (b) titulares en mayúsculas → etiquetas de sección y wordmark en mayúsculas con tracking; (c) especificaciones en líneas cortas, no tablas → descripciones de pieza en 1–3 líneas; (d) copy directo en español.
- **Decidido por mí** (no viene de la referencia): Manrope, la escala tipográfica, la paleta monocroma, radios, iconografía, todo el sistema de componentes y la estructura del panel. No uso el rojo/colores de marca de JAC porque no los pude observar y el cliente exige monocromo.

### 1.3 Logo
No hay logo JAC en `D:\inmersive_showroom` (solo `JAC_6_PHEV.blend`). Encabezado tipográfico provisional (§6.1). Cuando el cliente entregue el SVG: colocarlo en `public/brand/jac-logo.svg`, sustituir únicamente el componente `BrandMark`, alto 20 px (escritorio) / 18 px (móvil), zona de respeto = alto de la "J" a cada lado. No recolorear: solo versión negra monocroma sobre blanco.

## 2. Tokens (resumen; valores completos en `tokens.css`)

### 2.1 Color e indicadores de contraste (calculados, WCAG 2.x)

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| `--c-bg` | #FFFFFF | header, panel, sheet | — |
| `--c-bg-subtle` | #F5F5F5 | hover fila, seleccionado, skeleton | texto `--c-text` 18.2:1 |
| `--c-bg-stage` | #EDEDED | visor / escena | `--c-text` 16.9:1, `--c-text-2` 5.71:1 |
| `--c-text` | #0A0A0A | texto principal | 19.8:1 sobre blanco |
| `--c-text-2` | #5C5C5C | secundario | 6.69:1 blanco · 6.13:1 #F5F5F5 · 5.71:1 stage |
| `--c-text-3` | #767676 | terciario / pieza oculta | 4.54:1 sobre blanco (mínimo AA; no usar sobre stage ni #F5F5F5) |
| `--c-text-disabled` | #A3A3A3 | solo deshabilitado | exento |
| `--c-ink` | #0A0A0A | primario, seleccionado | texto blanco 19.8:1 |
| `--c-ink-hover` | #262626 | hover primario | texto blanco 15.1:1 |
| `--c-line` | #E4E4E4 | divisores, borde de panel | decorativo |
| `--c-line-card` | #D4D4D4 | borde reposo de fila/tarjeta | decorativo: el control se identifica por su texto |
| `--c-line-control` | #8A8A8A | borde de switch apagado, thumb | 3.45:1 sobre blanco (≥3:1 UI) |

Regla: **nunca** comunicar estado solo con color. Todo estado activo = borde 2 px + peso/inversión + icono Check (excepciones en §5.1). Funciona en `forced-colors` porque no depende del matiz.

### 2.2 Tipografía (Manrope)

Importar solo latín (incluye áéíóúñ¿¡·): `@fontsource/manrope/latin-{400,600,700,800}.css`. `font-display: swap` (ya lo trae fontsource). Precargar 400 y 700 con `?url` si se mide FOUT. Números con `font-variant-numeric: tabular-nums` (porcentajes, contadores).

| Rol | Tamaño / interlínea | Peso | Otros |
|---|---|---|---|
| Wordmark provisional | 22 / 22 | 800 | MAYÚSCULAS, tracking .18em |
| Nombre de vehículo (header) | 16 / 22 | 700 | MAYÚSCULAS, tracking .02em |
| Título de pestaña/estado/ficha | 18 / 24 | 700 | tracking −0.01em |
| Cuerpo y controles | 14 / 20 | 600 etiquetas · 400 párrafos | |
| Descripciones, ayudas, hint | 13 / 18 | 400 (hint: 600) | color `--c-text-2` |
| Etiqueta de sección | 12 / 16 | 700 | MAYÚSCULAS, tracking .08em, `--c-text-2` |
| Versión (PHEV) | 12 / 16 | 700 | MAYÚSCULAS, tracking .08em |

Prohibido: cursiva, subrayado decorativo, más de 2 pesos por pantalla visible (+ el 800 del wordmark), texto < 12 px, texto sobre el visor sin contenedor blanco.

### 2.3 Espaciado y radios
Escala base 4: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64. Gutter del panel 24 px (20 px < 480 px). Entre secciones del panel: 32 px. Entre etiqueta de sección y su contenido: 12 px. Entre filas: 8 px (tarjetas) / 4 px (filas de Piezas).
Radios: 4 (botones, segmentos) · 8 (filas, tarjetas, barra, popover, toast) · 12 (ficha, estados) · 16 (sheet) · 999 (swatch, switch, hotspot, hint).
Sombras: solo `--shadow-float` (barra de vistas, hint, popover, toast) y `--shadow-sheet`. El panel y el header no llevan sombra, solo hairline.

## 3. Iconos (`lucide-react`, verificado contra 1.72.0)

`lucide-react` justificado: línea simple y consistente, ya es estándar en React, tree-shakeable, todos los nombres de abajo existen. Config global: `size={20}`, `strokeWidth={1.5}`, `aria-hidden="true"`; Check usa `strokeWidth={2}`. Todo icono acompaña a una etiqueta de texto salvo los botones solo-icono (que llevan `aria-label` y `title`).

| Acción / lugar | Icono |
|---|---|
| Restablecer | `RotateCcw` |
| Pantalla completa / salir | `Maximize` / `Minimize` |
| Pestaña Explorar | `Compass` |
| Pestaña Personalizar | `SlidersHorizontal` |
| Pestaña Piezas | `Boxes` |
| Confirmación de selección (filas, swatch, tarjetas) | `Check` (strokeWidth 2) |
| Puntos informativos (toggle y hotspot cerrado) | `Info` (toggle) · `Plus` (marcador en escena) |
| Abrir todo / Cerrar todo (Explorar) | `DoorOpen` / `DoorClosed` |
| Pieza visible / oculta | `Eye` / `EyeOff` |
| Enfocar | `Crosshair` |
| Aislar (reposo / activo) | `Focus` / `Check` |
| Mostrar todo | `Eye` |
| Vistas de cámara | Set propio `ViewIcon` (§3.1), no lucide |
| Lente "Capas" (segmento) | `Layers` |
| Cerrar ficha / popover | `X` |
| Plegar grupo | `ChevronDown` (rota 180° al plegar, 160 ms) |
| Reintentar | `RotateCw` |
| Botón en estado cargando | `LoaderCircle` (gira 800 ms lineal) |
| Error de carga | `TriangleAlert` (28 px) |
| Modelo ausente | `PackageX` (28 px) |
| Sin WebGL | `MonitorOff` (28 px) |
| Copiar ruta | `Copy` |
| Hint inicial | `Move3d` (16 px) |
| Aviso de éxito (toast) | `Check` |

### 3.1 Iconos de vista (set propio, `web/src/ui/icons.tsx`)

Rev. 2 (feedback del cliente): las vistas pasan a ser **solo icono**. Un pictograma genérico no las distinguía, así que hay siluetas propias del coche (SUV con barras de techo) vistas desde cada ángulo. Mismo contrato que lucide: 24 × 24, trazo 1.5, `round`, `currentColor`, sin relleno. Un único componente `ViewIcon viewId=…`; si una vista de la config no tiene icono, la barra cae a texto corto.

| Vista | Silueta |
|---|---|
| Tres cuartos frontal | cara frontal a la izquierda + flanco en perspectiva |
| Frente | de cara: parabrisas, faros, dos ruedas |
| Trasera | de cola: luneta, pilotos, matrícula |
| Lateral izquierdo | perfil con el morro a la **izquierda** (como se ve al mirar ese flanco) |
| Lateral derecho | espejo del anterior: morro a la derecha |
| Superior | planta vertical con cabina y ruedas |
| Interior | volante visto desde el asiento |

Nombre en español en `aria-label`, `title` y tooltip propio (§6.6).

### 3.2 Iconos de apertura (`OpeningIcon`, mismo módulo)

Mismo contrato (24 × 24, trazo 1.5, `currentColor`). Base común: contorno de planta de 8 × 17 con dos ticks de faros (frente arriba). La apertura que representa se dibuja en trazo grueso (3): `puerta-di/ti` en el flanco izquierdo, `puerta-dd/td` en el derecho, bisagra delantera, giro de 60° al abrir; `porton` como barra en la cola y, abierto, panel desplazado detrás. Un id sin icono se muestra solo con texto.

## 4. Layout

### 4.1 Escritorio (≥ 1024 px). Referencia 1440 × 900

```
+------------------------------------------------------------------------------------------+
| JAC |  JAC 6 [PHEV]                                  [ Restablecer ] [ Pantalla completa ] | 64
+----------------------------------------------------------------+-------------------------+
|                                                                |Explorar|Personal.|Piezas| 52
|                                                                +-------------------------+
|                                                                | Explorar                | h2 18/700
|                                                                | Abre las puertas y el   | 13 gris
|                                                                | portón.                 |
|                      VISOR 3D                                  | [◧ Delantera izq.][◨ Delantera der.]
|                      fondo #EDEDED                             | [◧ Trasera izq.  ][◨ Trasera der.  ]
|                      (canvas ocupa 100 % del área,             | [◫ Portón trasero                 ]
|                       sin padding)                             | [Abrir todo]  [Cerrar todo]
|                                                                |                         |
|          [ Arrastra para girar · Usa la rueda para acercarte ] |                         |
|              [ ◫ ] [ ▭ ] [ ▭ ] [ ▭ ] [ ▭ ] [ ▭ ] [ ◎ ]          |  barra de vistas = iconos|
+----------------------------------------------------------------+-------------------------+
 visor = 100vw − 360 px (380 px ≥ 1440)                           panel 360 px · borde-izq 1px
```

- Header: alto 64, fondo blanco, borde inferior 1 px `--c-line`, `padding: 0 24px`. Grupo izquierdo: wordmark · divisor vertical 1×24 `--c-line` (margen 0 16) · "JAC 6" · "PHEV". Grupo derecho: dos botones secundarios 40 px con 8 px de separación.
- Visor: ocupa el resto, `position: relative`, el `<Canvas>` es 100 % del contenedor. Overlays (hint, barra de vistas, hotspots, estados) son hijos HTML del contenedor, no del canvas.
- Panel: ancho `--w-panel` (360; 380 desde 1440), fondo blanco, `border-left: 1px`, columna con pestañas fijas (52 px) + contenido con `overflow-y: auto` y `scrollbar-gutter: stable`. Barra de scroll fina nativa (`scrollbar-width: thin; scrollbar-color: #BDBDBD transparent`).
- Barra de vistas: ver §6.6. Hint: ver §6.7.

### 4.2 Móvil/tablet (< 1024 px). Referencia 390 × 844

```
 estado MEDIO (46 dvh)                  estado PLEGADO (72 px)         estado EXPANDIDO (66 dvh)
+--------------------------------+     +----------------------------+  +----------------------------+
| JAC | JAC 6 PHEV        [R] [F]|56   | JAC | JAC 6 PHEV    [R] [F]|  | JAC | JAC 6 PHEV    [R] [F]|
+--------------------------------+     +----------------------------+  +----------------------------+
|( 3/4 )( Frente )( Trasera )( I |52   |( 3/4 )( Frente )( Tras...   |  |( 3/4 )( Frente )( Tras...   |
|                                |     |                            |  |                            |
|        [ vehículo ]            |     |                            |  |      [ vehículo ]          |
|     centrado en el área libre  |     |      [ vehículo ]          |  |   (más pequeño, visible)   |
|  [Arrastra para girar · Pelliz]|     |   (área libre grande)      |  +----------------------------+
+--------------------------------+     |                            |  |            ----            |
|            ----   (handle)     |     | [Arrastra para girar ·...] |  | Explorar|Personal.|Piezas|
| Explorar | Personalizar | Piezas|     +----------------------------+  |----------------------------|
|--------------------------------|     |            ----            |  | contenido desplazable      |
| contenido desplazable          |     | Explorar|Personal.|Piezas  |  | (scroll interno)           |
| [ Tres cuartos frontal  ✓ ]    |     +----------------------------+  |                            |
| ...                            |        72 px + safe-area-bottom    +----------------------------+
+--------------------------------+
```

- `[R]` `[F]`: botones solo-icono 44 × 44 (RotateCcw, Maximize). Header 56, `padding: 0 16px`. Vehículo: "JAC 6" 14/700 + "PHEV" 12/700; si no cabe (< 360 px) se oculta "PHEV".
- Tira de vistas móvil: debajo del header, `position: absolute`, alto 52, scroll horizontal solo si no cabe (`overflow-x: auto; scroll-snap-type: x proximity`; con 7 botones de 44 + gap 8 + 16 de gutter cabe justo a 390 px), botones **solo icono** circulares de 44 × 44, gap 8, padding lateral 16. Activo = fondo `--c-ink`, icono blanco. Reposo = blanco, borde 1 px `--c-line-strong`. Es el mismo componente `ViewBar` que la barra de escritorio, re-maquetado por CSS (sin tooltip: no hay hover).
- Bottom sheet: ver §5.

### 4.3 Breakpoints y reglas
- ≥ 1440: panel 380. 1024–1439: panel 360. 480–1023: sheet, gutters 24. < 480: sheet, gutters 20. Landscape bajo (`max-height: 500px`): panel lateral 320, header 48, sin sheet.
- La barra de vistas escritorio: a < 1180 px de ancho de ventana pasa a `overflow-x: auto` (7 etiquetas cortas ≈ 600 px).
- Verificar a 400 px: sin scroll horizontal de página, gutters ≥ 16, nada con `min-width` > viewport.

## 5. Bottom sheet y cámara (móvil)

### 5.1 Estados del sheet
| Estado | Alto visible | Contenido |
|---|---|---|
| Plegado | `--sheet-h-collapsed` (72) + `env(safe-area-inset-bottom)` | handle + pestañas. Contenido `inert` y oculto |
| Medio (por defecto al elegir pestaña) | 46 dvh | pestañas + contenido con scroll |
| Expandido | 66 dvh (máx) | idem. Siempre quedan ≥ 34 dvh de visor |

- Estructura: `[handle 20 px][tabs 52 px][contenido scrollable]`. Fondo blanco, radio superior 16, `--shadow-sheet`, borde superior 1 px `--c-line`. Handle: barra 36 × 4, radio 2, color `#BDBDBD`, centrada; es un `<button aria-expanded>` de zona completa 44 px de alto que cicla plegado → medio → expandido → plegado; `aria-label="Cambiar tamaño del panel"`.
- Arranque: plegado. Tocar una pestaña con el sheet plegado lo sube a medio. Seleccionar una pieza en el 3D con el sheet plegado lo sube a medio y abre Piezas.
- Snap: el sheet se arrastra con `transform: translateY` (no animar `height`). Tras soltar: velocidad > 0.5 px/ms salta al siguiente estado en esa dirección; si no, al más cercano. Duración `--dur-sheet` (320 ms), `--ease-out`.
- Excepción de convención "icono de confirmación": las pestañas, segmentos y la tira de vistas son controles compactos que comunican activo con inversión de color/subrayado + borde, sin Check (no hay espacio sin desplazar la etiqueta). Filas, swatches y tarjetas sí llevan Check.

### 5.2 Separación de gestos (regla dura)
1. **Canvas**: `touch-action: none; user-select: none; -webkit-user-select: none`. Un dedo = rotar, dos dedos = zoom (pellizco). Pan desactivado. El contenedor del visor tiene `overscroll-behavior: none`.
2. **Handle y fila de pestañas**: `touch-action: none`. Son la ÚNICA zona que arrastra el sheet.
3. **Contenido del sheet**: `overflow-y: auto; overscroll-behavior: contain; touch-action: pan-y`. Scroll normal, nunca mueve el sheet ni gira el coche. No hay "arrastrar hacia abajo desde el contenido para plegar" (se descarta a propósito: es la fuente de conflictos).
4. Un toque en el canvas nunca pliega el sheet. El coche no se desplaza con el scroll del panel.
5. `body { position: fixed; inset: 0; overflow: hidden }` en móvil. El sheet usa `dvh`, no `vh`.

### 5.3 Reencuadre de cámara según el sheet (obligatorio)
El canvas ocupa todo el visor (100 vw × (100 dvh − header)) **debajo** del sheet; no se redimensiona al arrastrar (evita relayout). La cámara compensa:

- `H` = alto del visor, `S` = alto visible del sheet (plegado: 72 + safe-area; medio: 0.46·dvh; expandido: 0.66·dvh), `top` = 52 (tira de vistas) + 8.
- Rectángulo libre: `y0 = top`, `y1 = H − S − 8`, `F = y1 − y0`, `centro = (y0 + y1) / 2`.
- **Desplazar**: aplicar `camera.setViewOffset(W, H, 0, Δ, W, H)` con `Δ = H/2 − centro` (ajustar signo hasta que el centro del bounding box proyectado caiga en `centro`; validar visualmente con el coche en Frente).
- **Reajustar distancia**: `distancia = max(d_alto, d_ancho)` donde el bounding box proyectado ocupa como máximo 0.90·F de alto y 0.94·W de ancho (usar la esfera/caja del modelo y el fov actual).
- Mientras se arrastra el sheet: solo se actualiza el `Δ` (traslación) por frame. Al soltar: se reajusta distancia con `--dur-sheet` y `--ease-out` (mismo timing que el sheet → el coche se mueve sincronizado).
- Recalcular también en `resize` y `orientationchange` (debounce 100 ms).
- Valores de referencia en 390 × 844: medio → F ≈ 332, centro ≈ y 282; expandido → F ≈ 163 (el coche queda pequeño pero entero); plegado → F ≈ 580.
- Con `prefers-reduced-motion`: reencuadre instantáneo.
- En escritorio no se reencuadra (el panel es hermano del canvas, no lo cubre).

## 6. Componentes

Estados exigidos: reposo, hover, foco visible, activo/seleccionado, deshabilitado, cargando. `hover` solo con `@media (hover: hover)`. Foco = `outline: 2px solid #0A0A0A; outline-offset: 2px` en todo (sobre fondos blancos y grises se lee; no depender del color del control). Pulsado (`:active`) se indica en la tabla.

### 6.0 Primitivos

**Botón primario** (Reintentar, Enfocar): alto 40 (44 táctil), `padding: 0 20px`, radio 4, 14/600, icono 18 px a la izquierda con gap 8.
| Estado | Aspecto |
|---|---|
| Reposo | fondo #0A0A0A, texto #FFF, borde 1 px #0A0A0A |
| Hover | fondo #262626 (100 ms) |
| Pulsado | fondo #000 |
| Foco | outline 2 px #0A0A0A, offset 2 |
| Deshabilitado | fondo #F0F0F0, texto #A3A3A3, borde #F0F0F0, `aria-disabled`, sin hover |
| Cargando | `aria-busy`, icono → `LoaderCircle` girando, etiqueta intacta, ignora clics |

**Botón secundario** (Restablecer, Pantalla completa, Ocultar, Mostrar todo, Copiar ruta): igual medidas; fondo #FFF, texto #0A0A0A, borde 1 px #0A0A0A. Hover fondo #F5F5F5. Pulsado #EBEBEB. Deshabilitado: texto #A3A3A3, borde #E4E4E4. Cargando igual que primario con texto negro.

**Botón solo-icono** (móvil header, cerrar): 44 × 44 de zona, aspecto de botón secundario. Variante "cerrar" sin borde: icono `X` 20 px, hover fondo #F5F5F5, radio 4.

**Switch** (toggles): zona de fila completa 56 px (clic en cualquier parte de la fila). Track 44 × 24, radio 999. 
| Estado | Aspecto |
|---|---|
| Apagado | track #FFF, borde 1.5 px #8A8A8A; thumb 18 px #8A8A8A a la izquierda (3 px) |
| Encendido | track #0A0A0A; thumb #FFF a la derecha con `Check` 12 px #0A0A0A dentro (icono de confirmación) |
| Hover | apagado: borde #0A0A0A, thumb #0A0A0A · encendido: track #262626 |
| Foco | outline 2 px sobre el track |
| Deshabilitado | track #F0F0F0, borde #E4E4E4, thumb #D4D4D4, etiqueta #A3A3A3; texto de ayuda explica por qué |
| Cargando | track #F5F5F5 con borde #E4E4E4, thumb sin color; `aria-busy` (usado mientras el modelo no cargó) |
Transición thumb 160 ms `--ease-out`. Semántica `role="switch"` + `aria-checked`.

**Fila de opción / vista / tarjeta** (vistas, opciones excluyentes): alto 52 (56 táctil), `padding: 0 16px`, radio 8, borde 1 px #D4D4D4, fondo #FFF, etiqueta 14/600, slot de Check de 18 px reservado a la derecha (sin layout shift). `role="radio"` dentro de `role="radiogroup"` (flechas mueven selección).
| Estado | Aspecto |
|---|---|
| Reposo | borde #D4D4D4 |
| Hover | borde #8A8A8A, fondo #F5F5F5 |
| Foco | outline 2 px offset 2 |
| Seleccionado | borde 2 px #0A0A0A (1 px borde + `box-shadow: inset 0 0 0 1px #0A0A0A`), fondo #F5F5F5, etiqueta 700, `Check` 18 px #0A0A0A visible |
| Deshabilitado | borde #E4E4E4, texto #A3A3A3, sin Check; ayuda de 13 px debajo |
| Cargando | bloque skeleton #F5F5F5 alto 52, sin shimmer, sin texto |

**Swatch de pintura**: celda 56 × 56, círculo de 40 px con el **color real del coche** (hex = `baseColor` del material; plano, sin degradado, sin brillo falso). Borde interior permanente `inset 0 0 0 1px rgba(0,0,0,.20)` para que el blanco se lea sobre blanco. Cuadrícula 5 columnas, gap 8 (5 × 56 + 4 × 8 = 312 = ancho útil de 360 − 2 × 24).
| Estado | Aspecto |
|---|---|
| Reposo | círculo + borde interior |
| Hover | borde interior → 1 px #0A0A0A |
| Foco | outline 2 px #0A0A0A, offset 3 (offset 6 si además está seleccionado) |
| Seleccionado | `box-shadow: 0 0 0 2px #FFF, 0 0 0 4px #0A0A0A` + badge `Check`: círculo 16 px #0A0A0A, icono blanco 10 px, esquina inferior derecha, borde 2 px #FFF |
| Deshabilitado | círculo al 40 % de opacidad, sin hover |
| Cargando | círculo gris #F5F5F5 |
`role="radio"`, nombre accesible = nombre del color. Debajo de la cuadrícula: "Color: {nombre}" 14/600 con `aria-live="polite"`. El nombre y hex vienen de la configuración de datos (no inventados).

**Slider (despiece)**: `<input type="range" min=0 max=100 step=1>` estilizado. Track 4 px (relleno #0A0A0A, resto #E4E4E4, radio 2). Thumb 24 px, fondo #FFF, borde 2 px #0A0A0A, zona táctil 44 (padding transparente). Lectura "{n} %" 14/600 tabular a la derecha de la etiqueta. Etiquetas de extremos 12/600 `--c-text-2`: "Ensamblado" y "Despiece".
| Estado | Aspecto |
|---|---|
| Reposo | arriba |
| Hover | thumb fondo #F5F5F5 |
| Foco | outline 2 px alrededor del thumb, offset 2 |
| Activo (arrastrando) | thumb con borde 3 px; la lectura pasa a 700 |
| Deshabilitado | relleno #D4D4D4, thumb borde #BDBDBD, lectura #A3A3A3 |
| Cargando | track #F0F0F0 sin thumb |
Teclado: flechas ±1, PageUp/PageDown ±10, Home/End 0/100. La escena sigue el valor con suavizado ≤ 120 ms (0 con reduced-motion).

**Segmentado** (lente Lista/Capas): alto 40 (44 táctil), borde 1 px #0A0A0A, radio 4, segmentos iguales. Activo: fondo #0A0A0A, texto #FFF, 700. Reposo: fondo #FFF, texto #0A0A0A. Hover (reposo): fondo #F5F5F5. Foco: outline offset 2. Deshabilitado: texto #A3A3A3.

### 6.1 Header
- Estructura (escritorio): `BrandMark` · divisor · nombre · versión · [espacio] · acciones.
- **BrandMark provisional** (mientras no haya logo): texto "JAC" en Manrope 800, 22/22, mayúsculas, tracking .18em, color #0A0A0A, `aria-label="JAC"`, es un `<a>`/`<span>` sin enlace por ahora. En móvil 18 px. No dibujar iconos ni formas imitando el logo real. Componente único `BrandMark` para sustituir por SVG.
- Nombre: "JAC 6" 16/700 mayúsculas. Versión: "PHEV" en pastilla borde 1 px #0A0A0A, radio 4, `padding: 2px 6px`, 12/700, margen izquierdo 8.
- Acciones (escritorio): botones secundarios 40 px con icono + etiqueta: "Restablecer" (RotateCcw), "Pantalla completa" (Maximize) → al activarse "Salir de pantalla completa" (Minimize). Móvil: solo icono 44 × 44 con `aria-label` y `title`.
- Estados: reposo/hover/foco/pulsado como secundario. Deshabilitado y cargando: "Restablecer" deshabilitado mientras el modelo carga o hay error; "Pantalla completa" sigue activo. Si la Fullscreen API no existe (iPhone Safari), ocultar el botón (no mostrarlo roto).
- "Restablecer": vuelve cámara a Tres cuartos frontal, pintura por defecto, accesorios apagados, despiece 0, puertas cerradas, todas las piezas visibles, selección y aislamiento limpios, rotación automática apagada, vista interior apagada. Sin diálogo de confirmación. Toast "Configuración restablecida".

### 6.2 Pestañas del panel
- `role="tablist"`, 3 pestañas iguales, alto 52, borde inferior 1 px #E4E4E4. Cada pestaña: icono 18 + etiqueta 14, centrados, gap 8.
| Estado | Aspecto |
|---|---|
| Reposo | texto/icono #5C5C5C, 600 |
| Hover | texto #0A0A0A, fondo #F5F5F5 |
| Foco | outline 2 px, `outline-offset: -4px` (para no recortar) |
| Activa | texto #0A0A0A, 700, filete inferior 2 px #0A0A0A (el filete de marca que se observa en jacvenezuela.com con los nombres de modelo) |
| Deshabilitada | #A3A3A3, durante carga/errores (`aria-disabled`) |
| Cargando | contenido = 5 bloques skeleton #F5F5F5 (alto 52, radio 8, gap 8); pestañas visibles |
- Teclado: ←/→ mueven foco y activan, Home/End. Cambio de contenido: fade de opacidad 160 ms, sin desplazamiento. El scroll se conserva por pestaña.
- Cada pestaña abre con un bloque de cabecera: título 18/700 + subtítulo 13/400 `--c-text-2`, padding-top 24, padding-bottom 24.
  - Explorar: "Explorar" / "Abre las puertas y el portón."
  - Personalizar: "Personalizar" / "Pintura, opciones y accesorios."
  - Piezas: "Piezas" / "Selecciona, oculta o aísla cada pieza."

### 6.3 Explorar

Rev. 4 (a petición del cliente): Explorar empieza con **PINTURA** (la misma sección de swatches de §6.4, movida aquí; divisor debajo), sigue con las aperturas y termina con Desarmar / Armar. Rev. 3: Explorar quedaba con **una sola sección deliberada: las aperturas, como botones con icono**. (Rev. 2 dibujaba una planta del coche en SVG; el cliente la rechazó: "utiliza solamente botones con iconos".) Las vistas viven únicamente en la barra de vistas (§6.6); la rotación es automática; "Vista interior" es el icono Interior de la barra. No hay switches, listas ni dibujos del coche completo.

1. **Rejilla de aperturas**: 2 columnas, gap 8, orden de la config (delantera izq. · delantera der. · trasera izq. · trasera der.); el portón, al ser impar, ocupa la fila completa. Un botón por apertura de `model.openingIds`, alto mínimo 64 (≥ 44 táctil), radio 8, borde 1 px #D4D4D4, `padding: 0 12px`. Contenido: icono 24 + nombre corto 14/600 ("Delantera izquierda", "Portón trasero"; derivado del nombre de la config sin "Puerta") + estado 12/400 `--c-text-2` ("Cerrada" / "Abierta").
   - **Icono de apertura** (`OpeningIcon`, §3.2): planta mínima del coche, frente arriba, con **solo esa apertura** en trazo grueso. Cerrada = pegada al flanco; abierta = girada 60° hacia fuera (el portón, desplazado detrás). El icono cambia con el estado.
   - Estados: reposo (borde #D4D4D4) · hover (borde #8A8A8A, fondo #F5F5F5) · pulsado (#EBEBEB) · foco (outline 2 px, offset 2) · **abierta = fondo #0A0A0A, texto/icono #FFF, nombre 700, "Abierta"** (inversión + icono abierto + palabra: no depende del color; sin Check porque el icono ya cambia, §5.1).
   - Semántica: `<button aria-pressed>`; `aria-label` y `title` de acción: "Abrir puerta delantera izquierda" / "Cerrar portón trasero". Se pulsa de nuevo para invertir (la escena anima 600 ms, interrumpible).
2. **Abrir todo / Cerrar todo**: dos botones secundarios 44 px en dos columnas (`DoorOpen` / `DoorClosed`), 16 px bajo la rejilla, usan `setOpenings`. Se conservan porque con 5 aperturas ahorran 4 toques; cada uno se deshabilita cuando no tiene efecto. No hay lectura de estado aparte ("3 de 5 abiertas"): cada botón ya dice su estado.
3. **Desarmar / Armar** (Rev. 4, a petición del cliente): botón secundario 44 px a todo el ancho, 16 px bajo las aperturas (`Expand` / `Shrink`). Lleva el despiece de 0 a 100 % y de vuelta. Es el único control de despiece de la app. Solo aparece si el modelo trae despiece. En el despiece, cada rueda (rin + caucho + pinza) sale como una sola pieza; el tablero sale entero por delante del parachoques.
- Si el modelo no trae aperturas: aviso en línea "Este modelo no trae puertas ni portón articulados."; nunca relleno. No mueve la cámara.

### 6.4 Personalizar
Orden: OPCIONES · ACCESORIOS. (Rev. 4: PINTURA se movió a Explorar, §6.3; la descripción del punto 1 sigue valiendo allí.) (Rev. 2: el despiece vive solo en Piezas → Capas y las puertas en Explorar; ya no están aquí.) Cada sección separada por 32 px y un divisor 1 px #E4E4E4.
1. **PINTURA**: cuadrícula de swatches (§6.0) + línea "Color: {nombre}". Cambio de pintura sin interrumpir la cámara. Si un color tiene variantes (mate/metalizado) se muestran como swatches distintos, no como degradado.
2. **OPCIONES**: grupos mutuamente excluyentes (p. ej. rines). Cada grupo: subetiqueta 14/700 + radiogroup de filas de opción (§6.0), una columna, gap 8. Si el catálogo no tiene opciones aún, la sección no se renderiza.
3. **ACCESORIOS**: seis filas con switch (alto 56, sin iconos, etiqueta 14/600, divisores 1 px): "Barras de techo", "Canastilla de techo", "Portabicicletas", "Organizador de maletero", "Tapete de maletero", "Enganche de remolque". Encender/apagar hace aparecer/desaparecer la malla; el estado de carga de un accesorio (si su malla es perezosa) = switch en `aria-busy`. Si hay dependencias (p. ej. la canastilla requiere barras), usar el estado deshabilitado con ayuda de 13 px "Requiere barras de techo." (pendiente de confirmar con cliente, §12).

### 6.5 Piezas
**Rev. 4 (a petición del cliente): se eliminan el segmentado Lista | Capas y la lente Capas (punto 4, con su slider de despiece).** Piezas muestra solo la lista agrupada; el despiece se controla con Desarmar / Armar en Explorar (§6.3). Lo que sigue sobre la lente y Capas queda como histórico.

Orden: "Mostrar todo" · lista · ficha fija inferior.

1. ~~**Lente** `Lista | Capas`~~ (eliminado en Rev. 4).
2. **Mostrar todo**: botón secundario pequeño (alto 40) alineado a la derecha de una línea de resumen 13/400 "{n} piezas ocultas" (o "Todas las piezas visibles"). Deshabilitado cuando nada está oculto ni aislado. Limpia ocultas y aislamiento. Si hay aislamiento activo, la línea dice "Aislando: {nombre}".
3. **Lista agrupada** (lente Lista): grupos **Exterior, Interior, Ruedas, Accesorios**.
   - Cabecera de grupo: alto 40, sticky `top: 0`, fondo #FFF, etiqueta 12/700 caps + contador `--c-text-2`, `ChevronDown` a la derecha para plegar (`aria-expanded`). Todos abiertos por defecto.
   - **Fila de pieza** (alto 52 / 56 táctil, radio 8, gap 4 entre filas): `[slot Check 20][nombre comercial 14/600][botón Eye 44]`.
| Estado | Aspecto |
|---|---|
| Reposo | sin borde, divisor inferior 1 px #E4E4E4 |
| Hover | fondo #F5F5F5; en el 3D la pieza muestra contorno hover (§9) |
| Foco | outline 2 px |
| Seleccionada | borde 2 px #0A0A0A, fondo #F5F5F5, nombre 700, `Check` en el slot; contorno de selección en el 3D |
| Oculta | nombre #767676, botón con `EyeOff` #767676, `aria-label` incluye "oculta" |
| Deshabilitada | (durante aislamiento, piezas no aisladas) nombre #A3A3A3, Eye deshabilitado, ayuda por `title`: "Quita el aislamiento para mostrarla" |
| Cargando | 8 filas skeleton |
   - Clic en la fila = seleccionar (no oculta). Clic en el botón ojo = alterna visibilidad (`aria-pressed`, etiqueta "Ocultar {nombre}" / "Mostrar {nombre}"). Seleccionar desde el 3D hace `scrollIntoView({block:'nearest'})` y abre esta pestaña.
   - Las piezas con nombre comercial vienen de un catálogo `{id, nombreComercial, grupo, descripcion}`; el nombre técnico de la malla nunca se muestra.
4. **Capas (lente Capas)**: el cliente quiere "mostrar el interior por capas: asientos, cauchos/neumáticos, volante, monitor/pantalla, tablero". Diseño:
   - Es la misma lista de piezas filtrada y ordenada, no un panel aparte: seis filas en orden de exterior hacia el fondo de la cabina: **1 Carrocería y puertas, 2 Tablero, 3 Pantalla, 4 Volante, 5 Asientos, 6 Neumáticos**. Las cinco piezas usan el mismo componente de fila que la lista; **Carrocería y puertas** es la capa más externa y es una fila de un solo control (toda la fila alterna ocultar/mostrar las 8 piezas de la envolvente, ojo como indicador, sin selección). Sustituye al botón ancho "Ocultar carrocería y puertas", que repetía el gesto de "Mostrar todo" fuera de la lista.
   - Cada fila lleva a la izquierda un índice de capa (círculo 24 px, borde 1 px #8A8A8A, número 12/700) unido por un riel vertical de 1 px #BDBDBD entre índices; el resto de la fila es idéntico a §6.5.3 (check, ojo, selección). Ocultar la capa 1 revela lo que hay debajo.
   - Texto guía arriba (13/400): "Oculta capas una a una para ver lo que hay debajo."
   - Si la vista interior no está activa y la envolvente sigue visible, aviso en línea (borde 1 px #D4D4D4, radio 8, padding 12, 13/400) "Para verlas desde dentro, elige la vista Interior en la barra de vistas." Solo texto: no hay enlace ni segundo control para entrar al interior.
   - **Despiece** (slider §6.0) cierra la lente. Es el único control gradual; Explorar tiene además el atajo Desarmar / Armar (§6.3).
   - "Neumáticos" figura en esta lente a petición del cliente aunque en la lente Lista vive en el grupo Ruedas; es la misma pieza (una sola fila de estado).
   - "Mostrar todo" (§6.5.2) también restablece las capas.
5. **Ficha de pieza seleccionada** (fija al fondo del panel/sheet, solo si hay selección): borde superior 1 px #E4E4E4, fondo #FFF, padding 20 24, alto máx. 50 % del panel, aparece con translateY 8 → 0 + fade 240 ms `--ease-out`.
   - Cabecera: nombre comercial 18/700 + botón cerrar (`X`, 44 px) que deselecciona.
   - Descripción 13–14/400 `--c-text-2`, 1–4 líneas (`line-clamp: 4`, scroll interno si excede en sheet).
   - Acciones en cuadrícula de 2 columnas, gap 8, alto 44: **Enfocar** (primario, `Crosshair`; la cámara se acerca a la pieza con `--dur-cam`), **Aislar** (secundario, `Focus`; activo = fondo #0A0A0A, texto blanco, `Check`, `aria-pressed="true"`; al activarlo el resto de piezas se ocultan; volver a pulsar quita el aislamiento).
   - Rev. 2: **Ocultar / Mostrar sale de la ficha** (el ojo de la fila ya hace exactamente eso). Estados de los botones: como §6.0; todo deshabilitado mientras `cargando`.
   - Si no hay selección, la ficha no existe: no mostrar placeholders vacíos.

### 6.6 Barra de vistas (escritorio y móvil)
Rev. 2: botones **solo icono** (§3.1). Es la única vía para cambiar de vista.
- Flotante sobre el visor, centrada, `bottom: 24px`, alto 48, fondo #FFF, borde 1 px #E4E4E4, radio 8, `--shadow-float`, padding 4, gap 2. Botones 44 × 40, radio 4, icono 24 px. 7 iconos ≈ 330 px: nunca hace scroll en escritorio (sin `overflow`, para que el tooltip no se recorte). En móvil: tira de círculos, ver §4.2.
- Nombre en español: `aria-label` + `title` + tooltip propio (píldora blanca, borde 1 px #E4E4E4, radio 4, 12/600, 12 px sobre el botón) al pasar el puntero (retraso 300 ms) o al enfocar con teclado. Sin tooltip en táctil.
| Estado | Aspecto |
|---|---|
| Reposo | icono #0A0A0A sobre #FFF |
| Hover | fondo #F5F5F5 + tooltip |
| Pulsado | fondo #EBEBEB |
| Foco | outline 2 px offset 2 + tooltip |
| Activa | fondo #0A0A0A, icono #FFF (inversión; sin Check, ver §5.1) |
| Deshabilitada | icono #A3A3A3 (mientras carga) |
- Activa = `activeView`. Es un `role="toolbar"` con `aria-label="Vistas de cámara"`; los botones son `aria-pressed`. Al mover la cámara a mano `activeView = null` y ningún botón queda activo.
- Interior solo aparece si la config trae la vista. **Se mantiene visible en Interior**: es la única forma de salir de la cabina (ya no existe el interruptor "Vista interior"). Se oculta solo si el visor no está listo.

### 6.7 Ayuda inicial (hint)
- Texto: escritorio "Arrastra para girar · Usa la rueda para acercarte"; táctil (`pointer: coarse`) "Arrastra para girar · Pellizca para acercarte".
- Píldora blanca, borde 1 px #E4E4E4, radio 999, `--shadow-float`, alto 40, `padding: 0 16px`, icono `Move3d` 16 + texto 13/600 #0A0A0A, `pointer-events: none`. Escritorio: centrada, `bottom: 84px` (24 + 48 + 12). Móvil: centrada, `bottom: S + 16px` (sobre el sheet visible), máx. ancho `calc(100% − 32px)`, texto puede ocupar 2 líneas.
- Aparece 400 ms después de que se oculta la pantalla de carga (fade 160 ms). Se descarta (fade 160 ms, luego `display: none`) al primer `pointerdown`/`wheel`/`touchstart`/flechas sobre el canvas o al cambiar de vista. Si no hay interacción, se descarta sola a los 12 s. Guardar en `sessionStorage` para no repetirla en la misma sesión. `role="status"`, `aria-live="polite"`.

### 6.8 Puntos informativos (hotspots)
- Marcador: círculo 28 px blanco, borde 1.5 px #0A0A0A, icono `Plus` 14 px #0A0A0A, `--shadow-float`; zona táctil 44 (padding transparente). `drei <Html>` con `occlude`: cuando el punto queda tras la carrocería, opacidad 0.35 y `pointer-events: none`. Siempre se mantiene a 28 px en pantalla (no escala con la distancia).
| Estado | Aspecto |
|---|---|
| Reposo | blanco, borde #0A0A0A |
| Hover | fondo #F5F5F5 |
| Foco | outline 2 px offset 2 (son `<button>` reales, alcanzables por Tab) |
| Abierto | fondo #0A0A0A, icono blanco rotado 45° (`X` visual), popover visible |
| Deshabilitado/oculto | no se renderizan cuando el toggle "Puntos informativos" está apagado o en vista interior |
| Cargando | no existen hasta que termina la carga |
- Popover: blanco, borde 1 px #E4E4E4, radio 8, `--shadow-float`, ancho 240 (máx `100vw − 32`), padding 16, título 14/700, texto 13/400 `--c-text-2`, `X` de cierre 44. Un solo popover abierto. Esc, clic fuera o abrir otro lo cierran. Aparece con fade + translateY 4 → 0, 160 ms. Los textos vienen de datos del cliente.

### 6.9 Toast
- Fondo #0A0A0A, texto #FFF 14/600, icono `Check` blanco 16, radio 8, `padding: 12px 16px`, `--shadow-float`. Posición: centrado, `bottom: 84px` en escritorio; en móvil encima del sheet visible (`S + 16px`) y por encima de la tira del hint (el hint se oculta mientras hay toast). Dura 2400 ms, entra 240 ms (fade + translateY 8 → 0), sale 160 ms. `role="status"`, un toast a la vez (el nuevo reemplaza). Usos permitidos: "Configuración restablecida", "Ruta copiada". Nada más; las acciones del usuario con feedback visible en la escena no necesitan toast. No hay "Deshacer" (fuera de alcance).

### 6.10 Auditoría de duplicados (rev. 2)
Regla: cada acción vive en un único lugar.
| Acción | Antes | Ahora |
|---|---|---|
| Cambiar de vista | barra + lista en Explorar | solo barra de iconos |
| Vista interior | switch + fila "Interior" + enlace "Ir a Explorar" | solo el icono Interior; el aviso de Capas es texto |
| Rotación automática | switch | sin control (comportamiento) |
| Despiece | Personalizar + Piezas→Capas | solo Piezas→Capas |
| Puertas y portón | Personalizar (switches) | solo Explorar (botones con icono) |
| Ocultar carrocería y puertas | botón ancho en Capas | capa 1 de la lista (una fila) |
| Ocultar pieza | ojo de fila + "Ocultar" en la ficha | solo el ojo de fila |
Se conservan a propósito: "Mostrar todo" (acción global: limpia ocultas y aislamiento en ambas lentes), "Aislar" en la ficha (acción de la pieza seleccionada, no tiene botón en la fila) y la X de la ficha (deseleccionar explícito; el clic en la fila seleccionada también deselecciona, pero no es descubrible).

## 7. Estados globales del visor

Todos viven en el contenedor del visor (fondo `--c-bg-stage`, `z-index: --z-state`), con el header siempre visible. El panel muestra pestañas deshabilitadas + contenido skeleton (carga) o el texto vacío descrito abajo (error/ausente/sin WebGL). Barra de vistas e hint no se muestran.

### 7.1 Carga con progreso real
- Contenido centrado en columna (ancho 280, gap 16): wordmark "JAC" 20/800 tracking .18em · título "Cargando JAC 6 PHEV" 16/700 · barra · lectura.
- **Determinada** (cuando `ProgressEvent.lengthComputable`): barra 280 × 4, radio 2, pista #D4D4D4, relleno #0A0A0A, ancho = `loaded / total`; lectura "{n} %" 13/600 tabular centrada y debajo "{x,x} MB de {y,y} MB" 12/400 `--c-text-2`. `role="progressbar"` con `aria-valuenow`, `aria-valuemin=0`, `aria-valuemax=100`, `aria-label="Cargando el modelo"`.
  - Nota técnica: `useProgress` de drei cuenta ítems, no bytes; con un solo `.glb` salta de 0 a 100. Para progreso real, cargar con `GLTFLoader.load(url, onLoad, onProgress)` usando el `ProgressEvent` (bytes) y pasarlo al store. El servidor debe enviar `Content-Length` sin comprimir en cadena (si el stream viene con `Content-Encoding`, `lengthComputable` puede ser falso → usar la variante indeterminada).
- **Indeterminada** (sin tamaño conocido, o fase "Preparando escena…" tras el 100 %): misma barra con segmento de 40 % que se desplaza 1400 ms `--ease-in-out` infinito; lectura "Cargando…" 13/600. Sin `aria-valuenow`, con `aria-busy="true"`.
- **Salida**: al terminar (primer frame renderizado), overlay hace fade-out 240 ms; luego dolly de intro hasta Tres cuartos frontal (`--dur-intro` 1400 ms, `--ease-out`, parte 18 % más lejos), cancelable con cualquier interacción.
- **Reduced motion**: sin barra animada ni dolly; indeterminada = barra estática al 40 % + texto "Cargando…".

### 7.2 Error de carga
- Tarjeta centrada, ancho máx. 420, fondo #FFF, borde 1 px #0A0A0A, radio 12, padding 32. `role="alert"`.
- `TriangleAlert` 28 px · título 18/700 "No se pudo cargar el modelo" · cuerpo 14/400 `--c-text-2` "Ocurrió un problema al descargar o leer el archivo 3D. Revisa tu conexión e inténtalo de nuevo." · botón primario "Reintentar" (`RotateCw`, ancho completo en móvil) · `<details>` "Detalles técnicos" (12/600 resumen; contenido en `--font-mono` 12 px `--c-text-2`: mensaje de error y URL).
- "Reintentar" en estado cargando mientras reintenta (`LoaderCircle`), sin cerrar la tarjeta hasta que arranca la barra.
- Panel: texto centrado 14/400 `--c-text-2` "Los controles estarán disponibles cuando el modelo cargue."

### 7.3 Modelo ausente
- Misma tarjeta (§7.2) con `PackageX`, título "Falta el archivo del modelo", cuerpo "No encontramos el modelo 3D en la ruta esperada. Colócalo aquí y vuelve a intentarlo:".
- Ruta en bloque de código: fondo #F5F5F5, borde 1 px #D4D4D4, radio 8, `padding: 12px 16px`, `--font-mono` 13 px #0A0A0A, `overflow-wrap: anywhere`, con botón secundario pequeño "Copiar ruta" (`Copy`; toast "Ruta copiada"). Ruta propuesta: `public/models/jac-6-phev.glb` (se sirve como `/models/jac-6-phev.glb`); D.A.N.I confirma la ruta final y la lee de una única constante.
- Botón primario "Reintentar". Detección: `HEAD` 404 / `Content-Type` no `model/gltf-binary`.

### 7.4 Sin WebGL
- Misma tarjeta, `MonitorOff`, título "Tu navegador no puede mostrar el modelo 3D", cuerpo "Este visor necesita WebGL. Activa la aceleración por hardware en tu navegador o prueba con una versión actualizada de Chrome, Edge, Firefox o Safari.", botón primario "Volver a comprobar" (`RotateCw`). Sin barra, sin panel funcional. Detección antes de montar el `<Canvas>` (probar `canvas.getContext('webgl2') || getContext('webgl')`) y también ante `webglcontextlost` no restaurado (misma pantalla con título "Se perdió la vista 3D" y "Reintentar").

## 8. Interacciones 3D (cámara)
- Pose por vista (azimut medido desde el frente del coche, positivo hacia su lado izquierdo; elevación sobre el suelo; distancia = múltiplo de la distancia de encuadre `d0` = radio de la esfera envolvente / sin(fov/2) × 1.15):

| Vista | Azimut | Elevación | Distancia | FOV |
|---|---|---|---|---|
| Tres cuartos frontal | +35° | 12° | 1.00 d0 | 30° |
| Frente | 0° | 6° | 1.00 d0 | 30° |
| Trasera | 180° | 6° | 1.00 d0 | 30° |
| Lateral izquierdo | +90° | 4° | 1.05 d0 | 30° |
| Lateral derecho | −90° | 4° | 1.05 d0 | 30° |
| Superior | 0° | 85° (nunca 90°, evita gimbal) | 1.25 d0 | 30° |
| Interior | posición de la cabeza del conductor, mira al frente | — | — | 70° |
- Límites de órbita (exterior): elevación 2°–88°, distancia 0.6–2.2 d0, `enablePan={false}`, `enableDamping dampingFactor={0.08}`, cursor `grab` / `grabbing`, `pointer` sobre pieza seleccionable. Interior: giro libre en el sitio, sin zoom, elevación ±60°.
- Transición: duración = base 900 ms escalada por el desplazamiento angular (mín 600, máx 1200 ms; a/desde Interior siempre 1200 ms), `--ease-in-out` (easeInOutCubic), interpolando posición y objetivo; el FOV se interpola en el mismo tiempo. Interrumpible: cualquier `pointerdown`/`wheel` cancela y conserva la pose actual (y `activeView = null`).
- Enfocar pieza: objetivo = centro de la pieza; distancia = 0.8 × tamaño de su caja / sin(fov/2); misma duración y easing.

## 9. Estudio 3D (guía visual de la escena)

Todos los números son orientativos; el criterio de aceptación está al final.

- **Fondo y suelo**: `scene.background = #EDEDED`, igual que `--c-bg-stage` y que `--scene-bg`. Suelo = `ShadowMaterial` (solo recibe sombra) sobre ese color, sin textura, sin cuadrícula, sin horizonte visible, sin niebla. El coche "flota" en un estudio continuo.
- **Color management**: `outputColorSpace = SRGBColorSpace`, `toneMapping = NeutralToneMapping` (Khronos PBR Neutral, `three` ≥ r162) para que el color de pintura se vea fiel sin viraje; `toneMappingExposure = 1.0` (bajar a 0.9 si la carrocería blanca quema). Alternativa si el build no lo expone: `ACESFilmicToneMapping` a 0.9. **Sin bloom, sin SSAO, sin DOF, sin viñeta.** `dpr={[1, 2]}`, `antialias`.
- **Iluminación por entorno de estudio** (sin HDRI externo, sin CDN): `<Environment resolution={256}>` con `<Lightformer>` blancos puros (nada tintado, los reflejos del coche deben quedar neutros). `environmentIntensity` ≈ 1.0.
  - Softbox superior: forma `rect`, 6 × 3 u, y = 4, apunta hacia abajo, intensidad 1.6.
  - Tiras laterales (reflejos largos que dibujan los flancos): 2 × `rect` 1.5 × 4 u en x = ±4, y = 1.5, intensidad 1.5 (izquierda) / 1.2 (derecha) → asimetría leve para dar volumen.
  - Relleno trasero: `rect` 4 × 2 u en z = −5, intensidad 0.8.
  - Relleno bajo frontal: `rect` 6 × 1 u, y = 0.5, intensidad 0.5 (evita bajos negros).
  - Una `directionalLight` suave solo para sombras (intensidad 0.4, sombra de resolución 2048, `radius` 4, arriba-izquierda).
- **Sombras**: `<ContactShadows>` dos capas. Capa 1 (contacto): opacidad 0.40, `blur 2.4`, `far 1.4`, `scale` = 1.6 × largo del coche. Capa 2 (ambiente): opacidad 0.15, `blur 6`, `far 3`, `scale` 2.4 × largo. Color negro `#000`. Resolución 1024. Sombra relativa: la zona más oscura bajo el coche ≈ 78 % del brillo del suelo (≈ #B8B8B8 sobre #EDEDED), un borde difuminado de 1/3 del ancho de neumático.
- **Reflejos**: carrocería con `envMapIntensity` del propio material (no modificar materiales del modelo salvo que queme: primero bajar softbox superior a 1.2, luego exposición a 0.9).
- **Criterio de aceptación**: probar con el swatch blanco y con el negro. En blanco ningún píxel de carrocería plana llega a #FFFFFF sólido (se debe ver el degradado de reflejo/volumen); en negro se leen los reflejos de las tiras laterales y la línea de cintura; y el contorno de selección (§10) se lee en ambos.
- **Interior**: en vista interior subir `environmentIntensity` a 1.3 y añadir un `Lightformer` rect 2 × 1 u sobre la cabina, intensidad 1.0, para que el tablero no quede en negro.

## 10. Contorno de selección en el 3D (monocromo)

Doble trazo para que se lea sobre carrocería blanca **y** negra: línea interior casi negra + halo exterior blanco.
| Estado | Línea | Halo |
|---|---|---|
| Selección | 2 px `#0A0A0A` (opacidad 1) | 2 px `#FFFFFF` por fuera |
| Hover (escritorio) | 1 px `#0A0A0A` a 70 % | 1 px `#FFFFFF` a 70 % |
- Los px son CSS: multiplicar por `devicePixelRatio`. Implementación sugerida con dos pasadas de contorno (`@react-three/postprocessing` `Outline` dos veces: halo ancho blanco debajo, línea estrecha negra encima; `blur` mínimo, `edgeStrength` alto), o con `Outlines` de drei (casco invertido) con grosor en espacio-mundo recalculado por distancia. `hiddenEdgeColor` transparente: no dibujar bordes tras otras piezas.
- Sobre carrocería blanca la línea negra aporta el contraste (≥ 15:1 vs blanco); sobre negra el halo blanco aporta el contraste (≈ 19:1 vs #0A0A0A).
- Sin pulso, sin parpadeo, sin relleno translúcido. Una pieza a la vez. Al aislar, las demás piezas no se atenúan: se ocultan.
- El tooltip de hover en escritorio (nombre de pieza) es una etiqueta blanca, borde 1 px #E4E4E4, radio 4, 12/600, `padding: 4px 8px`, que sigue al cursor +12 px; no aparece en táctil.

## 11. Accesibilidad y motion

### 11.1 Accesibilidad
- Contraste AA: tabla §2.1. Texto sobre el visor solo dentro de contenedores blancos. Controles sin texto propio (switch apagado, thumb) ≥ 3:1.
- Foco visible en todo: outline 2 px #0A0A0A, offset 2 (offsets especiales en pestañas y swatch). Orden de tabulación: header → pestañas → contenido del panel → ficha → barra de vistas → hotspots. El canvas es `tabIndex=-1` con `aria-label="Visor 3D del JAC 6 PHEV. Usa los controles del panel para cambiar de vista."`; la barra de vistas y el panel ofrecen todas las acciones por teclado (el 3D nunca es la única vía).
- Teclado en el visor cuando tiene foco real (opcional): flechas giran 5°, +/− zoom, Esc deselecciona.
- Objetivos táctiles ≥ 44 × 44 (visual puede ser menor con zona ampliada). Separación mínima entre objetivos 8 px.
- Roles: pestañas `tablist/tab/tabpanel`; vistas y opciones `radiogroup/radio`; toggles `switch`; barra `toolbar`; estados `alert`/`status`/`progressbar`. Selecciones anunciadas con `aria-checked`/`aria-pressed`. Cambio de color con `aria-live`.
- Todo texto en español, `<html lang="es">`.
- `forced-colors`: los estados no dependen del color (borde + Check + peso); en `forced-colors: active` usar `Highlight` para outline y borde seleccionado.
- Zoom de texto 200 %: el panel hace scroll; ningún texto truncado sin `title`.

### 11.2 `prefers-reduced-motion: reduce`
Se desactiva / reemplaza (tokens ya a `0.01ms`; la escena debe leer `--motion-scale`):
- Transiciones de cámara y dolly de intro: salto instantáneo a la pose final (sin tween). El reencuadre del sheet, también.
- Rotación automática: no arranca por sí sola (queda apagada); si el usuario la enciende, va a la mitad de velocidad.
- Inercia de órbita: `dampingFactor` 0.2 (casi sin inercia).
- Despiece: la escena sigue el valor del slider sin suavizado. Puertas/portón: cambian de estado sin animar.
- Sheet: snap instantáneo. Fades de hint/toast/popover/ficha/pestañas: aparecen y desaparecen sin transición. Barra de carga indeterminada: estática. Spinner de botón: icono estático con `aria-busy`.
- Se mantiene: cambios de color/borde de estados de hover y foco (sin duración), progreso determinado (es información, no decoración).

### 11.3 Duraciones y easings
| Elemento | Duración | Easing |
|---|---|---|
| Hover / pulsado | 100 ms | `--ease-std` |
| Switch, Check, fades de pestaña/hint/chevron | 160 ms | `--ease-out` |
| Ficha, toast (entrada), popover | 240 ms (popover 160) | `--ease-out` |
| Snap del sheet + reencuadre | 320 ms | `--ease-out` |
| Puertas / portón | 600 ms | `--ease-in-out` |
| Cámara entre vistas | 900 ms (600–1200) | `--ease-in-out` |
| Dolly de intro | 1400 ms | `--ease-out` |
| Barra indeterminada | 1400 ms en bucle | `--ease-in-out` |
Reglas: solo animar `transform` y `opacity` en HTML; ningún layout shift; todo interrumpible; máximo dos animaciones HTML simultáneas.

## 12. Copy y supuestos

Microcopy fijo (español): Restablecer · Pantalla completa · Salir de pantalla completa · Explorar · Personalizar · Piezas · Puertas y portón · Abrir todo · Cerrar todo · Puntos informativos · Pintura · Opciones · Accesorios · Despiece · Ensamblado · Puertas y portón · Mostrar todo · Enfocar · Ocultar · Mostrar · Aislar · Lista · Capas · Reintentar · Copiar ruta · Detalles técnicos · Volver a comprobar.

Supuestos que D.A.N.I debe respetar y preguntas al cliente (no bloquean el diseño):
1. Hoy solo existe `JAC_6_PHEV.blend` (≈ 109 MB). El visor web necesita un `.glb` optimizado (Draco/meshopt, texturas KTX2/WebP; meta de referencia ≤ 25–30 MB). Hasta que exista, la app mostrará el estado "Modelo ausente" (§7.3), que es un caso real.
2. Nombres comerciales de piezas, descripciones, grupos y los textos de los puntos informativos: los entrega el cliente; mientras tanto D.A.N.I usa un catálogo de datos con nombres provisionales marcados como tal, sin inventar especificaciones técnicas.
3. Nombres y hex de colores de pintura: del cliente (el hex debe coincidir con el material).
4. ¿Hay reglas de dependencia entre accesorios (canastilla ↔ barras de techo; enganche ↔ portabicicletas)?
5. "Cauchos" se interpreta como neumáticos; se incluye en la lente Capas por petición del cliente (§6.5.4). Confirmar el orden de capas.
6. ¿Existe interior modelado? Si no, "Interior" desaparece de vistas y la capa de interior queda en Explorar como deshabilitada.
7. Sin logo JAC: usar `BrandMark` tipográfico (§6.1). Para uso comercial real, entregar SVG oficial.
8. Las vistas muestran etiquetas cortas en la barra de escritorio ("3/4 frontal", "Izquierdo", "Derecho") por ancho; los nombres completos del cliente se usan en la lista y en `aria-label`.

## 13. Checklist de aceptación visual
- A 1440 × 900 y 1024 × 768: header 64, panel 360/380, visor sin scroll, barra de vistas centrada sin recortes.
- A 390 × 844 y 400 × 800: sin scroll horizontal; tira de vistas desplazable; sheet en 3 estados; coche entero visible y centrado en el área libre en cada estado.
- Todos los objetivos táctiles ≥ 44 px en móvil.
- Ningún color fuera de la paleta monocroma en la UI (el único color son los swatches y el coche).
- Foco visible recorriendo toda la UI con Tab; sin trampas.
- Con `prefers-reduced-motion`: la cámara salta, el sheet salta, la rotación no arranca sola.
- Pintura blanca y negra: ambas legibles en el estudio y con contorno de selección visible (§9, §10).
- Los cuatro estados (carga determinada/indeterminada, error, modelo ausente, sin WebGL) existen y se pueden forzar con un parámetro de depuración.
