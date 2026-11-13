import {
  Box3,
  Color,
  Group,
  MathUtils,
  Sphere,
  type Material,
  type Mesh,
  type MeshPhysicalMaterial,
  type MeshStandardMaterial,
  type Texture,
} from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { BufferGeometry, Mesh as ThreeMesh } from 'three';
import type { VehicleConfig } from '../config/types';
import { indexParts, type PartIndex } from '../logic/mapping';
import { applyExplode, captureExplode, captureOpenings, explodedBox, type ExplodeEntry, type OpeningEntry } from '../logic/transforms';

// BVH: raycast acelerado para el picking (el modelo tiene ≈2,6 M triángulos).
BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
ThreeMesh.prototype.raycast = acceleratedRaycast;

/** Capa de las mallas opacas: ocluyen el contorno de selección. */
export const OCCLUDER_LAYER = 2;
/** Capa de las mallas de la pieza seleccionada. */
export const SELECTED_LAYER = 3;

type PaintMaterial = MeshPhysicalMaterial | MeshStandardMaterial;

export interface VehicleRuntime {
  root: Group;
  index: PartIndex;
  explode: ExplodeEntry[];
  /** Despiece que se está mostrando ahora (0–1). Solo `setExplodeT` lo escribe. */
  explodeT: number;
  openings: OpeningEntry[];
  paint: { material: PaintMaterial; color: Color; metalness: number; roughness: number } | null;
  /** Caja y esfera del vehículo ensamblado, sin accesorios, en coordenadas de mundo. */
  bounds: Box3;
  sphere: Sphere;
  bvhMs: number | null;
  /** Material → factor de `envMapIntensity` de la config. */
  tuned: Map<MeshStandardMaterial, number>;
}

let runtime: VehicleRuntime | null = null;
let composedFrom: GLTF[] | null = null;

export const getRuntime = () => runtime;

/** Compone el vehículo una sola vez por carga (evita clonar dos veces la pintura). */
export function composeVehicle(gltfs: GLTF[], config: VehicleConfig): VehicleRuntime {
  if (runtime && composedFrom === gltfs) return runtime;

  const root = new Group();
  root.name = `vehiculo:${config.id}`;
  const t = config.transform;
  root.position.fromArray(t.position);
  root.rotation.set(...(t.rotationDeg.map((d) => MathUtils.degToRad(d)) as [number, number, number]));
  root.scale.setScalar(t.scale);

  // GLB principal en el contenedor común; los adicionales en su punto de montaje.
  root.add(gltfs[0].scene);
  gltfs.slice(1).forEach((g, i) => {
    const m = config.assets[i + 1].mount;
    const holder = new Group();
    holder.name = `montaje:${config.assets[i + 1].id}`;
    if (m?.position) holder.position.fromArray(m.position);
    if (m?.rotationDeg) holder.rotation.set(...(m.rotationDeg.map((d) => MathUtils.degToRad(d)) as [number, number, number]));
    if (m?.scale) holder.scale.setScalar(m.scale);
    holder.add(g.scene);
    (m?.parentNode ? gltfs[0].scene.getObjectByName(m.parentNode) ?? root : root).add(holder);
  });

  const index = indexParts(root, config.parts);

  // Pintura: un único clon compartido por todos sus usos; el resto de materiales intacto.
  let paint: VehicleRuntime['paint'] = null;
  let clone: PaintMaterial | null = null;
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    const swap = (m: Material) => {
      if (m.name !== config.paintMaterial) return m;
      clone ??= (m as PaintMaterial).clone();
      return clone;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material);
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    if (mats.every((m) => !m.transparent)) mesh.layers.enable(OCCLUDER_LAYER);
  });
  if (clone) {
    const c = clone as PaintMaterial;
    paint = { material: c, color: c.color.clone(), metalness: c.metalness, roughness: c.roughness };
  }

  // Materiales con ajuste de entorno (desde la config); se aplican en applyEnvTuning.
  const tuned = new Map<MeshStandardMaterial, number>();
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      const f = config.materialTuning[m.name]?.envMapIntensity;
      if (f !== undefined && (m as MeshStandardMaterial).isMeshStandardMaterial) tuned.set(m as MeshStandardMaterial, f);
    }
  });

  root.updateMatrixWorld(true);
  const accessoryParts = new Set(config.accessories.map((a) => a.partId));
  const bounds = new Box3();
  for (const [partId, meshes] of index.partMeshes) {
    if (accessoryParts.has(partId)) continue;
    for (const m of meshes) bounds.expandByObject(m);
  }
  if (bounds.isEmpty()) bounds.setFromObject(root);

  runtime = {
    root,
    index,
    explode: captureExplode(index.nodes, config.explode),
    explodeT: 0,
    openings: captureOpenings(index.nodes, config.openings),
    paint,
    bounds,
    sphere: bounds.getBoundingSphere(new Sphere()),
    bvhMs: null,
    tuned,
  };
  composedFrom = gltfs;
  scheduleBvh(runtime);
  return runtime;
}

/** Aplica el despiece `t` (0–1) y lo recuerda para poder medir sin perderlo. */
export function setExplodeT(rt: VehicleRuntime, t: number) {
  rt.explodeT = t;
  applyExplode(rt.explode, t);
}

/**
 * Caja de encuadre: el vehículo ensamblado (`rt.bounds`) o, con despiece, las piezas
 * visibles desplegadas a `t`. Con el casco oculto, las capas interiores llenan el visor.
 */
export function framingBounds(rt: VehicleRuntime, t: number, visible: ReadonlySet<string>): Box3 {
  if (t === 0) return rt.bounds;
  const meshes: Mesh[] = [];
  for (const [partId, ms] of rt.index.partMeshes) if (visible.has(partId)) meshes.push(...ms);
  const box = explodedBox(rt.root, rt.explode, meshes, t, rt.explodeT);
  return box.isEmpty() ? rt.bounds : box;
}

/**
 * Desde three r163, con `scene.environment` el renderer usa `scene.environmentIntensity`
 * e ignora `material.envMapIntensity` salvo que el material tenga su propio envMap.
 * Por eso los materiales ajustados reciben el mismo mapa del estudio y su factor.
 */
export function applyEnvTuning(rt: VehicleRuntime, env: Texture | null, intensity: number) {
  for (const [m, f] of rt.tuned) {
    if (m.envMap !== env) {
      m.envMap = env;
      m.needsUpdate = true;
    }
    m.envMapIntensity = f * intensity;
  }
}

/** Construye los BVH en ratos libres, malla a malla, para no bloquear el primer render. */
function scheduleBvh(rt: VehicleRuntime) {
  const meshes = [...rt.index.meshPart.keys()].sort(
    (a, b) => (b.geometry.index?.count ?? 0) - (a.geometry.index?.count ?? 0),
  );
  const idle: (cb: () => void) => void =
    typeof requestIdleCallback === 'function' ? (cb) => requestIdleCallback(cb, { timeout: 500 }) : (cb) => setTimeout(cb, 16);
  let spent = 0;
  const step = () => {
    const m = meshes.shift();
    if (!m) {
      rt.bvhMs = Math.round(spent);
      return;
    }
    const t0 = performance.now();
    if (!m.geometry.boundsTree) m.geometry.computeBoundsTree();
    spent += performance.now() - t0;
    idle(step);
  };
  setTimeout(() => idle(step), 1500);
}
