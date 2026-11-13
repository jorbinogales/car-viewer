import { useCallback, useEffect, useLayoutEffect, useRef, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from 'react';
import { Boxes, Compass, SlidersHorizontal } from 'lucide-react';
import { CONFIG, useShowroom, type SheetState, type Tab } from '../state/store';
import { setInsets } from '../scene/insets';
import { ExploreTab } from './ExploreTab';
import { CustomizeTab } from './CustomizeTab';
import { PartsTab } from './PartsTab';

const SHEET_QUERY = '(max-width: 1023.98px) and (min-height: 501px), (max-width: 1023.98px) and (orientation: portrait)';
const mq = typeof matchMedia === 'function' ? matchMedia(SHEET_QUERY) : null;
const subscribe = (cb: () => void) => {
  mq?.addEventListener('change', cb);
  return () => mq?.removeEventListener('change', cb);
};
export const useSheetMode = () => useSyncExternalStore(subscribe, () => mq?.matches ?? false);

const TABS: { id: Tab; label: string; icon: typeof Compass }[] = [
  { id: 'explorar', label: 'Explorar', icon: Compass },
  { id: 'personalizar', label: 'Personalizar', icon: SlidersHorizontal },
  { id: 'piezas', label: 'Piezas', icon: Boxes },
];
const ORDER: SheetState[] = ['collapsed', 'half', 'full'];
const CHIPS_INSET = 52 + 8;
const VIEWBAR_INSET = 48 + 24;

function safeAreaBottom(): number {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;bottom:0;height:0;padding-bottom:env(safe-area-inset-bottom);visibility:hidden';
  document.body.appendChild(probe);
  const v = probe.getBoundingClientRect().height;
  probe.remove();
  return v;
}

/** Atribución del modelo 3D (licencias CC BY). */
function Credits({ credits: c }: { credits: NonNullable<typeof CONFIG.credits> }) {
  return (
    <p className="credits">
      Modelo 3D «<a href={c.url} target="_blank" rel="noopener noreferrer">{c.title}</a>» de {c.author}, bajo{' '}
      <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer">{c.license}</a>.
    </p>
  );
}

/** Panel lateral (escritorio) o bottom sheet de tres estados (móvil). */
export function Panel() {
  const tab = useShowroom((s) => s.tab);
  const setTab = useShowroom((s) => s.setTab);
  const sheet = useShowroom((s) => s.sheet);
  const setSheet = useShowroom((s) => s.setSheet);
  const ready = useShowroom((s) => s.status === 'ready');
  const loading = useShowroom((s) => s.status === 'loading' || s.status === 'composing');
  const isSheet = useSheetMode();

  const ref = useRef<HTMLElement>(null);
  const drag = useRef<{ y0: number; base: number; last: number; lastT: number; v: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  const visiblePx = useCallback((state: SheetState) => {
    const h = window.innerHeight;
    return state === 'collapsed' ? 72 + safeAreaBottom() : state === 'half' ? 0.46 * h : 0.66 * h;
  }, []);

  const place = useCallback((visible: number, animate: boolean) => {
    const el = ref.current;
    if (!el) return;
    el.classList.toggle('is-dragging', !animate);
    // El contenido ocupa solo la parte visible (la ficha fija queda en pantalla).
    if (animate) el.style.setProperty('--sheet-visible', `${Math.round(visible)}px`);
    el.style.transform = `translateY(${Math.round(0.66 * window.innerHeight - visible)}px)`;
    setInsets(CHIPS_INSET, visible + 8);
  }, []);

  useLayoutEffect(() => {
    if (!isSheet) {
      if (ref.current) ref.current.style.transform = '';
      setInsets(0, VIEWBAR_INSET); // escritorio: el coche se encuadra por encima de la barra de vistas
      return;
    }
    place(visiblePx(sheet), true);
    const onResize = () => place(visiblePx(useShowroom.getState().sheet), false);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isSheet, sheet, place, visiblePx]);

  // Arrastre del sheet: solo desde el asa y la fila de pestañas (touch-action: none).
  const onPointerDown = (e: PointerEvent) => {
    if (!isSheet) return;
    const base = visiblePx(sheet);
    drag.current = { y0: e.clientY, base, last: e.clientY, lastT: performance.now(), v: 0, moved: false };
    suppressClick.current = false;
  };
  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.abs(e.clientY - d.y0) < 6) return;
    if (!d.moved) (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    d.moved = true;
    const now = performance.now();
    d.v = (e.clientY - d.last) / Math.max(1, now - d.lastT);
    d.last = e.clientY;
    d.lastT = now;
    const min = visiblePx('collapsed');
    const max = visiblePx('full');
    place(Math.min(max, Math.max(min, d.base - (e.clientY - d.y0))), false);
  };
  const onPointerUp = (e: PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    suppressClick.current = true;
    const visible = d.base - (e.clientY - d.y0);
    let target: SheetState;
    if (Math.abs(d.v) > 0.5) {
      const i = ORDER.indexOf(sheet);
      target = ORDER[Math.min(2, Math.max(0, i + (d.v < 0 ? 1 : -1)))];
    } else {
      target = ORDER.reduce((a, b) => (Math.abs(visiblePx(b) - visible) < Math.abs(visiblePx(a) - visible) ? b : a));
    }
    if (target === sheet) place(visiblePx(sheet), true);
    else setSheet(target);
  };

  const onTabKey = (e: KeyboardEvent) => {
    const i = TABS.findIndex((t) => t.id === tab);
    const j = e.key === 'ArrowRight' ? (i + 1) % 3 : e.key === 'ArrowLeft' ? (i + 2) % 3 : e.key === 'Home' ? 0 : e.key === 'End' ? 2 : -1;
    if (j < 0 || !ready) return;
    e.preventDefault();
    setTab(TABS[j].id);
    document.getElementById(`tab-${TABS[j].id}`)?.focus();
  };

  // Seleccionar en el 3D abre Piezas: llevar la fila a la vista.
  useEffect(() => useShowroom.subscribe((s, p) => {
    if (s.selected && s.selected !== p.selected) {
      requestAnimationFrame(() => document.querySelector(`[data-part-row="${s.selected}"]`)?.scrollIntoView({ block: 'nearest' }));
    }
  }), []);

  const collapsed = isSheet && sheet === 'collapsed';

  return (
    <aside ref={ref} className={`panel${isSheet ? ' is-sheet' : ''}`} data-sheet={isSheet ? sheet : undefined} aria-label="Panel del configurador">
      <div
        className="sheet-grip"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (drag.current = null)}
        onClickCapture={(e) => {
          if (suppressClick.current) {
            e.stopPropagation();
            e.preventDefault();
            suppressClick.current = false;
          }
        }}
      >
        {isSheet && (
          <button
            type="button"
            className="sheet-handle"
            aria-label="Cambiar tamaño del panel"
            aria-expanded={sheet !== 'collapsed'}
            onClick={() => setSheet(ORDER[(ORDER.indexOf(sheet) + 1) % 3])}
          >
            <span aria-hidden="true" />
          </button>
        )}
        <div className="tabs" role="tablist" aria-label="Secciones" onKeyDown={onTabKey}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`tab-${id}`}
              type="button"
              role="tab"
              aria-selected={tab === id}
              aria-controls={`panel-${id}`}
              aria-disabled={!ready || undefined}
              tabIndex={tab === id ? 0 : -1}
              className="tab"
              onClick={() => ready && setTab(id)}
            >
              <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-body" inert={collapsed}>
        {!ready ? (
          loading ? (
            <div className="panel-scroll" aria-hidden="true">
              <div className="skeleton-list">{Array.from({ length: 5 }, (_, i) => <span key={i} className="skeleton" />)}</div>
            </div>
          ) : (
            <p className="panel-empty">Los controles estarán disponibles cuando el modelo cargue.</p>
          )
        ) : (
          TABS.map(({ id }) => (
            <div key={id} id={`panel-${id}`} role="tabpanel" aria-labelledby={`tab-${id}`} hidden={tab !== id} className="tabpanel">
              {id === 'explorar' && <ExploreTab />}
              {id === 'personalizar' && <CustomizeTab />}
              {id === 'piezas' && <PartsTab />}
            </div>
          ))
        )}
        {CONFIG.credits && <Credits credits={CONFIG.credits} />}
      </div>
    </aside>
  );
}
