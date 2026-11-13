import { useEffect, useId, useState } from 'react';
import { Maximize, Minimize, RotateCcw } from 'lucide-react';
import { CONFIG, useShowroom } from '../state/store';
import { VEHICLES } from '../config/vehicles';
import { switchVehicle } from '../logic/vehicle';
import { Button } from './controls';

/** Selector de vehículo (select nativo: teclado y lectores de pantalla gratis). Solo con 2 o más. */
function VehiclePicker() {
  const id = useId();
  if (VEHICLES.length < 2) return null;
  return (
    <div className="vehicle-picker">
      <label className="vehicle-picker-label" htmlFor={id}>Vehículo</label>
      <select id={id} className="vehicle-select" value={CONFIG.id} onChange={(e) => switchVehicle(e.target.value)}>
        {VEHICLES.map((v) => (
          <option key={v.id} value={v.id}>{v.name} {v.version}</option>
        ))}
      </select>
    </div>
  );
}

/** Marca provisional. Cuando exista el SVG oficial, sustituir solo este componente. */
export function BrandMark() {
  return <span className="brand-mark" aria-label={CONFIG.brand}>{CONFIG.brand}</span>;
}

export function Header() {
  const ready = useShowroom((s) => s.status === 'ready');
  const resetAll = useShowroom((s) => s.resetAll);
  const [full, setFull] = useState(false);
  const canFullscreen = typeof document !== 'undefined' && document.fullscreenEnabled;

  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);

  const toggleFull = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {});
  const fullLabel = full ? 'Salir de pantalla completa' : 'Pantalla completa';

  return (
    <header className={`header${VEHICLES.length > 1 ? ' has-picker' : ''}`}>
      <div className="header-brand">
        <BrandMark />
        <span className="header-divider" aria-hidden="true" />
        <h1 className="vehicle-name">
          {CONFIG.name} <span className="vehicle-version">{CONFIG.version}</span>
        </h1>
      </div>
      <div className="header-actions">
        <VehiclePicker />
        <Button icon={RotateCcw} onClick={resetAll} disabled={!ready} aria-label="Restablecer" title="Restablecer">
          <span className="btn-text">Restablecer</span>
        </Button>
        {canFullscreen && (
          <Button icon={full ? Minimize : Maximize} onClick={toggleFull} aria-label={fullLabel} title={fullLabel}>
            <span className="btn-text">{fullLabel}</span>
          </Button>
        )}
      </div>
    </header>
  );
}
