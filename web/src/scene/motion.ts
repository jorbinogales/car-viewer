const query = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

/** 0 con `prefers-reduced-motion: reduce`, 1 en otro caso (equivale a --motion-scale). */
export const motionScale = () => (query?.matches ? 0 : 1);
