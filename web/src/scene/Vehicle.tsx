import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CONFIG, getShowroom, useShowroom } from '../state/store';
import { visibleParts } from '../logic/visibility';
import { applyOpening } from '../logic/transforms';
import { easeInOutCubic } from '../logic/camera';
import { applyEnvTuning, composeVehicle, setExplodeT } from './compose';
import { motionScale } from './motion';

/** Monta el vehículo y aplica el estado del configurador sobre sus objetos 3D. */
export function Vehicle({ gltfs }: { gltfs: GLTF[] }) {
  const rt = useMemo(() => composeVehicle(gltfs, CONFIG), [gltfs]);
  const invalidate = useThree((s) => s.invalidate);

  // Visibilidad: por malla, para respetar subpiezas (un rin oculto no oculta su neumático).
  const accessories = useShowroom((s) => s.accessories);
  const variants = useShowroom((s) => s.variants);
  const hidden = useShowroom((s) => s.hidden);
  const isolated = useShowroom((s) => s.isolated);
  useEffect(() => {
    const visible = visibleParts(CONFIG, { accessories, variants, hidden, isolated });
    for (const [partId, meshes] of rt.index.partMeshes) for (const m of meshes) m.visible = visible.has(partId);
    getShowroom().bumpShadows();
    invalidate();
  }, [rt, accessories, variants, hidden, isolated, invalidate]);

  // Pintura: color, metalness y roughness desde la config; clearcoat intacto.
  const paintId = useShowroom((s) => s.paintId);
  useEffect(() => {
    if (!rt.paint) return;
    const def = CONFIG.paints.find((p) => p.id === paintId);
    const mat = rt.paint.material;
    if (!def || def.hex === null) {
      mat.color.copy(rt.paint.color);
      mat.metalness = rt.paint.metalness;
      mat.roughness = rt.paint.roughness;
    } else {
      mat.color.set(def.hex);
      mat.metalness = def.metalness ?? rt.paint.metalness;
      mat.roughness = def.roughness ?? rt.paint.roughness;
    }
    invalidate();
  }, [rt, paintId, invalidate]);

  // Despiece y aperturas: animados con refs, sin setState por frame.
  const anim = useRef({ explode: getShowroom().explode / 100, doors: new Map<string, number>(), moving: false, frames: 0 });
  useEffect(() => {
    // Al (re)montar, partir del estado ensamblado/cerrado y animar hacia el del store.
    setExplodeT(rt, anim.current.explode);
    for (const o of rt.openings) applyOpening(o, 0);
    getShowroom().modelComposed({
      partIds: [...rt.index.partMeshes].filter(([, m]) => m.length > 0).map(([id]) => id),
      openingIds: rt.openings.map((o) => o.id),
      hasExplode: rt.explode.length > 0,
      paintHex: rt.paint ? `#${rt.paint.color.getHexString()}` : null,
    });
  }, [rt]);
  useEffect(() => useShowroom.subscribe((s, p) => (s.explode !== p.explode || s.openings !== p.openings) && invalidate()), [invalidate]);

  const envState = useRef<{ env: unknown; intensity: number }>({ env: null, intensity: -1 });
  useFrame(({ scene }, delta) => {
    // El estudio se crea/actualiza aparte: sincronizar el ajuste de materiales con él.
    const es = envState.current;
    if (scene.environment !== es.env || scene.environmentIntensity !== es.intensity) {
      es.env = scene.environment;
      es.intensity = scene.environmentIntensity;
      applyEnvTuning(rt, scene.environment, scene.environmentIntensity);
      invalidate();
    }
    const a = anim.current;
    if (a.frames < 3) {
      // La escena está lista tras los primeros frames reales (shaders compilados).
      if (++a.frames === 3) getShowroom().setStatus('ready');
      invalidate();
    }

    const s = getShowroom();
    const instant = motionScale() === 0;
    let moving = false;

    const target = s.explode / 100;
    if (a.explode !== target) {
      // Seguimiento suavizado (≈120 ms) del slider.
      a.explode = instant || Math.abs(target - a.explode) < 1e-3 ? target : a.explode + (target - a.explode) * (1 - Math.exp(-delta / 0.04));
      setExplodeT(rt, a.explode);
      moving = true;
    }

    for (const o of rt.openings) {
      const goal = s.openings.includes(o.id) ? 1 : 0;
      const cur = a.doors.get(o.id) ?? 0;
      if (cur === goal) continue;
      const step = instant ? 1 : delta / 0.6;
      const nxt = goal > cur ? Math.min(goal, cur + step) : Math.max(goal, cur - step);
      a.doors.set(o.id, nxt);
      applyOpening(o, easeInOutCubic(nxt));
      moving = true;
    }

    if (moving) invalidate();
    else if (a.moving) s.bumpShadows(); // al asentarse, rehacer sombras una vez
    a.moving = moving;
  });

  return <primitive object={rt.root} />;
}
