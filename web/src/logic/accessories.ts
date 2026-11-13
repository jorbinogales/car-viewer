import type { AccessoryDef } from '../config/types';

/**
 * Activa o desactiva un accesorio respetando dependencias (`requires`) y
 * exclusividad (`exclusiveGroup`). Devuelve la nueva lista en orden de config.
 * - Activar: activa también lo que requiere y desactiva sus excluyentes.
 * - Desactivar: desactiva también lo que depende de él.
 */
export function toggleAccessory(defs: AccessoryDef[], active: readonly string[], id: string, on: boolean): string[] {
  const byId = new Map(defs.map((d) => [d.id, d]));
  const set = new Set(active.filter((a) => byId.has(a)));
  if (!byId.has(id)) return order(defs, set);

  const remove = (target: string) => {
    if (!set.delete(target)) return;
    for (const d of defs) if (d.requires?.includes(target)) remove(d.id);
  };
  const add = (target: string, seen = new Set<string>()) => {
    const def = byId.get(target);
    if (!def || seen.has(target)) return;
    seen.add(target);
    if (def.exclusiveGroup) {
      for (const d of defs) if (d.id !== target && d.exclusiveGroup === def.exclusiveGroup) remove(d.id);
    }
    set.add(target);
    for (const r of def.requires ?? []) add(r, seen);
  };

  if (on) add(id);
  else remove(id);
  return order(defs, set);
}

/** Lleva una lista arbitraria (p. ej. guardada) a un estado coherente. */
export function normalizeAccessories(defs: AccessoryDef[], list: readonly string[]): string[] {
  return list.reduce<string[]>((acc, id) => toggleAccessory(defs, acc, id, true), []);
}

/** Accesorios que se activan automáticamente junto a `id`. */
export function requiredBy(defs: AccessoryDef[], id: string): AccessoryDef[] {
  const def = defs.find((d) => d.id === id);
  return (def?.requires ?? []).map((r) => defs.find((d) => d.id === r)).filter((d): d is AccessoryDef => !!d);
}

function order(defs: AccessoryDef[], set: Set<string>): string[] {
  return defs.filter((d) => set.has(d.id)).map((d) => d.id);
}
