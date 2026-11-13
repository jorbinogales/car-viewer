import { useState } from 'react';
import { Check, ChevronDown, Crosshair, Eye, EyeOff, Focus, X } from 'lucide-react';
import { CONFIG, useShowroom } from '../state/store';
import { availableParts } from '../logic/visibility';
import type { PartDef } from '../config/types';
import { Button, ICON } from './controls';
import { TabHeader } from './ExploreTab';

const partById = new Map(CONFIG.parts.map((p) => [p.id, p]));

function useAvailable(): Set<string> {
  const accessories = useShowroom((s) => s.accessories);
  const variants = useShowroom((s) => s.variants);
  const modelParts = useShowroom((s) => s.model.partIds);
  const av = availableParts(CONFIG, { accessories, variants });
  return new Set([...av].filter((id) => modelParts.includes(id)));
}

function PartRow({ part }: { part: PartDef }) {
  const selected = useShowroom((s) => s.selected === part.id);
  const hidden = useShowroom((s) => s.hidden.includes(part.id));
  const isolated = useShowroom((s) => s.isolated);
  const select = useShowroom((s) => s.select);
  const toggleHidden = useShowroom((s) => s.toggleHidden);
  const blocked = isolated !== null && isolated !== part.id;
  const shownHidden = hidden || blocked;

  return (
    <li
      className={`part-row${selected ? ' is-selected' : ''}${shownHidden ? ' is-hidden' : ''}${blocked ? ' is-disabled' : ''}`}
      data-part-row={part.id}
    >
      <button type="button" className="part-row-main" aria-pressed={selected} onClick={() => select(selected ? null : part.id)}>
        <span className="check-slot" aria-hidden="true">{selected && <Check size={18} strokeWidth={2} />}</span>
        <span className="part-name">{part.name}{shownHidden && <span className="sr-only"> (oculta)</span>}</span>
      </button>
      <button
        type="button"
        className="part-eye"
        aria-pressed={hidden}
        aria-label={hidden ? `Mostrar ${part.name}` : `Ocultar ${part.name}`}
        title={blocked ? 'Quita el aislamiento para mostrarla' : hidden ? `Mostrar ${part.name}` : `Ocultar ${part.name}`}
        disabled={blocked}
        onClick={() => toggleHidden(part.id)}
      >
        {shownHidden ? <EyeOff {...ICON} /> : <Eye {...ICON} />}
      </button>
    </li>
  );
}

function GroupList({ available }: { available: Set<string> }) {
  const [closed, setClosed] = useState<string[]>([]);
  return (
    <>
      {CONFIG.partGroups.map((g) => {
        const parts = CONFIG.parts.filter((p) => p.group === g.id && available.has(p.id));
        if (!parts.length) return null;
        const open = !closed.includes(g.id);
        return (
          <section key={g.id} className="part-group">
            <button
              type="button"
              className="part-group-head"
              aria-expanded={open}
              onClick={() => setClosed((c) => (open ? [...c, g.id] : c.filter((x) => x !== g.id)))}
            >
              <span className="section-label">{g.name}</span>
              <span className="part-group-count">{parts.length}</span>
              <ChevronDown {...ICON} size={18} className="chevron" />
            </button>
            {open && <ul className="part-list">{parts.map((p) => <PartRow key={p.id} part={p} />)}</ul>}
          </section>
        );
      })}
    </>
  );
}

function PartCard() {
  const selected = useShowroom((s) => s.selected);
  const isolated = useShowroom((s) => s.isolated);
  const select = useShowroom((s) => s.select);
  const toggleIsolate = useShowroom((s) => s.toggleIsolate);
  const focusPart = useShowroom((s) => s.focusPart);
  const part = selected ? partById.get(selected) : undefined;
  if (!part) return null;
  const isIsolated = isolated === part.id;

  return (
    <section className="part-card" aria-label={`Pieza seleccionada: ${part.name}`}>
      <div className="part-card-head">
        <h3>{part.name}</h3>
        <button type="button" className="btn-close" aria-label="Cerrar ficha" title="Cerrar ficha" onClick={() => select(null)}>
          <X {...ICON} />
        </button>
      </div>
      <p className="part-card-desc">{part.description}</p>
      <div className="part-card-actions">
        <Button variant="primary" icon={Crosshair} onClick={() => focusPart(part.id)}>Enfocar</Button>
        <Button icon={isIsolated ? Check : Focus} aria-pressed={isIsolated} className={isIsolated ? 'is-on' : ''} onClick={() => toggleIsolate(part.id)}>
          Aislar
        </Button>
      </div>
    </section>
  );
}

export function PartsTab() {
  const hidden = useShowroom((s) => s.hidden);
  const isolated = useShowroom((s) => s.isolated);
  const showAll = useShowroom((s) => s.showAll);
  const available = useAvailable();

  if (available.size <= 1) {
    return (
      <div className="panel-scroll">
        <TabHeader title="Piezas" subtitle="Selecciona, oculta o aísla cada pieza." />
        <p className="inline-notice">
          Este modelo no tiene piezas separadas. La selección independiente requiere preparar el modelo con nodos con nombre por pieza.
        </p>
      </div>
    );
  }

  const hiddenCount = hidden.filter((h) => available.has(h)).length;
  const summary = isolated
    ? `Aislando: ${partById.get(isolated)?.name ?? ''}`
    : hiddenCount
      ? `${hiddenCount} ${hiddenCount === 1 ? 'pieza oculta' : 'piezas ocultas'}`
      : 'Todas las piezas visibles';

  return (
    <div className="parts-tab">
      <div className="panel-scroll">
        <TabHeader title="Piezas" subtitle="Selecciona, oculta o aísla cada pieza." />
        <div className="parts-summary">
          <span>{summary}</span>
          <Button icon={Eye} className="btn-small" onClick={showAll} disabled={!hiddenCount && !isolated}>Mostrar todo</Button>
        </div>
        <GroupList available={available} />
      </div>
      <PartCard />
    </div>
  );
}
