import type { VehicleConfig } from '../config/types';
import { normalizeAccessories } from './accessories';

export const STORAGE_KEY = 'jac-showroom:estado';
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

export function loadSaved(config: VehicleConfig): PersistedState | null {
  try {
    const txt = localStorage.getItem(STORAGE_KEY);
    return txt ? restore(config, JSON.parse(txt)) : null;
  } catch {
    return null;
  }
}

export function save(config: VehicleConfig, s: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize(config, s)));
  } catch {
    /* almacenamiento no disponible: la app sigue sin persistir */
  }
}
