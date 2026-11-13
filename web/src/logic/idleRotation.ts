// Rotación automática por inactividad: máquina de estados pura con reloj inyectable.
// El vehículo arranca girando; cualquier acción del usuario la detiene en el acto y,
// tras `idleMs` sin acciones, vuelve a girar (salvo en interior o con movimiento reducido).

export interface IdleContext {
  /** Vista interior: nunca gira ni se reanuda. */
  interior: boolean;
  /** `prefers-reduced-motion: reduce`: nunca gira ni se reanuda. */
  reducedMotion: boolean;
  /** Transición de cámara o arrastre en curso: no gira; la cuenta de inactividad empieza al terminar. */
  busy: boolean;
}

export interface IdleRotation {
  /** Acción del usuario: detiene la rotación y reinicia la cuenta de inactividad. */
  act(): void;
  /** Estado inicial: gira (restablecer). */
  reset(): void;
  /** Evalúa el reloj. Devuelve si el vehículo debe girar ahora. */
  tick(ctx: IdleContext): boolean;
  /** Ms hasta la reanudación, o `null` si no hay nada que esperar (ya gira o está bloqueada). */
  pendingMs(ctx: IdleContext): number | null;
  /** Avisa de cada `act`/`reset`. Devuelve la función para darse de baja. */
  subscribe(fn: () => void): () => void;
}

export function createIdleRotation(idleMs: number, now: () => number = () => performance.now()): IdleRotation {
  let rotating = true;
  let lastAction = now();
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((f) => f());
  const blocked = (c: IdleContext) => c.interior || c.reducedMotion;

  return {
    act() {
      rotating = false;
      lastAction = now();
      notify();
    },
    reset() {
      rotating = true;
      lastAction = now();
      notify();
    },
    tick(c) {
      if (blocked(c)) return false;
      if (c.busy) {
        if (!rotating) lastAction = now();
        return false;
      }
      if (!rotating && now() - lastAction >= idleMs) rotating = true;
      return rotating;
    },
    pendingMs(c) {
      if (rotating || blocked(c) || c.busy) return null;
      return Math.max(0, idleMs - (now() - lastAction));
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => void listeners.delete(fn);
    },
  };
}

/**
 * Velocidad angular (rad/s). Parar es inmediato; arrancar sube linealmente hasta
 * `max` en `rampMs`, para que la reanudación no dé un tirón.
 */
export function rampSpeed(current: number, rotating: boolean, dtSec: number, max: number, rampMs: number): number {
  if (!rotating) return 0;
  return Math.min(max, current + (max * dtSec) / (rampMs / 1000));
}
