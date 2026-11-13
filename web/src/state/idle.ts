import { JAC6_CONFIG } from '../config/jac6';
import { createIdleRotation } from '../logic/idleRotation';

/** Única instancia: el store la alimenta con las acciones de UI y la cámara la consulta. */
export const idle = createIdleRotation(JAC6_CONFIG.idleRotation.idleMs);
