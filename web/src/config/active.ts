// Vehículo activo, resuelto una sola vez al arrancar (cambiar de vehículo recarga la página).
import { resolveVehicle, VEHICLE_KEY } from '../logic/vehicle';
import { DEFAULT_VEHICLE_ID, VEHICLES } from './vehicles';

function savedVehicleId(): string | null {
  try {
    return localStorage.getItem(VEHICLE_KEY);
  } catch {
    return null;
  }
}

export const ACTIVE_VEHICLE = resolveVehicle(VEHICLES, DEFAULT_VEHICLE_ID, location.search, savedVehicleId());
