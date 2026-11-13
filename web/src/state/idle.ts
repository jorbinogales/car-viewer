import { ACTIVE_VEHICLE } from '../config/active';
import { createIdleRotation } from '../logic/idleRotation';

/** Única instancia: el store la alimenta con las acciones de UI y la cámara la consulta. */
export const idle = createIdleRotation(ACTIVE_VEHICLE.idleRotation.idleMs);
