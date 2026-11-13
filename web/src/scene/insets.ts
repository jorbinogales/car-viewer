// Zona del visor tapada por la UI (px CSS). En móvil la escriben la tira de
// vistas (arriba) y el bottom sheet (abajo); la cámara la usa para encuadrar
// en el área libre. Mutable a propósito: el sheet la actualiza por frame al
// arrastrar sin pasar por React.
export const insets = { top: 0, bottom: 0 };
let listener: (() => void) | null = null;

export function setInsets(top: number, bottom: number) {
  if (insets.top === top && insets.bottom === bottom) return;
  insets.top = top;
  insets.bottom = bottom;
  listener?.();
}

export function onInsetsChange(fn: (() => void) | null) {
  listener = fn;
}
