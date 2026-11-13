import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Raycaster, Vector2, type Mesh } from 'three';
import { getShowroom } from '../state/store';
import { getRuntime } from './compose';

/** Umbrales para distinguir un clic/toque de un arrastre de órbita. */
const MAX_MOVE_PX = 6;
const MAX_MS = 500;

const raycaster = new Raycaster();
(raycaster as Raycaster & { firstHitOnly?: boolean }).firstHitOnly = true;

/** Selección solo con clic o toque. Sin hover: no se lanza ningún rayo al mover el puntero. */
export function Picking() {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    const el = gl.domElement;
    const active = new Set<number>();
    let down: { x: number; y: number; t: number } | null = null;

    const onDown = (e: PointerEvent) => {
      active.add(e.pointerId);
      // Un segundo dedo convierte el gesto en pellizco: no es una selección.
      down = active.size === 1 && e.button === 0 ? { x: e.clientX, y: e.clientY, t: performance.now() } : null;
    };
    const onUp = (e: PointerEvent) => {
      active.delete(e.pointerId);
      const d = down;
      down = null;
      if (!d || Math.hypot(e.clientX - d.x, e.clientY - d.y) > MAX_MOVE_PX || performance.now() - d.t > MAX_MS) return;
      const rt = getRuntime();
      const s = getShowroom();
      if (!rt || s.status !== 'ready') return;

      const r = el.getBoundingClientRect();
      const ndc = new Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const candidates: Mesh[] = [];
      for (const m of rt.index.meshPart.keys()) if (m.visible) candidates.push(m);
      const hit = raycaster.intersectObjects(candidates, false)[0];
      const partId = hit ? rt.index.meshPart.get(hit.object as Mesh) ?? null : null;
      s.select(partId, true);
    };
    const onCancel = (e: PointerEvent) => {
      active.delete(e.pointerId);
      down = null;
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onCancel);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onCancel);
    };
  }, [gl, camera]);

  return null;
}
