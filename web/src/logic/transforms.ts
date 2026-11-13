import { Box3, Quaternion, Vector3, type Mesh, type Object3D } from 'three';
import type { OpeningDef, Vec3 } from '../config/types';

export interface ExplodeEntry {
  node: Object3D;
  original: Vector3;
  offset: Vector3;
}

/** Guarda una sola vez la posición original de cada nodo con despiece. */
export function captureExplode(nodes: Map<string, Object3D>, explode: Record<string, Vec3>): ExplodeEntry[] {
  return Object.entries(explode)
    .filter(([name]) => nodes.has(name))
    .map(([name, v]) => {
      const node = nodes.get(name)!;
      return { node, original: node.position.clone(), offset: new Vector3(...v) };
    });
}

/** Posición = original + vector · t. Nunca acumula: t = 0 devuelve la original exacta. */
export function applyExplode(entries: ExplodeEntry[], t: number): void {
  for (const e of entries) e.node.position.copy(e.original).addScaledVector(e.offset, t);
}

/**
 * Caja mundial de `meshes` con el despiece en `t`, sin tocar el estado visible:
 * al terminar deja el despiece en `restoreT` (el valor que se está mostrando).
 */
export function explodedBox(root: Object3D, entries: ExplodeEntry[], meshes: Mesh[], t: number, restoreT: number): Box3 {
  applyExplode(entries, t);
  root.updateMatrixWorld(true);
  const box = new Box3();
  for (const m of meshes) box.expandByObject(m);
  applyExplode(entries, restoreT);
  root.updateMatrixWorld(true);
  return box;
}

export interface OpeningEntry {
  id: string;
  node: Object3D;
  original: Quaternion;
  axis: Vector3;
  /** Ángulo con signo de apertura completa, en radianes. */
  maxRad: number;
}

const AXES = { x: new Vector3(1, 0, 0), y: new Vector3(0, 1, 0), z: new Vector3(0, 0, 1) };

export function captureOpenings(nodes: Map<string, Object3D>, defs: OpeningDef[]): OpeningEntry[] {
  return defs
    .filter((d) => nodes.has(d.node))
    .map((d) => {
      const node = nodes.get(d.node)!;
      return {
        id: d.id,
        node,
        original: node.quaternion.clone(),
        axis: AXES[d.axis].clone(),
        maxRad: (d.sign * d.maxDeg * Math.PI) / 180,
      };
    });
}

const _q = new Quaternion();
/** Gira en el eje local alrededor del origen del nodo (la bisagra). k ∈ [0, 1]. */
export function applyOpening(e: OpeningEntry, k: number): void {
  _q.setFromAxisAngle(e.axis, e.maxRad * k);
  e.node.quaternion.copy(e.original).multiply(_q);
}
