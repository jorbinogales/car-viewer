import { Check, DoorClosed, DoorOpen, Expand, Shrink } from 'lucide-react';
import { CONFIG, useShowroom } from '../state/store';
import { Button, RadioGroup, SectionLabel } from './controls';
import { OpeningIcon, hasOpeningIcon } from './icons';

export function TabHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="tab-header">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

/** "Puerta delantera izquierda" -> "Delantera izquierda" (la sección ya dice "puertas"). */
const shortName = (name: string) => {
  const s = name.replace(/^Puerta /, '');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export function ExploreTab() {
  const openIds = useShowroom((s) => s.openings);
  const setOpening = useShowroom((s) => s.setOpening);
  const setOpenings = useShowroom((s) => s.setOpenings);
  const modelOpenings = useShowroom((s) => s.model.openingIds);
  const exploded = useShowroom((s) => s.explode > 0);
  const setExplode = useShowroom((s) => s.setExplode);
  const hasExplode = useShowroom((s) => s.model.hasExplode);
  const paintId = useShowroom((s) => s.paintId);
  const setPaint = useShowroom((s) => s.setPaint);
  const modelPaintHex = useShowroom((s) => s.model.paintHex);
  const paint = CONFIG.paints.find((p) => p.id === paintId) ?? CONFIG.paints[0];

  // Solo lo que el GLB trae de verdad.
  const defs = CONFIG.openings.filter((o) => modelOpenings.includes(o.id));
  const ids = defs.map((o) => o.id);
  const openCount = ids.filter((id) => openIds.includes(id)).length;

  return (
    <div className="panel-scroll">
      <TabHeader title="Explorar" subtitle="Cambia el color, abre las puertas o desarma el vehículo." />
      <section className="panel-section">
        <SectionLabel>Pintura</SectionLabel>
        <RadioGroup
          label="Pintura"
          options={CONFIG.paints}
          value={paintId}
          onChange={setPaint}
          className="swatch-grid"
          itemClassName="swatch"
          render={(p, sel) => (
            <>
              <span className="swatch-dot" style={{ background: CONFIG.paints.find((x) => x.id === p.id)?.hex ?? modelPaintHex ?? '#d4d4d4' }} />
              {sel && <span className="swatch-badge" aria-hidden="true"><Check size={10} strokeWidth={2.5} /></span>}
            </>
          )}
        />
        <p className="swatch-name" aria-live="polite">Color: {paint.name}</p>
      </section>
      {defs.length === 0 ? (
        <p className="inline-notice">Este modelo no trae puertas ni portón articulados.</p>
      ) : (
        <section className="panel-section openings" aria-label="Puertas y portón">
          <div className="opening-grid">
            {defs.map((o) => {
              const open = openIds.includes(o.id);
              const label = `${open ? 'Cerrar' : 'Abrir'} ${o.name.toLowerCase()}`;
              return (
                <button key={o.id} type="button" className={`opening-btn${open ? ' is-open' : ''}`} aria-pressed={open} aria-label={label} title={label} onClick={() => setOpening(o.id, !open)}>
                  {hasOpeningIcon(o.id) && <OpeningIcon openingId={o.id} open={open} size={36} strokeWidth={1.25} className="opening-icon" />}
                  <span className="opening-text">
                    <span className="opening-name">{shortName(o.name)}</span>
                    <span className="opening-state" aria-hidden="true">{open ? 'Abierta' : 'Cerrada'}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="opening-actions">
            <Button icon={DoorOpen} onClick={() => setOpenings([...new Set([...openIds, ...ids])])} disabled={openCount === ids.length}>Abrir todo</Button>
            <Button icon={DoorClosed} onClick={() => setOpenings(openIds.filter((id) => !ids.includes(id)))} disabled={openCount === 0}>Cerrar todo</Button>
          </div>
        </section>
      )}
      {hasExplode && (
        <div className="explode-action">
          <Button icon={exploded ? Shrink : Expand} onClick={() => setExplode(exploded ? 0 : 100)}>{exploded ? 'Armar' : 'Desarmar'}</Button>
        </div>
      )}
    </div>
  );
}
