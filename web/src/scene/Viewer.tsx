import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { NeutralToneMapping } from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CONFIG, getShowroom, useShowroom } from '../state/store';
import { AssetError, assetUrl, clearAssetCache, loadVehicleAssets } from './loader';
import { Studio } from './Studio';
import { CameraRig } from './CameraRig';
import { Vehicle } from './Vehicle';
import { Picking } from './Picking';
import { SelectionOutline } from './SelectionOutline';
import { DEV, DevHandle } from '../ui/DevInspector';

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Depuración: `?dev=1&estado=cargando|indeterminado|error|ausente|sinwebgl` fuerza un estado del visor. */
function forceState(): boolean {
  const q = new URLSearchParams(location.search);
  const forced = q.get('dev') === '1' ? q.get('estado') : null;
  if (!forced) return false;
  const s = getShowroom();
  const url = assetUrl(CONFIG.assets[0].url);
  if (forced === 'cargando') s.setProgress(6_200_000, 14_103_536);
  if (forced === 'cargando' || forced === 'indeterminado') s.setStatus('loading');
  else if (forced === 'error') s.setStatus('error', { loadError: { message: 'Estado forzado para depuración.', url } });
  else if (forced === 'ausente') s.setStatus('missing', { loadError: { message: 'Estado forzado para depuración.', url } });
  else if (forced === 'sinwebgl') s.setStatus('nowebgl');
  else return false;
  return true;
}

const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
// Resolución según el dispositivo: táctil hasta 1,5×, escritorio hasta 2×.
const DPR: [number, number] = [1, coarse ? 1.5 : 2];
const GL = { antialias: true, toneMapping: NeutralToneMapping, toneMappingExposure: 1, powerPreference: 'high-performance' as const };

/** Visor y escena. Carga los GLB fuera del canvas para reportar progreso real. */
export function Viewer() {
  const attempt = useShowroom((s) => s.loadAttempt);
  const status = useShowroom((s) => s.status);
  const [gltfs, setGltfs] = useState<GLTF[] | null>(null);

  useEffect(() => {
    const s = getShowroom();
    if (!hasWebGL()) {
      s.setStatus('nowebgl');
      return;
    }
    if (forceState()) return;
    let alive = true;
    if (attempt > 0) clearAssetCache();
    s.setStatus('loading');
    const t0 = performance.now();
    loadVehicleAssets(CONFIG, (loaded, total) => alive && getShowroom().setProgress(loaded, total))
      .then((g) => {
        if (!alive) return;
        (window as unknown as { __showroomLoadMs?: number }).__showroomLoadMs = Math.round(performance.now() - t0);
        setGltfs(g);
        getShowroom().setStatus('composing');
      })
      .catch((err: unknown) => {
        if (!alive) return;
        const e = err instanceof AssetError ? err : new AssetError('error', assetUrl(CONFIG.assets[0].url), String(err));
        setGltfs(null);
        getShowroom().setStatus(e.kind, { loadError: { message: e.message, url: e.url } });
      });
    return () => {
      alive = false;
    };
  }, [attempt]);

  if (status === 'nowebgl') return null;

  return (
    <Canvas
      key={attempt}
      className="stage-canvas"
      frameloop="demand"
      dpr={DPR}
      gl={GL}
      camera={{ fov: 30, near: 0.1, far: 200, position: [9, 3, 11] }}
      tabIndex={-1}
      aria-label={`Visor 3D del ${CONFIG.name} ${CONFIG.version}. Usa los controles del panel para cambiar de vista.`}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          getShowroom().setStatus('contextlost');
        });
      }}
    >
      <Studio />
      <CameraRig />
      {gltfs && <Vehicle gltfs={gltfs} />}
      <Picking />
      <SelectionOutline />
      {DEV && <DevHandle />}
    </Canvas>
  );
}
