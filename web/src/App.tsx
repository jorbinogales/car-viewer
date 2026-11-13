import { useShowroom } from './state/store';
import { Viewer } from './scene/Viewer';
import { Header } from './ui/Header';
import { Panel } from './ui/Panel';
import { ViewBar } from './ui/ViewBar';
import { Hint } from './ui/Hint';
import { Toast } from './ui/Toast';
import { StateScreens } from './ui/StateScreens';
import { SHOW_INSPECTOR, DevInspector } from './ui/DevInspector';

export function App() {
  const status = useShowroom((s) => s.status);
  // La barra también se ve en Interior: es la única forma de salir de la cabina.
  const showBar = status === 'ready';

  return (
    <div className="app">
      <Header />
      <main className="main">
        <section className="stage" aria-label="Visor del vehículo">
          <Viewer />
          {showBar && <ViewBar />}
          <Hint />
          <StateScreens />
        </section>
        <Panel />
      </main>
      <Toast />
      {SHOW_INSPECTOR && <DevInspector />}
    </div>
  );
}
