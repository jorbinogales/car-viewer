import { create } from 'zustand';
import { ACTIVE_VEHICLE } from '../config/active';
import { toggleAccessory } from '../logic/accessories';
import { idle } from './idle';
import { defaultConfigurable, loadSaved, save, type ConfigurableState } from '../logic/persistence';

export const CONFIG = ACTIVE_VEHICLE;

export type LoadStatus = 'loading' | 'composing' | 'ready' | 'error' | 'missing' | 'nowebgl' | 'contextlost';
export type Tab = 'explorar' | 'personalizar' | 'piezas';
export type SheetState = 'collapsed' | 'half' | 'full';

export interface ModelCapabilities {
  partIds: string[];
  openingIds: string[];
  hasExplode: boolean;
  /** Color original de la pintura (sRGB) para su muestra. */
  paintHex: string | null;
}

export type CameraCommand =
  | { kind: 'view'; viewId: string; seq: number; instant?: boolean }
  | { kind: 'focus'; partId: string; seq: number }
  | { kind: 'intro'; seq: number }
  | { kind: 'reframe'; seq: number };

interface State extends ConfigurableState {
  status: LoadStatus;
  progress: { loaded: number; total: number | null };
  loadError: { message: string; url: string } | null;
  loadAttempt: number;
  /** Lo que el GLB cargado trae de verdad (se rellena al componer). La UI solo ofrece esto. */
  model: ModelCapabilities;

  tab: Tab;
  sheet: SheetState;

  activeView: string | null;
  interior: boolean;
  camera: CameraCommand | null;
  /** Solo lectura: la cámara lo escribe mientras el vehículo gira. La rotación no es una preferencia. */
  autoRotate: boolean;

  openings: string[];
  selected: string | null;
  isolated: string | null;
  toast: { text: string; seq: number } | null;
  /** Se incrementa cuando la geometría visible cambia y hay que rehacer sombras. */
  shadowVersion: number;
}

interface Actions {
  setStatus(status: LoadStatus, extra?: Partial<Pick<State, 'loadError'>>): void;
  setProgress(loaded: number, total: number | null): void;
  retry(): void;
  modelComposed(model: ModelCapabilities): void;

  setTab(tab: Tab): void;
  setSheet(sheet: SheetState): void;

  goToView(viewId: string): void;
  cameraMovedByUser(): void;
  focusPart(partId: string): void;

  setPaint(id: string): void;
  setAccessory(id: string, on: boolean): void;
  setVariant(groupId: string, optionId: string): void;
  setExplode(v: number): void;
  setOpening(id: string, open: boolean): void;
  /** Sustituye de una vez la lista de aperturas abiertas (Abrir todo / Cerrar todo). */
  setOpenings(ids: string[]): void;

  select(partId: string | null, fromCanvas?: boolean): void;
  toggleHidden(partId: string): void;
  setHiddenMany(partIds: string[], hidden: boolean): void;
  toggleIsolate(partId: string): void;
  showAll(): void;
  resetAll(): void;
  showToast(text: string): void;
  bumpShadows(): void;
}

let seq = 0;
const next = () => ++seq;
const interiorViewId = CONFIG.views.find((v) => v.kind === 'interior')?.id ?? null;
/** Acción de UI: detiene la rotación automática y reinicia la cuenta de inactividad. */
const acting =
  <A extends unknown[]>(fn: (...a: A) => void) =>
  (...a: A) => {
    idle.act();
    fn(...a);
  };

export const useShowroom = create<State & Actions>()((set, get) => ({
  ...defaultConfigurable(CONFIG),
  ...loadSaved(CONFIG),

  status: 'loading',
  progress: { loaded: 0, total: null },
  loadError: null,
  loadAttempt: 0,
  model: { partIds: [], openingIds: [], hasExplode: false, paintHex: null },

  tab: 'explorar',
  sheet: 'collapsed',

  activeView: CONFIG.defaultViewId,
  interior: false,
  camera: null,
  autoRotate: false,

  openings: [],
  selected: null,
  isolated: null,
  toast: null,
  shadowVersion: 0,

  setStatus: (status, extra) => set({ status, ...extra }),
  setProgress: (loaded, total) => set({ progress: { loaded, total } }),
  retry: () => set((s) => ({ status: 'loading', loadError: null, progress: { loaded: 0, total: null }, loadAttempt: s.loadAttempt + 1 })),
  modelComposed: (model) =>
    set((s) => ({
      model,
      // Lo guardado puede referirse a piezas que este GLB no trae.
      hidden: s.hidden.filter((h) => model.partIds.includes(h)),
      camera: { kind: 'intro', seq: next() },
    })),

  setTab: acting((tab) => set((s) => ({ tab, sheet: s.sheet === 'collapsed' ? 'half' : s.sheet }))),
  setSheet: acting((sheet) => set({ sheet, camera: { kind: 'reframe', seq: next() } })),

  goToView: acting((viewId) =>
    set({
      activeView: viewId,
      interior: viewId === interiorViewId,
      camera: { kind: 'view', viewId, seq: next() },
    }),
  ),
  cameraMovedByUser: () => {
    if (get().activeView !== null && !get().interior) set({ activeView: null });
  },
  focusPart: acting((partId) => set({ activeView: null, interior: false, camera: { kind: 'focus', partId, seq: next() } })),

  setPaint: acting((paintId) => set({ paintId })),
  setAccessory: acting((id, on) =>
    set((s) => {
      const accessories = toggleAccessory(CONFIG.accessories, s.accessories, id, on);
      const gone = CONFIG.accessories.filter((a) => !accessories.includes(a.id)).map((a) => a.partId);
      return {
        accessories,
        selected: s.selected && gone.includes(s.selected) ? null : s.selected,
        isolated: s.isolated && gone.includes(s.isolated) ? null : s.isolated,
      };
    }),
  ),
  setVariant: acting((groupId, optionId) => set((s) => ({ variants: { ...s.variants, [groupId]: optionId } }))),
  setExplode: acting((explode) => set({ explode })),
  setOpening: acting((id, open) =>
    set((s) => ({ openings: open ? [...new Set([...s.openings, id])] : s.openings.filter((o) => o !== id) })),
  ),

  setOpenings: acting((ids) => set({ openings: [...new Set(ids)] })),

  select: acting((partId, fromCanvas) =>
    set((s) => ({
      selected: partId,
      ...(fromCanvas && partId ? { tab: 'piezas' as Tab, sheet: s.sheet === 'collapsed' ? ('half' as SheetState) : s.sheet } : {}),
    })),
  ),
  toggleHidden: acting((partId) =>
    set((s) => ({ hidden: s.hidden.includes(partId) ? s.hidden.filter((h) => h !== partId) : [...s.hidden, partId] })),
  ),
  setHiddenMany: acting((partIds, hidden) =>
    set((s) => ({ hidden: hidden ? [...new Set([...s.hidden, ...partIds])] : s.hidden.filter((h) => !partIds.includes(h)) })),
  ),
  toggleIsolate: acting((partId) => set((s) => ({ isolated: s.isolated === partId ? null : partId }))),
  showAll: acting(() => set({ hidden: [], isolated: null })),
  resetAll: () => {
    idle.reset(); // estado inicial: vuelve a girar (tras la transición de cámara)
    set({
      ...defaultConfigurable(CONFIG),
      openings: [],
      selected: null,
      isolated: null,
      interior: false,
      activeView: CONFIG.defaultViewId,
      camera: { kind: 'view', viewId: CONFIG.defaultViewId, seq: next() },
      toast: { text: 'Configuración restablecida', seq: next() },
    });
  },
  showToast: (text) => set({ toast: { text, seq: next() } }),
  bumpShadows: () => set((s) => ({ shadowVersion: s.shadowVersion + 1 })),
}));

// Persistencia: solo la configuración elegida. Ocultas y despiece no se guardan:
// el vehículo siempre arranca ensamblado y completo.
useShowroom.subscribe((s, prev) => {
  if (s.paintId !== prev.paintId || s.accessories !== prev.accessories || s.variants !== prev.variants) {
    save(CONFIG, { paintId: s.paintId, accessories: s.accessories, variants: s.variants });
  }
});

export const getShowroom = useShowroom.getState;
