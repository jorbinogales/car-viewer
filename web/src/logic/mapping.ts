import type { Mesh, Object3D } from 'three';
import type { PartDef } from '../config/types';

export interface PartIndex {
  /** Pieza de cada malla. */
  meshPart: Map<Mesh, string>;
  /** Mallas propias de cada pieza (sin las de subpiezas configuradas aparte). */
  partMeshes: Map<string, Mesh[]>;
  /** Nodo encontrado para cada nombre configurado. */
  nodes: Map<string, Object3D>;
  /** Nodos de la config que no existen en el modelo. */
  missingNodes: string[];
  /** Mallas que no pertenecen a ninguna pieza configurada. */
  unmappedMeshes: Mesh[];
}

const isMesh = (o: Object3D): o is Mesh => (o as Mesh).isMesh === true;

/**
 * Relaciona mallas → pieza por nombre de nodo, nunca por índice. Cada malla
 * pertenece al ancestro configurado más cercano (incluida ella misma).
 */
export function indexParts(root: Object3D, parts: PartDef[]): PartIndex {
  const nodeToPart = new Map<string, string>();
  for (const p of parts) for (const n of p.nodes) nodeToPart.set(n, p.id);

  const index: PartIndex = {
    meshPart: new Map(),
    partMeshes: new Map(parts.map((p) => [p.id, []])),
    nodes: new Map(),
    missingNodes: [],
    unmappedMeshes: [],
  };

  const walk = (o: Object3D, current: string | null) => {
    const own = nodeToPart.get(o.name);
    if (own && !index.nodes.has(o.name)) {
      index.nodes.set(o.name, o);
      current = own;
    }
    if (isMesh(o)) {
      if (current) {
        index.meshPart.set(o, current);
        index.partMeshes.get(current)!.push(o);
      } else {
        index.unmappedMeshes.push(o);
      }
    }
    for (const c of o.children) walk(c, current);
  };
  walk(root, null);

  index.missingNodes = [...nodeToPart.keys()].filter((n) => !index.nodes.has(n));
  return index;
}
