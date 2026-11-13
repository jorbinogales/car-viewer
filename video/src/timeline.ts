// Todos los tiempos del vídeo en un solo sitio. Unidades: fotogramas a 30 fps (30 f = 1 s).
// Cambia aquí cuándo entra/sale cada escena; los componentes solo leen estos valores.
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const TOTAL = 600; // 20 s

/**
 * from / to : rango "nominal" de la escena (los cortes de la especificación).
 * inAt      : fotograma en que empiezan a subir sus ventanas (se solapa con la salida de la anterior).
 * outAt     : fotograma en que empiezan a salir hacia arriba (se solapa con la entrada de la siguiente).
 * titleAt   : fotograma en que empieza a aparecer su texto.
 * seqStart  : fotograma global en que se reproduce el fotograma 0 de la captura real.
 */
export const SCENES = {
  intro: { from: 0, to: 60, outAt: 50 },
  explore: { from: 60, to: 210, inAt: 54, outAt: 196, titleAt: 74, seqStart: 60 },
  color: { from: 210, to: 360, inAt: 198, outAt: 346, titleAt: 216, seqStart: 210 },
  parts: { from: 360, to: 510, inAt: 348, outAt: 496, titleAt: 372, seqStart: 360 },
  outro: { from: 510, to: 600, inAt: 498, titleAt: 508 },
} as const;

// Transiciones verticales del fondo continuo (el fondo "avanza" con cada cambio de escena).
export const BG_SHIFTS: [number, number][] = [
  [54, 94],
  [198, 238],
  [348, 388],
  [498, 538],
];

// Pinturas de la secuencia b (fotograma de la captura -> fotograma global).
export const PAINTS = [
  { seqFrame: 16, name: "Ocean Blue", color: "#8DB4CF" },
  { seqFrame: 60, name: "Onyx Black", color: "#15181C" },
  { seqFrame: 104, name: "Iron Gray", color: "#5D6573" },
].map((p) => ({ ...p, at: SCENES.color.seqStart + p.seqFrame }));

// Clics que el manifest no marca (la secuencia c pulsa "Desarmar" en f12 sin flag de clic).
export const EXTRA_CLICKS: Record<string, number[]> = { a: [], b: [], c: [12] };
