import { Vector3 } from 'three';

const DEG = Math.PI / 180;

/**
 * Distancia de encuadre d0 para una esfera de radio r con FOV vertical `fovDeg`.
 * `freeFraction` = alto libre / alto del visor (el sheet móvil tapa el resto):
 * el FOV vertical útil se reduce en esa proporción.
 */
export function frameDistance(radius: number, fovDeg: number, aspect: number, freeFraction = 1, margin = 1.15): number {
  const halfV = Math.atan(Math.tan((fovDeg * DEG) / 2) * freeFraction);
  const halfH = Math.atan(Math.tan((fovDeg * DEG) / 2) * aspect);
  return (radius / Math.sin(Math.min(halfV, halfH))) * margin;
}

/**
 * Distancia mínima a la que las esquinas `corners` caben en el encuadre visto
 * desde la dirección `dir` (unitaria, del objetivo hacia la cámara). Exacta por
 * vista: tiene en cuenta FOV, relación de aspecto y alto libre del visor.
 */
export function fitDistance(
  corners: Vector3[], target: Vector3, dir: Vector3, fovDeg: number, aspect: number,
  freeFraction = 1, fillV = 0.9, fillH = 0.94,
): number {
  // DESIGN §5.3: la caja ocupa como máximo el 90 % del alto libre y el 94 % del ancho.
  const tanV = Math.tan((fovDeg * DEG) / 2) * freeFraction * fillV;
  const tanH = Math.tan((fovDeg * DEG) / 2) * aspect * fillH;
  const worldUp = Math.abs(dir.y) > 0.999 ? new Vector3(0, 0, -1) : new Vector3(0, 1, 0);
  const right = new Vector3().crossVectors(worldUp, dir).normalize();
  const up = new Vector3().crossVectors(dir, right);
  const r = new Vector3();
  let d = 0;
  for (const c of corners) {
    r.subVectors(c, target);
    const along = r.dot(dir);
    d = Math.max(d, along + Math.abs(r.dot(right)) / tanH, along + Math.abs(r.dot(up)) / tanV);
  }
  return d;
}

/** Posición orbital: azimut desde +Z (frente) hacia +X (lado izquierdo del coche). */
export function orbitPosition(target: Vector3, azimuthDeg: number, elevationDeg: number, distance: number, out = new Vector3()): Vector3 {
  const az = azimuthDeg * DEG;
  const el = elevationDeg * DEG;
  return out.set(
    target.x + distance * Math.sin(az) * Math.cos(el),
    target.y + distance * Math.sin(el),
    target.z + distance * Math.cos(az) * Math.cos(el),
  );
}

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** Duración de transición: 900 ms base escalada por el ángulo recorrido (600–1200 ms). */
export function transitionMs(angleRad: number, involvesInterior: boolean): number {
  if (involvesInterior) return 1200;
  return Math.min(1200, Math.max(600, 900 * (angleRad / (Math.PI / 2))));
}
