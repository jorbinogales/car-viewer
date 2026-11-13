import { Copy, MonitorOff, PackageX, RotateCw, TriangleAlert } from 'lucide-react';
import { CONFIG, useShowroom } from '../state/store';
import { assetDiskPath, assetUrl } from '../scene/loader';
import { BrandMark } from './Header';
import { Button } from './controls';

const MB = (b: number) => (b / 1_048_576).toLocaleString('es', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Carga, error, modelo ausente y sin WebGL. Nunca deja el visor vacío. */
export function StateScreens() {
  const status = useShowroom((s) => s.status);
  const progress = useShowroom((s) => s.progress);
  const loadError = useShowroom((s) => s.loadError);
  const retry = useShowroom((s) => s.retry);
  const showToast = useShowroom((s) => s.showToast);

  if (status === 'ready') return null;

  if (status === 'loading' || status === 'composing') {
    const pct = progress.total && status === 'loading' ? Math.min(100, Math.round((progress.loaded / progress.total) * 100)) : null;
    return (
      <div className="state-screen">
        <div className="loading">
          <BrandMark />
          <p className="loading-title">Cargando {CONFIG.name} {CONFIG.version}</p>
          {pct !== null ? (
            <>
              <div className="progress" role="progressbar" aria-label="Cargando el modelo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
                <span className="progress-fill" style={{ transform: `scaleX(${pct / 100})` }} />
              </div>
              <p className="loading-pct">{pct} %</p>
              <p className="loading-bytes">{MB(progress.loaded)} MB de {MB(progress.total!)} MB</p>
            </>
          ) : (
            <>
              <div className="progress is-indeterminate" role="progressbar" aria-label="Cargando el modelo" aria-busy="true">
                <span className="progress-fill" />
              </div>
              <p className="loading-pct">{status === 'composing' ? 'Preparando escena…' : 'Cargando…'}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (status === 'nowebgl' || status === 'contextlost') {
    const lost = status === 'contextlost';
    return (
      <div className="state-screen">
        <div className="state-card" role="alert">
          <MonitorOff size={28} strokeWidth={1.5} aria-hidden="true" />
          <h2>{lost ? 'Se perdió la vista 3D' : 'Tu navegador no puede mostrar el modelo 3D'}</h2>
          <p>
            {lost
              ? 'El navegador detuvo la aceleración gráfica. Vuelve a intentarlo.'
              : 'Este visor necesita WebGL. Activa la aceleración por hardware en tu navegador o prueba con una versión actualizada de Chrome, Edge, Firefox o Safari.'}
          </p>
          <Button variant="primary" icon={RotateCw} onClick={retry}>
            {lost ? 'Reintentar' : 'Volver a comprobar'}
          </Button>
        </div>
      </div>
    );
  }

  const missing = status === 'missing';
  const path = assetDiskPath(CONFIG.assets[0].url);
  return (
    <div className="state-screen">
      <div className="state-card" role="alert">
        {missing ? <PackageX size={28} strokeWidth={1.5} aria-hidden="true" /> : <TriangleAlert size={28} strokeWidth={1.5} aria-hidden="true" />}
        <h2>{missing ? 'Falta el archivo del modelo' : 'No se pudo cargar el modelo'}</h2>
        <p>
          {missing
            ? 'No encontramos el modelo 3D en la ruta esperada. Colócalo aquí y vuelve a intentarlo:'
            : 'Ocurrió un problema al descargar o leer el archivo 3D. Puede faltar o ser incompatible. Revisa el archivo y tu conexión, e inténtalo de nuevo:'}
        </p>
        <div className="path-block">
          <code>{path}</code>
          <Button
            icon={Copy}
            className="btn-small"
            onClick={() => navigator.clipboard?.writeText(path).then(() => showToast('Ruta copiada'), () => {})}
          >
            Copiar ruta
          </Button>
        </div>
        <Button variant="primary" icon={RotateCw} onClick={retry} className="btn-block-m">Reintentar</Button>
        <details className="tech-details">
          <summary>Detalles técnicos</summary>
          <p>{loadError?.message}</p>
          <p>URL: {loadError?.url ?? assetUrl(CONFIG.assets[0].url)}</p>
        </details>
      </div>
    </div>
  );
}
