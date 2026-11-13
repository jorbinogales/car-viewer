import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import type { Mesh } from 'three';
import type { VehicleConfig } from '../config/types';

/** URL servida de un recurso de `public/`. */
export const assetUrl = (path: string) => import.meta.env.BASE_URL + path;
/** Ruta en disco que se muestra al usuario cuando falta un archivo. */
export const assetDiskPath = (path: string) => `web/public/${path}`;

export class AssetError extends Error {
  constructor(public kind: 'missing' | 'error', public url: string, message: string) {
    super(message);
  }
}

let gltfLoader: GLTFLoader | null = null;
function getLoader(): GLTFLoader {
  if (!gltfLoader) {
    const draco = new DRACOLoader().setDecoderPath(assetUrl('draco/'));
    gltfLoader = new GLTFLoader().setDRACOLoader(draco);
  }
  return gltfLoader;
}

let cache: { key: string; promise: Promise<GLTF[]> } | null = null;

/**
 * Carga todos los GLB del vehículo una sola vez (caché por config). El
 * progreso es real en bytes si el servidor envía Content-Length de todos los
 * archivos; si no, `total` es null y la UI muestra el indicador indeterminado.
 */
export function loadVehicleAssets(config: VehicleConfig, onProgress: (loaded: number, total: number | null) => void): Promise<GLTF[]> {
  const key = config.assets.map((a) => a.url).join('|');
  if (cache?.key === key) return cache.promise;

  const loaded = config.assets.map(() => 0);
  const totals: (number | null)[] = config.assets.map(() => null);
  const report = () => {
    const known = totals.every((t): t is number => t !== null && t > 0);
    onProgress(loaded.reduce((a, b) => a + b, 0), known ? (totals as number[]).reduce((a, b) => a + b, 0) : null);
  };

  const promise = Promise.all(
    config.assets.map((asset, i) => {
      const url = assetUrl(asset.url);
      return getLoader()
        .loadAsync(url, (e) => {
          loaded[i] = e.loaded;
          totals[i] = e.lengthComputable ? e.total : null;
          report();
        })
        .catch(async (err: unknown) => {
          throw await classify(url, err);
        })
        .then((gltf) => {
          let meshes = 0;
          gltf.scene.traverse((o) => ((o as Mesh).isMesh ? meshes++ : 0));
          if (meshes === 0) throw new AssetError('error', url, 'El archivo no contiene mallas (modelo vacío).');
          return gltf;
        });
    }),
  );
  cache = { key, promise };
  promise.catch(() => {
    if (cache?.promise === promise) cache = null;
  });
  return promise;
}

export function clearAssetCache() {
  cache = null;
}

/** 404 o una página HTML (fallback SPA de Vite) = archivo ausente; el resto = incompatible. */
async function classify(url: string, err: unknown): Promise<AssetError> {
  const message = err instanceof Error ? err.message : String(err);
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    const type = res.headers.get('content-type') ?? '';
    if (res.status === 404 || type.includes('text/html')) {
      return new AssetError('missing', url, `No existe el archivo (HTTP ${res.status}, ${type || 'sin tipo'}).`);
    }
  } catch {
    /* sin red: se trata como error genérico */
  }
  return new AssetError('error', url, `Archivo incompatible o dañado: ${message}`);
}
