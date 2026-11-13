import { CONFIG, useShowroom } from '../state/store';
import { ViewIcon, hasViewIcon } from './icons';

/**
 * Barra de vistas: única vía para cambiar de vista (escritorio: barra flotante;
 * móvil: tira de botones bajo el header). Solo iconos; el nombre va en
 * `aria-label`, `title` y un tooltip propio. Fuente: `activeView`.
 */
export function ViewBar() {
  const activeView = useShowroom((s) => s.activeView);
  const goToView = useShowroom((s) => s.goToView);
  const ready = useShowroom((s) => s.status === 'ready');

  return (
    <div className="viewbar" role="toolbar" aria-label="Vistas de cámara" aria-disabled={!ready || undefined}>
      {CONFIG.views.map((v) => (
        <button
          key={v.id}
          type="button"
          className="viewbar-btn"
          aria-pressed={activeView === v.id}
          aria-label={v.name}
          title={v.name}
          data-tip={v.name}
          disabled={!ready}
          onClick={() => goToView(v.id)}
        >
          {hasViewIcon(v.id) ? <ViewIcon viewId={v.id} /> : <span className="viewbar-text">{v.shortName}</span>}
        </button>
      ))}
    </div>
  );
}
