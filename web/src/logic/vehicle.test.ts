import { describe, expect, it } from 'vitest';
import { JAC6_CONFIG as C } from '../config/jac6';
import type { VehicleConfig } from '../config/types';
import { VEHICLES, DEFAULT_VEHICLE_ID } from '../config/vehicles';
import { LEGACY_KEY, migrateLegacy, restore, serialize, stateKey } from './persistence';
import { resolveVehicle } from './vehicle';

const KIA: VehicleConfig = { ...C, id: 'sportage', name: 'Sportage' };
const LIST = [C, KIA];
const resolve = (search: string, saved: string | null) => resolveVehicle(LIST, C.id, search, saved).id;

describe('registro de vehículos', () => {
  it('el predeterminado existe y los ids son únicos', () => {
    expect(VEHICLES.some((v) => v.id === DEFAULT_VEHICLE_ID)).toBe(true);
    expect(new Set(VEHICLES.map((v) => v.id)).size).toBe(VEHICLES.length);
  });
});

describe('resolución del vehículo activo', () => {
  it('la URL manda sobre lo guardado', () => {
    expect(resolve('?vehiculo=sportage', C.id)).toBe('sportage');
    expect(resolve('?dev=1&vehiculo=jac-6-phev', 'sportage')).toBe(C.id);
  });
  it('sin URL usa lo guardado', () => {
    expect(resolve('', 'sportage')).toBe('sportage');
    expect(resolve('?dev=1', 'sportage')).toBe('sportage');
  });
  it('sin URL ni guardado usa el predeterminado', () => {
    expect(resolve('', null)).toBe(C.id);
  });
  it('un id desconocido cae al siguiente nivel y al final al predeterminado', () => {
    expect(resolve('?vehiculo=nope', null)).toBe(C.id);
    expect(resolve('?vehiculo=nope', 'sportage')).toBe('sportage');
    expect(resolve('', 'nope')).toBe(C.id);
    expect(resolve('?vehiculo=nope', 'tambien-no')).toBe(C.id);
    expect(resolve('?vehiculo=', null)).toBe(C.id);
  });
});

describe('persistencia por vehículo', () => {
  const fake = (init: Record<string, string> = {}) => {
    const m = new Map(Object.entries(init));
    return {
      m,
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
      removeItem: (k: string) => void m.delete(k),
    };
  };
  const legacy = JSON.stringify(serialize(C, { paintId: 'onyx-black', accessories: ['tapete'], variants: {} }));

  it('cada vehículo tiene su propia clave', () => {
    expect(stateKey('jac-6-phev')).toBe('car-viewer:estado:jac-6-phev');
    expect(stateKey('sportage')).not.toBe(stateKey('jac-6-phev'));
  });
  it('lo guardado de un vehículo no vale para otro', () => {
    expect(restore(KIA, JSON.parse(legacy))).toBeNull();
  });
  it('migra la clave antigua al JAC 6, conserva el contenido y borra la antigua', () => {
    const s = fake({ [LEGACY_KEY]: legacy });
    migrateLegacy(s);
    expect(s.m.has(LEGACY_KEY)).toBe(false);
    expect(s.getItem(stateKey(C.id))).toBe(legacy);
    expect(restore(C, JSON.parse(s.getItem(stateKey(C.id))!))).toMatchObject({ paintId: 'onyx-black', accessories: ['tapete'] });
  });
  it('es de una sola vez: no pisa lo ya guardado con la clave nueva', () => {
    const nuevo = JSON.stringify(serialize(C, { paintId: 'original', accessories: [], variants: {} }));
    const s = fake({ [LEGACY_KEY]: legacy, [stateKey(C.id)]: nuevo });
    migrateLegacy(s);
    expect(s.getItem(stateKey(C.id))).toBe(nuevo);
    expect(s.m.has(LEGACY_KEY)).toBe(false);
    migrateLegacy(s); // segunda vez: nada que hacer
    expect(s.getItem(stateKey(C.id))).toBe(nuevo);
  });
  it('sin clave antigua no escribe nada', () => {
    const s = fake();
    migrateLegacy(s);
    expect(s.m.size).toBe(0);
  });
});
