import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Box3, BufferGeometry, Group, Matrix4, Mesh, Object3D, Quaternion, Vector3 } from 'three';
import { JAC6_CONFIG as C } from '../config/jac6';
import type { AccessoryDef, VehicleConfig } from '../config/types';
import { indexParts } from './mapping';
import { normalizeAccessories, toggleAccessory } from './accessories';
import { applyExplode, applyOpening, captureExplode, captureOpenings, explodedBox } from './transforms';
import { restore, serialize, STORAGE_VERSION } from './persistence';
import { availableParts, visibleParts } from './visibility';

interface GltfJson {
  nodes: { name: string; mesh?: number; children?: number[]; translation?: number[]; rotation?: number[]; scale?: number[] }[];
  meshes: { primitives: { attributes: { POSITION: number } }[] }[];
  accessors: { min?: number[]; max?: number[] }[];
  scenes: { nodes: number[] }[];
}

/** Lee el chunk JSON del GLB real y reconstruye la jerarquía como lo hace GLTFLoader. */
function loadGlbTree(): { root: Object3D; json: GltfJson } {
  const buf = readFileSync(join(__dirname, '../../public/models/jac-6-phev.glb'));
  expect(buf.toString('ascii', 0, 4)).toBe('glTF');
  const json: GltfJson = JSON.parse(buf.toString('utf8', 20, 20 + buf.readUInt32LE(12)));
  const build = (i: number): Object3D => {
    const n = json.nodes[i];
    // La caja de cada malla sale de los min/max reales del accesor POSITION del GLB.
    const mesh = (pi: number) => {
      const g = new BufferGeometry();
      const a = json.accessors[json.meshes[n.mesh!].primitives[pi].attributes.POSITION];
      if (a.min && a.max) g.boundingBox = new Box3(new Vector3(...a.min), new Vector3(...a.max));
      return new Mesh(g);
    };
    let o: Object3D;
    if (n.mesh === undefined) o = new Object3D();
    else if (json.meshes[n.mesh].primitives.length === 1) o = mesh(0);
    else {
      o = new Group();
      json.meshes[n.mesh].primitives.forEach((_, pi) => o.add(mesh(pi)));
    }
    o.name = n.name;
    if (n.translation) o.position.fromArray(n.translation);
    if (n.rotation) o.quaternion.fromArray(n.rotation);
    if (n.scale) o.scale.fromArray(n.scale);
    (n.children ?? []).forEach((c) => o.add(build(c)));
    return o;
  };
  const root = new Group();
  json.scenes[0].nodes.forEach((i) => root.add(build(i)));
  return { root, json };
}

describe('mapeo nodo → pieza → grupo', () => {
  const { root, json } = loadGlbTree();
  const index = indexParts(root, C.parts);

  it('todos los nodos de la config existen en el GLB', () => {
    expect(index.missingNodes).toEqual([]);
  });

  it('todas las mallas del GLB pertenecen a alguna pieza', () => {
    expect(index.unmappedMeshes).toHaveLength(0);
    const total = json.nodes.reduce((n, nd) => n + (nd.mesh === undefined ? 0 : json.meshes[nd.mesh].primitives.length), 0);
    expect(index.meshPart.size).toBe(total);
  });

  it('respeta la jerarquía Rueda → Caucho: el neumático no se mezcla con el rin', () => {
    const caucho = root.getObjectByName('Caucho_DI')!;
    expect(caucho.parent?.name).toBe('Rueda_DI');
    const cauchoMeshes: Mesh[] = [];
    caucho.traverse((o) => (o as Mesh).isMesh && cauchoMeshes.push(o as Mesh));
    expect(cauchoMeshes.length).toBeGreaterThan(0);
    for (const m of cauchoMeshes) expect(index.meshPart.get(m)).toBe('neumaticos');
    for (const m of index.partMeshes.get('rines')!) expect(cauchoMeshes).not.toContain(m);
  });

  it('una pieza de varias mallas se selecciona como una sola (puerta)', () => {
    expect(index.partMeshes.get('puerta-di')!.length).toBeGreaterThan(1);
  });

  it('ids, grupos, accesorios y aperturas apuntan a datos existentes', () => {
    const ids = new Set(C.parts.map((p) => p.id));
    expect(ids.size).toBe(C.parts.length);
    const groups = new Set(C.partGroups.map((g) => g.id));
    for (const p of C.parts) expect(groups.has(p.group)).toBe(true);
    for (const a of C.accessories) {
      expect(ids.has(a.partId)).toBe(true);
      for (const r of a.requires ?? []) expect(C.accessories.some((x) => x.id === r)).toBe(true);
    }
    for (const o of C.openings) expect(index.nodes.has(o.node)).toBe(true);
    for (const n of Object.keys(C.explode)) expect(index.nodes.has(n)).toBe(true);
    expect(C.views.some((v) => v.id === C.defaultViewId)).toBe(true);
  });

  it('la pintura existe en el GLB y hay una opción "Original"', () => {
    const buf = readFileSync(join(__dirname, '../../public/models/jac-6-phev.glb'));
    const j = JSON.parse(buf.toString('utf8', 20, 20 + buf.readUInt32LE(12)));
    expect(j.materials.some((m: { name: string }) => m.name === C.paintMaterial)).toBe(true);
    expect(C.paints[0].hex).toBeNull();
  });
});

describe('accesorios: dependencia y exclusividad', () => {
  it('activar canastilla activa las barras', () => {
    expect(toggleAccessory(C.accessories, [], 'canastilla', true)).toEqual(['barras', 'canastilla']);
  });
  it('desactivar barras desactiva la canastilla', () => {
    expect(toggleAccessory(C.accessories, ['barras', 'canastilla', 'tapete'], 'barras', false)).toEqual(['tapete']);
  });
  it('desactivar canastilla deja las barras', () => {
    expect(toggleAccessory(C.accessories, ['barras', 'canastilla'], 'canastilla', false)).toEqual(['barras']);
  });
  it('los pendientes (portabicis ↔ enganche) no generan reglas', () => {
    expect(toggleAccessory(C.accessories, [], 'portabicis', true)).toEqual(['portabicis']);
  });
  it('variantes de una misma categoría son excluyentes y arrastran a sus dependientes', () => {
    const defs: AccessoryDef[] = [
      { id: 'base', name: 'Base', partId: 'x' },
      { id: 'a', name: 'A', partId: 'x', exclusiveGroup: 'g', requires: ['base'] },
      { id: 'b', name: 'B', partId: 'x', exclusiveGroup: 'g' },
      { id: 'extra-a', name: 'Extra', partId: 'x', requires: ['a'] },
    ];
    let s = toggleAccessory(defs, [], 'extra-a', true);
    expect(s).toEqual(['base', 'a', 'extra-a']);
    s = toggleAccessory(defs, s, 'b', true);
    expect(s).toEqual(['base', 'b']);
    expect(normalizeAccessories(defs, ['a', 'b', 'desconocido'])).toEqual(['base', 'b']);
  });
  it('accesorios inactivos no son piezas disponibles', () => {
    const av = availableParts(C, { accessories: ['barras'], variants: {} });
    expect(av.has('acc-barras')).toBe(true);
    expect(av.has('acc-canastilla')).toBe(false);
    expect(av.has('carroceria')).toBe(true);
  });
  it('aislar muestra solo la pieza aislada; ocultar la quita', () => {
    const base = { accessories: [], variants: {}, hidden: ['volante'], isolated: null };
    expect(visibleParts(C, base).has('volante')).toBe(false);
    expect([...visibleParts(C, { ...base, isolated: 'tablero' })]).toEqual(['tablero']);
    expect(visibleParts(C, { ...base, isolated: 'acc-tiron' }).size).toBe(0);
  });
});

describe('restauración exacta de transforms', () => {
  it('despiece 0 → 1 → 0.37 → 0 deja las matrices originales', () => {
    const { root } = loadGlbTree();
    const index = indexParts(root, C.parts);
    root.updateMatrixWorld(true);
    const before = new Map<Object3D, Matrix4>();
    root.traverse((o) => before.set(o, o.matrixWorld.clone()));
    const entries = captureExplode(index.nodes, C.explode);
    expect(entries.length).toBe(Object.keys(C.explode).length);

    for (const t of [0, 1, 0.37, 0]) applyExplode(entries, t);
    root.updateMatrixWorld(true);
    root.traverse((o) => {
      const a = o.matrixWorld.elements;
      const b = before.get(o)!.elements;
      for (let i = 0; i < 16; i++) expect(Math.abs(a[i] - b[i])).toBeLessThanOrEqual(1e-9);
    });
  });

  it('el despiece no acumula: aplicar t dos veces da lo mismo que una', () => {
    const { root } = loadGlbTree();
    const entries = captureExplode(indexParts(root, C.parts).nodes, C.explode);
    applyExplode(entries, 0.5);
    const once = entries.map((e) => e.node.position.clone());
    applyExplode(entries, 0.5);
    entries.forEach((e, i) => expect(e.node.position.equals(once[i])).toBe(true));
    const rim = entries.find((e) => e.node.name === 'Rueda_DI')!;
    expect(rim.node.position.x).toBeCloseTo(rim.original.x + C.explode.Rueda_DI[0] / 2, 12);
  });

  it('despiece al 100 %: ninguna pieza se cruza con otra y cada rueda (rin + caucho + pinza) sale entera, fuera de la carrocería', () => {
    const { root } = loadGlbTree();
    const index = indexParts(root, C.parts);
    // Mallas agrupadas por el nodo configurado más cercano (rin y caucho por separado, rueda a rueda).
    const nodeOf = new Map<string, Mesh[]>();
    for (const m of index.meshPart.keys()) {
      let o: Object3D | null = m;
      while (o && index.nodes.get(o.name) !== o) o = o.parent;
      if (o) nodeOf.set(o.name, [...(nodeOf.get(o.name) ?? []), m]);
    }
    const entries = captureExplode(index.nodes, C.explode);
    const accessoryNodes = new Set(C.parts.filter((p) => p.group === 'accesorios').flatMap((p) => p.nodes));
    const boxes = (t: number) => {
      const out = new Map<string, Box3>();
      for (const [name, meshes] of nodeOf) if (name !== 'Carroceria' && !(accessoryNodes.has(name) && !(name in C.explode))) out.set(name, explodedBox(root, entries, meshes, t, 0));
      return out;
    };
    const flat = boxes(0);
    const open = boxes(1);
    const gap = (a: Box3, b: Box3) => Math.max(a.min.x - b.max.x, b.min.x - a.max.x, a.min.y - b.max.y, b.min.y - a.max.y, a.min.z - b.max.z, b.min.z - a.max.z);
    const names = [...open.keys()];
    const moved = (n: string) => open.get(n)!.min.clone().sub(flat.get(n)!.min);
    for (let i = 0; i < names.length; i++)
      for (let j = i + 1; j < names.length; j++) {
        const [a, b] = [names[i], names[j]];
        // Solo pueden solaparse piezas que se mueven juntas (mismo desplazamiento: una rueda entera, las dos puertas de un lado).
        if (gap(open.get(a)!, open.get(b)!) < 0 && moved(a).distanceTo(moved(b)) > 1e-9) throw new Error(`${a} y ${b} se cruzan al desplegar`);
      }
    const body = explodedBox(root, entries, nodeOf.get('Carroceria')!, 1, 0);
    for (const w of ['DI', 'DD', 'TI', 'TD']) {
      const rim = moved(`Rueda_${w}`);
      expect(rim.length()).toBeGreaterThan(0.5);
      for (const n of [`Caucho_${w}`, `Pinza_${w}`]) expect(moved(n).distanceTo(rim)).toBeLessThan(1e-9);
      expect(gap(open.get(`Rueda_${w}`)!, body)).toBeGreaterThan(0.1);
    }
    // El despiece es bastante mayor que el original (≈ el doble).
    expect(Math.abs(C.explode.Tablero[2])).toBeGreaterThanOrEqual(1.2);
    expect(Math.abs(C.explode.Asiento_conductor[0])).toBeGreaterThanOrEqual(1);
  });

  it('la caja de encuadre con despiece abarca todas las piezas desplegadas y no altera el estado', () => {
    const { root } = loadGlbTree();
    const index = indexParts(root, C.parts);
    const entries = captureExplode(index.nodes, C.explode);
    const meshes = [...index.meshPart.keys()];
    applyExplode(entries, 0.4);
    root.updateMatrixWorld(true);
    const shown = entries.map((e) => e.node.position.clone());
    const assembled = explodedBox(root, entries, meshes, 0, 0.4);
    const full = explodedBox(root, entries, meshes, 1, 0.4);
    expect(full.containsBox(assembled)).toBe(true);
    expect(full.getSize(new Vector3()).y).toBeGreaterThan(assembled.getSize(new Vector3()).y + 1);
    entries.forEach((e, i) => expect(e.node.position.equals(shown[i])).toBe(true)); // restaurado al valor mostrado
  });

  it('abrir y cerrar puertas restaura el cuaternión original', () => {
    const { root } = loadGlbTree();
    const entries = captureOpenings(indexParts(root, C.parts).nodes, C.openings);
    expect(entries).toHaveLength(C.openings.length);
    const q0 = entries.map((e) => e.node.quaternion.clone());
    for (const k of [0.3, 1, 0.6, 0]) entries.forEach((e) => applyOpening(e, k));
    entries.forEach((e, i) => expect(1 - Math.abs(e.node.quaternion.dot(q0[i]))).toBeLessThan(1e-12));
  });

  it('las puertas abren hacia fuera: el borde trasero se aleja del eje del coche', () => {
    const { root } = loadGlbTree();
    const entries = captureOpenings(indexParts(root, C.parts).nodes, C.openings);
    for (const e of entries.filter((x) => x.id.startsWith('puerta'))) {
      const side = Math.sign(e.node.position.x);
      // Punto local detrás de la bisagra (la puerta se extiende hacia −Z desde su borde delantero).
      const p = new Vector3(0, 0, -0.8);
      applyOpening(e, 1);
      const opened = p.clone().applyQuaternion(e.node.quaternion);
      applyOpening(e, 0);
      expect(Math.sign(opened.x)).toBe(side);
    }
    const porton = entries.find((e) => e.id === 'porton')!;
    applyOpening(porton, 1);
    // El portón cuelga hacia abajo desde la bisagra superior: al abrir sube y va hacia atrás (−Z).
    const tip = new Vector3(0, -0.8, 0).applyQuaternion(porton.node.quaternion);
    expect(tip.z).toBeLessThan(0);
    expect(tip.y).toBeGreaterThan(-0.8 * Math.cos((80 * Math.PI) / 180) - 1e-9);
    applyOpening(porton, 0);
    expect(porton.node.quaternion.equals(new Quaternion())).toBe(true);
  });
});

describe('persistencia versionada', () => {
  const ok = serialize(C, { paintId: 'onyx-black', accessories: ['canastilla'], variants: {} });

  it('valida ids y normaliza dependencias', () => {
    expect(restore(C, ok)).toEqual({ paintId: 'onyx-black', accessories: ['barras', 'canastilla'], variants: {} });
  });
  it('no guarda ni restaura piezas ocultas ni despiece: siempre arranca ensamblado', () => {
    expect(ok).not.toHaveProperty('hidden');
    expect(ok).not.toHaveProperty('explode');
    const r = restore(C, { ...ok, hidden: ['volante'], explode: 100 });
    expect(r).not.toHaveProperty('hidden');
    expect(r).not.toHaveProperty('explode');
  });
  it('descarta una versión vieja o de otro vehículo', () => {
    expect(restore(C, { ...ok, version: STORAGE_VERSION - 1 })).toBeNull();
    expect(restore(C, { ...ok, vehicleId: 'otro' })).toBeNull();
    expect(restore(C, 'basura')).toBeNull();
    expect(restore(C, null)).toBeNull();
  });
  it('ids desconocidos se descartan sin romper el resto', () => {
    const r = restore(C, { ...ok, paintId: 'rosa', accessories: ['x', 3, 'tapete'] });
    expect(r).toMatchObject({ paintId: 'original', accessories: ['tapete'] });
  });
  it('variantes: solo opciones válidas de grupos existentes', () => {
    const cfg: VehicleConfig = {
      ...C,
      variantGroups: [{ id: 'rines', name: 'Rines', defaultOptionId: 'r17', options: [
        { id: 'r17', name: '17', partId: 'rines' }, { id: 'r18', name: '18', partId: 'rines' }] }],
    };
    const saved = { ...serialize(cfg, { paintId: 'original', accessories: [], variants: { rines: 'r18', viejo: 'x' } }) };
    expect(restore(cfg, saved)!.variants).toEqual({ rines: 'r18' });
    expect(restore(cfg, { ...saved, variants: { rines: 'r99' } })!.variants).toEqual({ rines: 'r17' });
  });
});
