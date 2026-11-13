import { useEffect, useState } from 'react';
import { Move3d } from 'lucide-react';
import { useShowroom } from '../state/store';

const KEY = 'jac-showroom:ayuda-vista';
const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

/** Ayuda inicial: aparece una vez por sesión y se va al primer gesto, al cambiar de vista o a los 12 s. */
export function Hint() {
  const ready = useShowroom((s) => s.status === 'ready');
  const toast = useShowroom((s) => s.toast);
  const [state, setState] = useState<'hidden' | 'shown' | 'gone'>(() => {
    try {
      return sessionStorage.getItem(KEY) ? 'gone' : 'hidden';
    } catch {
      return 'hidden';
    }
  });

  useEffect(() => {
    if (!ready || state !== 'hidden') return;
    const id = window.setTimeout(() => setState('shown'), 400);
    return () => clearTimeout(id);
  }, [ready, state]);

  useEffect(() => {
    if (state !== 'shown') return;
    const dismiss = () => {
      setState('gone');
      try {
        sessionStorage.setItem(KEY, '1');
      } catch {
        /* sin almacenamiento de sesión */
      }
    };
    const canvas = document.querySelector('.stage canvas');
    const evs = ['pointerdown', 'wheel', 'touchstart', 'keydown'] as const;
    evs.forEach((e) => canvas?.addEventListener(e, dismiss, { passive: true }));
    const unsub = useShowroom.subscribe((s, p) => s.camera !== p.camera && s.camera?.kind === 'view' && dismiss());
    const timer = window.setTimeout(dismiss, 12000);
    return () => {
      evs.forEach((e) => canvas?.removeEventListener(e, dismiss));
      unsub();
      clearTimeout(timer);
    };
  }, [state]);

  if (state !== 'shown' || toast) return null;
  return (
    <div className="hint" role="status" aria-live="polite">
      <Move3d size={16} strokeWidth={1.5} aria-hidden="true" />
      <span>{coarse ? 'Arrastra para girar · Pellizca para acercarte' : 'Arrastra para girar · Usa la rueda para acercarte'}</span>
    </div>
  );
}
