# Modelo VW Tiguan 2025: datos para el Car Viewer

Archivo web: `web/public/models/vw-tiguan-2025.glb` (≈3,3 MB, Draco + WebP, igual que el JAC 6). Unos 390 mil triángulos.

> **Licencia:** "Volkswagen Tiguan (2025)" de **geyges**, licencia **Sketchfab Free Standard** (https://sketchfab.com/licenses).
> Origen: https://sketchfab.com/3d-models/18333bf2a9564772917ae8a349b81e62
> El ZIP descargado (`volkswagen-tiguan-2025.zip`, formato original) no trae el archivo de licencia; el autor y la licencia salen de la ficha de Sketchfab.
> La licencia permite el uso comercial dentro de un proyecto y no obliga a citar al autor, pero no permite redistribuir el modelo por separado. **Pendiente:** confirmar que servir el GLB en una web pública es compatible con esa licencia.

Origen: `blender/nuevo/tiguan/tiguan_my25.glb` (extraído del ZIP, sin tocar) → `blender/tiguan_adaptar.py` → `Tiguan_capas.blend` → `blender/exportar_glb.py` (el mismo del JAC 6) → GLB.
Para regenerarlo:
```
blender -b --factory-startup --python blender/tiguan_adaptar.py -- blender/nuevo/tiguan/tiguan_my25.glb Tiguan_capas.blend
blender -b --factory-startup Tiguan_capas.blend --python blender/exportar_glb.py -- web/public/models/vw-tiguan-2025.glb
```

## Qué hace `tiguan_adaptar.py`
- **Ya viene en metros:** mide 4,69 × 2,16 (con espejos) × 1,68 m, así que no se escala.
- **Piezas por nombre:** el modelo trae las piezas separadas y nombradas (`EXT_DOOR_FL`, `INT_DOOR_FL`, `EXT_TRUNK_LID`, `ALUMINUM_19_FL`, `BRAKE_FL`, `INT_STEERING_WHEEL`…). Se unen en los nodos del JAC 6, y cada puerta junta su chapa exterior con su panel interior.
- **Giro de 180°:** el original mira hacia −Z de glTF. Después del giro, la izquierda del coche (FL/RL) queda en +X: `FL` → `DI`, `FR` → `DD`, `RL` → `TI`, `RR` → `TD`.
- **Animaciones quitadas:** el original trae 11 (puertas, portón, techo solar, airbags, posavasos…). El visor abre las puertas con sus propios pivotes.
- **Airbags quitados:** vienen "plegados" para su animación de despliegue y asomaban como manchas blancas por el tablero y el techo. En el coche real no se ven.
- **Separación por islas:** los tres asientos y el tablero vienen agrupados con otras cosas y se separan por islas completas:
  - Asientos: la fila delantera termina en y = 0,22.
  - Tablero: el salpicadero (por delante de y = −0,25) y la consola central. Los guarnecidos de pilares y umbrales quedan en la carrocería.
- **Ligera inclinación de las bisagras descartada:** el original las tiene inclinadas unos 2,5°; aquí las puertas giran sobre un eje vertical.

## Ejes (glTF): los mismos que el JAC 6
- +Y arriba, suelo en y = 0. Frente hacia +Z (z ≈ +2,35). Conductor (volante a la izquierda) en +X. 1 unidad = 1 m.

## Nodos
| Nodo | Qué es | Notas |
|---|---|---|
| `Carroceria` | Casco, ópticas, cristales fijos, interior (techo, pilares, alfombras, bandeja), amortiguadores del portón y limitadores de puerta | |
| `Puerta_DI/DD/TI/TD` | Chapa, cristal, panel interior y (las delanteras) espejo | **Origen = bisagra original.** |
| `Porton` | Portón con luneta, pilotos y panel interior | **Origen en la bisagra superior.** |
| `Techo_cristal` | Techo solar delantero y panel trasero fijo | |
| `Rueda_*` / `Caucho_*` | Rin / neumático | El caucho es hijo de su rueda. |
| `Pinza_*` | Disco y pinza de freno | |
| `Asiento_conductor`, `Asiento_copiloto`, `Asientos_traseros` | Asientos (la banca trasera incluye su apoyabrazos con posavasos) | |
| `Volante` | Volante | Origen en el centro (0,36 · 1,00 · 0,60). |
| `Pantalla` | Cuadro digital y pantalla multimedia | |
| `Tablero` | Salpicadero y consola | |

Pintura: el material `Gris Ascot [laou1klg]`, con barniz. Es el único material que lleva la pintura: carrocería, puertas y portón.

## Pendientes
- Nombres comerciales y descripciones definitivas.
- Logotipo Volkswagen en SVG.
- Versión comercial.
- Carta de colores verificada.
- Confirmar la licencia para una web pública.
