import type { VehicleConfig } from '../config/types';

export interface VisibilityInput {
  accessories: readonly string[];
  variants: Readonly<Record<string, string>>;
  hidden: readonly string[];
  isolated: string | null;
}

/** Piezas que existen en la configuración actual (accesorios activos y variantes elegidas incluidas). */
export function availableParts(config: VehicleConfig, s: Pick<VisibilityInput, 'accessories' | 'variants'>): Set<string> {
  const optional = new Map<string, boolean>();
  for (const a of config.accessories) optional.set(a.partId, s.accessories.includes(a.id));
  for (const g of config.variantGroups) {
    const chosen = s.variants[g.id] ?? g.defaultOptionId;
    for (const o of g.options) optional.set(o.partId, o.id === chosen);
  }
  return new Set(config.parts.filter((p) => optional.get(p.id) ?? true).map((p) => p.id));
}

/** Piezas que se dibujan. */
export function visibleParts(config: VehicleConfig, s: VisibilityInput): Set<string> {
  const available = availableParts(config, s);
  if (s.isolated) return new Set(available.has(s.isolated) ? [s.isolated] : []);
  for (const h of s.hidden) available.delete(h);
  return available;
}
