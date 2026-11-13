// Registro de vehículos del visor. Para añadir uno, ver "Añadir un vehículo" en el README.
// El JAC 6 no se publica (su modelo no tiene licencia): su config sigue en ./jac6.ts y su GLB
// en ../../../modelos_privados/. Para volver a activarlo, devuelve el GLB a public/models/ y
// añade JAC6_CONFIG a esta lista.
import type { VehicleConfig } from './types';
import { VW_TIGUAN_CONFIG } from './vw-tiguan';

export const VEHICLES: VehicleConfig[] = [VW_TIGUAN_CONFIG];

export const DEFAULT_VEHICLE_ID = VW_TIGUAN_CONFIG.id;
