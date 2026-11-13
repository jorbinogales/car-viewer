import type { VehicleConfig } from '../config/types';

/** Última elección del usuario. */
export const VEHICLE_KEY = 'car-viewer:vehiculo';
export const VEHICLE_PARAM = 'vehiculo';

/**
 * Vehículo activo: `?vehiculo=<id>` → último guardado → predeterminado.
 * Un id desconocido en cualquiera de los dos primeros cae al siguiente.
 */
export function resolveVehicle(
  vehicles: VehicleConfig[], defaultId: string, search: string, saved: string | null,
): VehicleConfig {
  const find = (id: string | null) => (id ? vehicles.find((v) => v.id === id) : undefined);
  return find(new URLSearchParams(search).get(VEHICLE_PARAM)) ?? find(saved) ?? find(defaultId) ?? vehicles[0];
}

/** Guarda la elección, pone `?vehiculo=` en la URL (conserva el resto) y recarga la página. */
export function switchVehicle(id: string): void {
  try {
    localStorage.setItem(VEHICLE_KEY, id);
  } catch {
    /* sin almacenamiento: la URL basta para esta sesión */
  }
  const url = new URL(location.href);
  url.searchParams.set(VEHICLE_PARAM, id);
  location.assign(url);
}
