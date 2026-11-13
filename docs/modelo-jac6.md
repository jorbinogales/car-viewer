# Modelo JAC 6 PHEV: datos para el showroom

Archivo web: `web/public/models/jac-6-phev.glb` (14 MB). Usa **KHR_draco_mesh_compression** y **EXT_texture_webp**, así que hace falta DRACOLoader con el decodificador alojado localmente. Tiene unos 2,6 M de triángulos, 44 materiales y 17 texturas.

Origen: `JAC_6_PHEV.blend` → `blender/separar_capas.py` → `JAC_6_PHEV_capas.blend` → `blender/exportar_glb.py` → GLB.
Para regenerarlo:
```
blender -b --factory-startup JAC_6_PHEV.blend --python blender/separar_capas.py -- JAC_6_PHEV_capas.blend
blender -b --factory-startup JAC_6_PHEV_capas.blend --python blender/exportar_glb.py -- web/public/models/jac-6-phev.glb
```

> **Licencia:** el modelo se extrajo del configurador web público de JAC y no se compró ni tiene licencia. Úsalo solo internamente hasta tener permiso de JAC o un modelo con licencia.

## Ejes (glTF, tal como lo carga three.js)
- **+Y arriba**, suelo en y = 0 (los neumáticos tocan y ≈ 0).
- **Frente del coche hacia +Z** (z ≈ +2,35) y trasera hacia −Z (z ≈ −2,33).
- **Conductor (volante a la izquierda) en +X.** Sufijos: `I` = izquierda = +X y `D` = derecha = −X; `D`/`T` en la primera letra = delantera/trasera (`Puerta_DI` = delantera izquierda, la del conductor).
- Tamaño aproximado: largo 4,68 m, ancho 1,77 m (2,20 m con espejos), alto 1,77 m.
- Escala 1 unidad = 1 m. No hace falta reorientar.

## Nodos (todos con nombre estable; no usar índices)
| Nodo | Qué es | Notas |
|---|---|---|
| `Carroceria` | Casco: exterior pintado, ópticas, cristales fijos, suelo/alfombra, techo interior, pilares, maletero | 16 primitivas. Es el mayor mesh, con unos 0,9 M de caras. |
| `Puerta_DI`, `Puerta_DD`, `Puerta_TI`, `Puerta_TD` | Puertas con su panel interior | **El origen del nodo es la bisagra** (borde delantero). |
| `Porton` | Portón trasero con pilotos | **Origen en la bisagra superior.** |
| `Techo_cristal` | Techo panorámico | |
| `Techo_cortinilla` | Cortinilla del techo | |
| `Rueda_DI/DD/TI/TD` | Rin y buje | Origen en el centro de la rueda. |
| `Caucho_DI/DD/TI/TD` | **Neumáticos** ("cauchos") | **Hijos** de su `Rueda_*`, con transform identidad. |
| `Pinza_DI/DD/TI/TD` | Pinzas de freno | |
| `Asiento_conductor` | Asiento delantero +X, con cinturón | |
| `Asiento_copiloto` | Asiento delantero −X, con cinturón | |
| `Asientos_traseros` | Banca trasera, respaldos y cabeceras | |
| `Volante` | Volante: aro, radios, airbag, botones y emblema | Origen en el centro del aro. Eje de giro (normal del aro, hacia el conductor) ≈ (0, 0,545, −0,838). |
| `Pantalla` | Pantalla doble (cuadro de instrumentos y multimedia) sobre el tablero | |
| `Tablero` | Tablero, consola central, columna, palancas y pedales | |
| `Acc_barras` | Accesorio: barras de techo | Oculto por defecto. |
| `Acc_canastilla` | Accesorio: canastilla de techo | Oculto. **Requiere `Acc_barras`** (dato del configurador original). |
| `Acc_portabicis` (+ hijo `Acc_portabicis_mastil`) | Accesorio: portabicicletas trasero | Oculto. Dependencia con el enganche **pendiente de confirmar**. |
| `Acc_organizador` | Accesorio: organizador de maletero | Oculto. |
| `Acc_tapete` | Accesorio: tapete de maletero | Oculto. |
| `Acc_tiron` | Accesorio: enganche de remolque | Oculto. |

**Capas interiores pedidas por el cliente:** asientos (los tres nodos `Asiento*`), cauchos (los cuatro `Caucho_*`), volante, pantalla (monitor) y tablero.
Para ver esas capas desde fuera hay que ocultar `Carroceria`, las puertas, `Porton` y el techo.

## Materiales
- **Pintura:** solo el material `Pintura`, presente en `Carroceria`, las cuatro puertas y `Porton`. Hay que clonarlo antes de tintar.
- Neumáticos: `Neumatico` y `Neumatico_flanco`. Rines: `Llanta`. Vidrios: `Cristal`, `Parabrisas`, `Cristal_techo`, `Cristal_faro`. Ópticas: `Faro_luz`, `Piloto`, `Piloto_luz`. Metales: `Cromo`, `Metal_satinado`, `Metal_mate`. Interior: `Cuero_asientos`, `Cuero_negro`, `Plastico_negro`, `Plastico_brillo`, `Tela_negra`, `Techo_interior`. Pantallas: `Pantalla`, `Pantalla_info`.
- Usan las extensiones KHR_materials_clearcoat, sheen y anisotropy.

### Pinturas del configurador original (datos reales, sin precios)
| id | nombre | hex | metalness | roughness | metalizado |
|---|---|---|---|---|---|
| `ocean-blue` | Ocean Blue | `#8fb4c9` | 0.6 | 0.32 | sí |
| `iron-gray` | Iron Gray | `#59606a` | 0.7 | 0.34 | sí |
| `artic-white` | Artic White | `#e9e9e6` | 0.1 | 0.30 | no |
| `onyx-black` | Onyx Black | `#16181b` | 0.45 | 0.26 | sí |
Además hay una opción por defecto, "Original del modelo", que restaura el material tal como viene en el GLB.

### Variantes de rines
Solo hay una. **No se ofrece** selector de rines.

## Apertura (pivotes listos en el origen del nodo)
Rotación local alrededor del origen del nodo. Los límites son estimados y hay que verificarlos visualmente:
| Nodo | Eje | Signo para abrir | Límite |
|---|---|---|---|
| `Puerta_DD`, `Puerta_TD` (−X) | Y | **+** | 65° |
| `Puerta_DI`, `Puerta_TI` (+X) | Y | **−** | 65° |
| `Porton` | X | **+** (sube y va hacia atrás) | 80° |
El capó no está separado: no se ofrece.

## Cámara interior (estimada, verificar)
- Puesto del conductor: ojo ≈ (0.39, 1.22, −0.05), mirando a ≈ (0.20, 1.10, 0.80).
- Plazas traseras: ojo ≈ (0.0, 1.20, −1.10), mirando a ≈ (0.0, 1.05, 0.6).

## Pendientes del cliente
Nombres comerciales y descripciones definitivas, logotipo JAC en SVG, versión comercial, si la canastilla tiene variante negra (el configurador original listaba "canastilla black", pero el GLB solo trae una malla), dependencia del portabicicletas y textos de puntos informativos.
