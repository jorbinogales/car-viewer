import type { VehicleConfig } from '../config/types';
import { normalizeAccessories } from './accessories';

/** Una clave por vehículo: cada coche guarda su propia configuración. */
export const stateKey = (vehicleId: string) => `car-viewer:estado:${vehicleId}`;
/** Clave de cuando el visor solo tenía el JAC 6. */
export const LEGACY_KEY = 'jac-showroom:estado';
export const LEGACY_VEHICLE_ID = 'jac-6-phev';
/** v2: ya no se guardan piezas ocultas ni despiece; el vehículo siempre arranca ensamblado. */
export const STORAGE_VERSION = 2;

/** Estado configurable de la sesión. */
export interface ConfigurableState {
  paintId: string;
  accessories: string[];
  variants: Record<string, string>;
  hidden: string[];
  explode: number;
}

/** Lo que se guarda: solo la configuración elegida, serializable (nunca objetos Three.js). */
export type PersistedState = Pick<ConfigurableState, 'paintId' | 'accessories' | 'variants'>;

export interface SavedState extends PersistedState {
  version: number;
  vehicleId: string;
}

export function defaultConfigurable(config: VehicleConfig): ConfigurableState {
  return {
    paintId: config.paints[0].id,
    accessories: [],
    variants: Object.fromEntries(config.variantGroups.map((g) => [g.id, g.defaultOptionId])),
    hidden: [],
    explode: 0,
  };
}

export function serialize(config: VehicleConfig, s: PersistedState): SavedState {
  return { version: STORAGE_VERSION, vehicleId: config.id, paintId: s.paintId, accessories: s.accessories, variants: s.variants };
}

/**
 * Valida lo guardado contra la config actual. Versión o vehículo distintos →
 * se descarta todo. Ids desconocidos → se descartan uno a uno.
 */
export function restore(config: VehicleConfig, raw: unknown): PersistedState | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<SavedState>;
  if (r.version !== STORAGE_VERSION || r.vehicleId !== config.id) return null;

  const def = defaultConfigurable(config);
  const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  const accIds = new Set(config.accessories.map((a) => a.id));

  const variants = { ...def.variants };
  if (r.variants && typeof r.variants === 'object') {
    for (const g of config.variantGroups) {
      const v = (r.variants as Record<string, unknown>)[g.id];
      if (typeof v === 'string' && g.options.some((o) => o.id === v)) variants[g.id] = v;
    }
  }

  return {
    paintId: config.paints.some((p) => p.id === r.paintId) ? (r.paintId as string) : def.paintId,
    accessories: normalizeAccessories(config.accessories, strings(r.accessories).filter((a) => accIds.has(a))),
    variants,
  };
}

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/**
 * Migra una sola vez lo guardado bajo la clave antigua a la del JAC 6 y borra la antigua.
 * Si la clave nueva ya existe, no se pisa. Si falla la escritura, la antigua se conserva.
 */
export function migrateLegacy(store: Store): void {
  const legacy = store.getItem(LEGACY_KEY);
  if (legacy === null) return;
  const key = stateKey(LEGACY_VEHICLE_ID);
  if (store.getItem(key) === null) store.setItem(key, legacy);
  store.removeItem(LEGACY_KEY);
}

export function loadSaved(config: VehicleConfig): PersistedState | null {
  try {
    try {
      migrateLegacy(localStorage);
    } catch {
      /* la migración es best effort: lo que ya esté en la clave nueva se lee igual */
    }
    const txt = localStorage.getItem(stateKey(config.id));
    return txt ? restore(config, JSON.parse(txt)) : null;
  } catch {
    return null;
  }
}

export function save(config: VehicleConfig, s: PersistedState): void {
  try {
    localStorage.setItem(stateKey(config.id), JSON.stringify(serialize(config, s)));
  } catch {
    /* almacenamiento no disponible: la app sigue sin persistir */
  }
}
