import { describe, expect, it } from 'vitest';
import { createIdleRotation, rampSpeed, type IdleContext } from './idleRotation';

const free: IdleContext = { interior: false, reducedMotion: false, busy: false };

function setup(idleMs = 6000) {
  let t = 0;
  const m = createIdleRotation(idleMs, () => t);
  return { m, advance: (ms: number) => void (t += ms) };
}

describe('rotación por inactividad', () => {
  it('arranca girando al terminar la carga', () => {
    expect(setup().m.tick(free)).toBe(true);
  });

  it('una acción la detiene en el acto', () => {
    const { m, advance } = setup();
    advance(100);
    m.act();
    expect(m.tick(free)).toBe(false);
  });

  it('se reanuda tras N ms sin acciones, no antes', () => {
    const { m, advance } = setup(6000);
    m.act();
    advance(5999);
    expect(m.tick(free)).toBe(false);
    expect(m.pendingMs(free)).toBe(1);
    advance(1);
    expect(m.tick(free)).toBe(true);
    expect(m.pendingMs(free)).toBeNull();
  });

  it('una nueva acción reinicia la cuenta', () => {
    const { m, advance } = setup(6000);
    m.act();
    advance(5000);
    m.act();
    advance(5000);
    expect(m.tick(free)).toBe(false);
    advance(1000);
    expect(m.tick(free)).toBe(true);
  });

  it('en vista interior no gira ni se reanuda', () => {
    const { m, advance } = setup();
    m.act();
    advance(60_000);
    expect(m.tick({ ...free, interior: true })).toBe(false);
    expect(m.pendingMs({ ...free, interior: true })).toBeNull();
    // al volver al exterior sin nuevas acciones ya pasó el tiempo
    expect(m.tick(free)).toBe(true);
  });

  it('con movimiento reducido nunca gira', () => {
    const { m, advance } = setup();
    expect(m.tick({ ...free, reducedMotion: true })).toBe(false);
    m.act();
    advance(60_000);
    expect(m.tick({ ...free, reducedMotion: true })).toBe(false);
  });

  it('durante una transición no gira y la cuenta empieza al terminar', () => {
    const { m, advance } = setup(6000);
    m.act();
    advance(4000);
    expect(m.tick({ ...free, busy: true })).toBe(false);
    advance(4000); // transición larga: no debe reanudarse al acabar
    expect(m.tick({ ...free, busy: true })).toBe(false);
    expect(m.tick(free)).toBe(false);
    advance(6000);
    expect(m.tick(free)).toBe(true);
  });

  it('la transición del arranque no cancela la rotación inicial', () => {
    const { m } = setup();
    expect(m.tick({ ...free, busy: true })).toBe(false);
    expect(m.tick(free)).toBe(true);
  });

  it('restablecer la reactiva al instante', () => {
    const { m } = setup();
    m.act();
    expect(m.tick(free)).toBe(false);
    m.reset();
    expect(m.tick(free)).toBe(true);
  });

  it('avisa a los suscriptores en act y reset, y deja de avisar al darse de baja', () => {
    const { m } = setup();
    let n = 0;
    const off = m.subscribe(() => n++);
    m.act();
    m.reset();
    expect(n).toBe(2);
    off();
    m.act();
    expect(n).toBe(2);
  });
});

describe('rampa de velocidad', () => {
  it('parar es inmediato', () => {
    expect(rampSpeed(0.2, false, 0.016, 0.2, 1500)).toBe(0);
  });
  it('arrancar sube sin saltos y satura en el máximo', () => {
    let v = 0;
    const steps: number[] = [];
    for (let i = 0; i < 120; i++) steps.push((v = rampSpeed(v, true, 1 / 60, 0.2, 1500)));
    expect(steps[0]).toBeLessThan(0.01);
    for (let i = 1; i < steps.length; i++) expect(steps[i] - steps[i - 1]).toBeLessThan(0.003);
    expect(steps[89]).toBeCloseTo(0.2, 6); // 1,5 s a 60 fps
    expect(steps[119]).toBe(0.2);
  });
});
