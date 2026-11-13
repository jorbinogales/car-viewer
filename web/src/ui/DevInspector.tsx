import { useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { Mesh, Object3D } from 'three';
import { CONFIG, useShowroom } from '../state/store';
import { getRuntime } from '../scene/compose';

/** Solo con `?dev=1`. Inspecciona la jerarquía real y el mapeo nodo → pieza. */
const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
export const DEV = params.get('dev') === '1';
/** `?dev=1&inspector=0`: herramientas de QA sin el panel visible (capturas limpias). */
export const SHOW_INSPECTOR = DEV && params.get('inspector') !== '0';

const tris = (o: Object3D) => {
  let n = 0;
  o.traverse((c) => {
    const g = (c as Mesh).geometry;
    if ((c as Mesh).isMesh && g) n += (g.index ? g.index.count : g.attributes.position.count) / 3;
  });
  return n;
};

function Node({ o, depth }: { o: Object3D; depth: number }) {
  const rt = getRuntime()!;
  const part = [...rt.index.nodes].find(([, n]) => n === o)?.[0];
  const partId = part ? CONFIG.parts.find((p) => p.nodes.includes(part))?.id : undefined;
  const named = o.children.filter((c) => !(c as Mesh).isMesh || c.children.length);
  const meshes = o.children.filter((c) => (c as Mesh).isMesh).length + ((o as Mesh).isMesh ? 1 : 0);
  const label = (
    <>
      <code>{o.name || '(sin nombre)'}</code> <span className="dev-dim">{o.type} · {meshes} mallas · {Math.round(tris(o)).toLocaleString('es')} tri</span>
      {partId && <span className="dev-tag">→ {partId}</span>}
    </>
  );
  if (!named.length || depth > 6) return <li>{label}</li>;
  return (
    <li>
      <details open={depth < 2}>
        <summary>{label}</summary>
        <ul>{named.map((c) => <Node key={c.uuid} o={c} depth={depth + 1} />)}</ul>
      </details>
    </li>
  );
}

export function DevInspector() {
  const [open, setOpen] = useState(true);
  const status = useShowroom((s) => s.status);
  const rt = getRuntime();
  if (!open) return <button type="button" className="dev-toggle" onClick={() => setOpen(true)}>Dev</button>;
  return (
    <aside className="dev-inspector" aria-label="Herramienta de desarrollo">
      <div className="dev-head">
        <strong>Inspector (dev)</strong>
        <button type="button" onClick={() => setOpen(false)}>Cerrar</button>
      </div>
      <p>Estado: {status} · carga {(window as unknown as { __showroomLoadMs?: number }).__showroomLoadMs ?? '—'} ms · BVH {rt?.bvhMs ?? 'en curso'} ms</p>
      <p>Forzar estado: <code>?dev=1&amp;estado=cargando|indeterminado|error|ausente|sinwebgl</code></p>
      {rt && (
        <>
          <p>Nodos configurados ausentes: {rt.index.missingNodes.length ? rt.index.missingNodes.join(', ') : 'ninguno'}</p>
          <p>Mallas sin pieza: {rt.index.unmappedMeshes.length ? rt.index.unmappedMeshes.map((m) => m.name).join(', ') : 'ninguna'}</p>
          <p>Triángulos: {Math.round(tris(rt.root)).toLocaleString('es')}</p>
          <ul className="dev-tree"><Node o={rt.root} depth={0} /></ul>
        </>
      )}
      <p><strong>Pendientes</strong></p>
      <ul>{CONFIG.pending.map((p) => <li key={p}>{p}</li>)}</ul>
    </aside>
  );
}

/** Dentro del Canvas: expone renderer y runtime a la QA automatizada (solo dev). */
export function DevHandle() {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const camera = useThree((s) => s.camera);
  const w = window as unknown as Record<string, unknown> & { __frames?: number };
  w.__showroom = { gl, camera, invalidate, getRuntime, store: useShowroom };
  useFrame(() => void (w.__frames = (w.__frames ?? 0) + 1)); // frames renderizados (para medir fps)
  return null;
}
