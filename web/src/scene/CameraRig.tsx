import { useCallback, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Box3, MathUtils, PerspectiveCamera, Sphere, Vector3 } from 'three';
import { CONFIG, getShowroom, useShowroom } from '../state/store';
import { idle } from '../state/idle';
import type { ViewDef } from '../config/types';
import { easeInOutCubic, easeOutCubic, fitDistance, frameDistance, orbitPosition, transitionMs } from '../logic/camera';
import { rampSpeed } from '../logic/idleRotation';
import { visibleParts } from '../logic/visibility';
import { framingBounds, getRuntime } from './compose';
import { insets, onInsetsChange } from './insets';
import { motionScale } from './motion';

interface Tween {
  p0: Vector3; p1: Vector3; t0: Vector3; t1: Vector3;
  f0: number; f1: number;
  start: number; dur: number;
  ease: (t: number) => number;
  done: () => void;
}

type Mode = { kind: 'center' } | { kind: 'focus'; minDistance: number } | { kind: 'interior' };

const DEG = Math.PI / 180;
const INTERIOR_RADIUS = 0.05;
const UP = new Vector3(0, 1, 0);
const SPIN = CONFIG.idleRotation;
const viewById = (id: string | null) => CONFIG.views.find((v) => v.id === id);

/** Caja de encuadre actual: ensamblada, o desplegada (solo piezas visibles) según el despiece del store. */
function currentFraming(): Box3 {
  const s = getShowroom();
  return framingBounds(getRuntime()!, s.explode / 100, visibleParts(CONFIG, s));
}

function boxCorners(box: Box3): Vector3[] {
  const out: Vector3[] = [];
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) out.push(new Vector3(x, y, z));
  return out;
}

export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const controls = useRef<OrbitControlsImpl>(null);
  const tween = useRef<Tween | null>(null);
  const mode = useRef<Mode>({ kind: 'center' });
  /** Rotación automática: velocidad actual (rad/s), distancia segura del giro y espera de reanudación. */
  const spin = useRef({ speed: 0, need: 0, active: false, dragging: false, timer: undefined as number | undefined });
  const viewOffset = useRef({ w: 0, h: 0, dy: Number.NaN });
  const fitKey = useRef<string | null>(null);
  /** La rotación automática ya movió la cámara fuera de la vista activa (que sigue marcada en la UI). */
  const drifted = useRef(false);

  const command = useShowroom((s) => s.camera);
  const explode = useShowroom((s) => s.explode);
  const accessories = useShowroom((s) => s.accessories);
  const hidden = useShowroom((s) => s.hidden);
  const isolated = useShowroom((s) => s.isolated);
  const status = useShowroom((s) => s.status);

  const freeFraction = useCallback(() => Math.max(0.2, (size.height - insets.top - insets.bottom) / size.height), [size.height]);

  /** d0: distancia que encuadra la esfera envolvente del coche, desplegado si procede (base de los límites de zoom). */
  const d0 = useCallback(
    (fov: number) =>
      getRuntime() ? frameDistance(currentFraming().getBoundingSphere(new Sphere()).radius, fov, size.width / size.height, freeFraction()) : 10,
    [size.width, size.height, freeFraction],
  );

  const applyLimits = useCallback(() => {
    const c = controls.current;
    const rt = getRuntime();
    if (!c || !rt) return;
    const reduced = motionScale() === 0;
    c.enableDamping = true;
    c.dampingFactor = reduced ? 0.2 : 0.08;
    c.enablePan = false;
    if (mode.current.kind === 'interior') {
      c.minDistance = c.maxDistance = INTERIOR_RADIUS;
      c.minPolarAngle = 30 * DEG;
      c.maxPolarAngle = 150 * DEG;
      c.enableZoom = false;
      c.rotateSpeed = -0.4; // arrastrar mueve la escena con el dedo, como en una panorámica
      camera.near = 0.01;
    } else {
      const base = d0(30);
      // Nunca dentro de la esfera envolvente del coche: no se puede atravesar la carrocería.
      c.minDistance = mode.current.kind === 'focus' ? mode.current.minDistance : rt.sphere.radius * 1.25;
      c.maxDistance = 1.6 * base;
      c.minPolarAngle = 2 * DEG; // elevación ≤ 88°
      c.maxPolarAngle = 88 * DEG; // elevación ≥ 2°: nunca bajo el suelo
      c.enableZoom = true;
      c.rotateSpeed = 1;
      camera.near = 0.1;
    }
    camera.updateProjectionMatrix();
  }, [camera, d0]);

  const startTween = useCallback(
    (p1: Vector3, t1: Vector3, f1: number, dur: number, ease: (t: number) => number, done: () => void) => {
      const c = controls.current;
      if (!c) return;
      c.minDistance = 0;
      c.maxDistance = Infinity;
      c.minPolarAngle = 0;
      c.maxPolarAngle = Math.PI;
      c.enableDamping = false;
      tween.current = {
        p0: camera.position.clone(), p1, t0: c.target.clone(), t1,
        f0: camera.fov, f1,
        start: performance.now(), dur: dur * motionScale(),
        ease, done,
      };
      invalidate();
    },
    [camera, invalidate],
  );

  /** Encuadre exacto de la caja del coche (desplegada si hay despiece) desde `dir`, en el área libre del visor. */
  const fitPose = useCallback(
    (dir: Vector3, fov: number, factor = 1) => {
      const box = currentFraming();
      const target = box.getCenter(new Vector3());
      const dist = fitDistance(boxCorners(box), target, dir, fov, size.width / size.height, freeFraction()) * factor;
      return { position: target.clone().addScaledVector(dir, dist), target, fov };
    },
    [size.width, size.height, freeFraction],
  );

  const viewPose = useCallback(
    (view: ViewDef) => {
      const rt = getRuntime()!;
      if (view.kind === 'interior') {
        const m = rt.root.matrixWorld;
        return { position: new Vector3(...view.position).applyMatrix4(m), target: new Vector3(...view.target).applyMatrix4(m), fov: view.fov };
      }
      return fitPose(orbitPosition(new Vector3(), view.azimuthDeg, view.elevationDeg, 1), view.fov, view.distance);
    },
    [fitPose],
  );

  const goToView = useCallback(
    (view: ViewDef, opts: { dur?: number; ease?: (t: number) => number; fromScale?: number } = {}) => {
      const c = controls.current;
      if (!c) return;
      drifted.current = false;
      const pose = viewPose(view);
      const wasInterior = mode.current.kind === 'interior';
      const isInterior = view.kind === 'interior';
      if (opts.fromScale) {
        // Intro: arranca más lejos en la misma dirección.
        const dir = pose.position.clone().sub(pose.target).multiplyScalar(opts.fromScale);
        camera.position.copy(pose.target).add(dir);
        c.target.copy(pose.target);
        camera.fov = pose.fov;
        camera.lookAt(pose.target);
      }
      const angle = camera.position.clone().sub(c.target).angleTo(pose.position.clone().sub(pose.target));
      const dur = opts.dur ?? transitionMs(angle, wasInterior || isInterior);
      startTween(pose.position, pose.target, pose.fov, dur, opts.ease ?? easeInOutCubic, () => {
        if (isInterior) {
          // Gira en el sitio: el objetivo queda a pocos cm delante del ojo.
          const dir = pose.target.clone().sub(pose.position).normalize();
          c.target.copy(pose.position).addScaledVector(dir, INTERIOR_RADIUS);
          camera.position.copy(pose.position);
          mode.current = { kind: 'interior' };
        } else {
          mode.current = { kind: 'center' };
        }
        applyLimits();
      });
    },
    [applyLimits, camera, startTween, viewPose],
  );

  const focusPart = useCallback(
    (partId: string) => {
      const rt = getRuntime();
      const c = controls.current;
      if (!rt || !c) return;
      const box = new Box3();
      for (const m of rt.index.partMeshes.get(partId) ?? []) if (m.visible) box.expandByObject(m);
      if (box.isEmpty()) for (const m of rt.index.partMeshes.get(partId) ?? []) box.expandByObject(m);
      if (box.isEmpty()) return;
      const target = box.getCenter(new Vector3());
      const sizeMax = box.getSize(new Vector3()).length();
      const fov = 30;
      // Nunca dentro del coche: al menos la distancia a la esquina más lejana de su caja.
      const corners = [rt.bounds.min, rt.bounds.max];
      let safe = 0;
      for (const x of corners) for (const y of corners) for (const z of corners)
        safe = Math.max(safe, target.distanceTo(new Vector3(x.x, y.y, z.z)));
      const dist = Math.max((0.8 * sizeMax) / Math.sin((fov / 2) * DEG), safe + 0.3);

      const dir = (mode.current.kind === 'interior' ? orbitPosition(new Vector3(), 35, 12, 1) : camera.position.clone().sub(c.target)).normalize();
      if (dir.y < Math.sin(8 * DEG)) {
        dir.y = Math.sin(8 * DEG);
        dir.normalize();
      }
      const position = target.clone().addScaledVector(dir, dist);
      const angle = camera.position.clone().sub(c.target).angleTo(position.clone().sub(target));
      startTween(position, target, fov, transitionMs(angle, mode.current.kind === 'interior'), easeInOutCubic, () => {
        mode.current = { kind: 'focus', minDistance: Math.min(safe + 0.3, dist) };
        applyLimits();
      });
    },
    [applyLimits, camera, startTween],
  );

  /** Reencuadra sin cambiar de dirección: cámaras libres (giro, órbita manual) cuando cambia el área libre o el despiece. */
  const refit = useCallback(
    (dur: number) => {
      const c = controls.current;
      if (!c || mode.current.kind !== 'center') {
        applyLimits();
        return;
      }
      const pose = fitPose(camera.position.clone().sub(c.target).normalize(), camera.fov);
      startTween(pose.position, pose.target, pose.fov, dur, easeOutCubic, applyLimits);
    },
    [applyLimits, camera, fitPose, startTween],
  );

  /** Reencuadra la vista activa; si el giro automático ya se alejó de ella, conserva la dirección actual. */
  const fitActive = useCallback(
    (dur: number, ease = easeOutCubic) => {
      const v = viewById(getShowroom().activeView);
      if (v?.kind === 'orbit' && !drifted.current) goToView(v, { dur, ease });
      else refit(dur);
    },
    [goToView, refit],
  );

  // Órdenes de cámara desde la UI.
  useEffect(() => {
    if (!command || !getRuntime()) return;
    switch (command.kind) {
      case 'intro':
        goToView(viewById(CONFIG.defaultViewId)!, { dur: 1400, ease: easeOutCubic, fromScale: 1.18 });
        break;
      case 'view': {
        const v = viewById(command.viewId);
        if (v) goToView(v);
        break;
      }
      case 'focus':
        focusPart(command.partId);
        break;
      case 'reframe': {
        fitActive(320);
        break;
      }
    }
  }, [command, goToView, focusPart, fitActive]);

  // Despiece: reencuadra para que quepan las piezas visibles desplegadas (ocultar capas acerca la cámara); al plegar vuelve al encuadre normal.
  useEffect(() => {
    const key = explode > 0 ? `${explode}|${accessories.join()}|${hidden.join()}|${isolated ?? ''}` : '0';
    const prev = fitKey.current;
    fitKey.current = key;
    if (status !== 'ready' || prev === null || prev === key) return;
    const id = window.setTimeout(() => fitActive(600, easeInOutCubic), 150);
    return () => clearTimeout(id);
  }, [explode, accessories, hidden, isolated, status, fitActive]);

  // Redimensionado: reencuadra (debounce 100 ms).
  useEffect(() => {
    if (status !== 'ready') return;
    const id = window.setTimeout(() => {
      if (tween.current) applyLimits();
      else fitActive(0);
    }, 100);
    return () => clearTimeout(id);
  }, [size.width, size.height, status, applyLimits, fitActive]);

  useEffect(() => {
    onInsetsChange(invalidate);
    return () => onInsetsChange(null);
  }, [invalidate]);

  // Cualquier acción detiene el giro en el acto (la rampa solo aplica al reanudar).
  useEffect(() => {
    const sp = spin.current;
    const stop = idle.subscribe(() => {
      clearTimeout(sp.timer);
      sp.timer = undefined;
      sp.speed = 0;
      if (sp.active) {
        sp.active = false;
        useShowroom.setState({ autoRotate: false });
      }
      invalidate();
    });
    // Entradas directas (puntero, rueda, teclado); las acciones de UI llegan por el store.
    const act = () => idle.act();
    const opts = { capture: true, passive: true } as const;
    const events = ['pointerdown', 'wheel', 'keydown'] as const;
    for (const e of events) window.addEventListener(e, act, opts);
    return () => {
      stop();
      for (const e of events) window.removeEventListener(e, act, opts);
      clearTimeout(sp.timer);
    };
  }, [invalidate]);

  const onStart = useCallback(() => {
    if (tween.current) {
      tween.current = null;
      applyLimits();
    }
    getShowroom().cameraMovedByUser();
    spin.current.dragging = true;
    idle.act();
  }, [applyLimits]);

  const onEnd = useCallback(() => {
    spin.current.dragging = false;
    idle.act(); // la cuenta de inactividad empieza al soltar
  }, []);

  /** Distancia a la que el coche cabe desde cualquier azimut a la elevación actual (para girar sin cortarlo). */
  const fitAllAround = useCallback(
    (target: Vector3) => {
      const corners = boxCorners(currentFraming());
      const el = Math.asin(MathUtils.clamp(camera.position.clone().sub(target).normalize().y, -1, 1)) / DEG;
      let need = 0;
      for (let az = 0; az < 360; az += 10)
        need = Math.max(need, fitDistance(corners, target, orbitPosition(new Vector3(), az, el, 1), camera.fov, size.width / size.height, freeFraction()));
      return need;
    },
    [camera, size.width, size.height, freeFraction],
  );

  useFrame((_, delta) => {
    // Desplaza la proyección para centrar el coche en el área libre (sheet móvil).
    const vo = viewOffset.current;
    const dy = size.height / 2 - (insets.top + size.height - insets.bottom) / 2;
    if (vo.dy !== dy || vo.w !== size.width || vo.h !== size.height) {
      if (dy === 0) camera.clearViewOffset();
      else camera.setViewOffset(size.width, size.height, 0, dy, size.width, size.height);
      Object.assign(vo, { dy, w: size.width, h: size.height });
    }

    const c = controls.current;
    if (!c) return;
    const tw = tween.current;
    if (tw) {
      const k = tw.dur > 0 ? Math.min(1, (performance.now() - tw.start) / tw.dur) : 1;
      const e = tw.ease(k);
      camera.position.lerpVectors(tw.p0, tw.p1, e);
      c.target.lerpVectors(tw.t0, tw.t1, e);
      camera.fov = MathUtils.lerp(tw.f0, tw.f1, e);
      camera.updateProjectionMatrix();
      camera.lookAt(c.target);
      if (k >= 1) {
        tween.current = null;
        tw.done();
      }
      invalidate();
    }

    // Rotación automática por inactividad. Solo pide frames mientras gira; en reposo
    // espera con un temporizador a que toque reanudar (frameloop="demand").
    const sp = spin.current;
    const ctx = {
      interior: mode.current.kind === 'interior' || getShowroom().interior,
      reducedMotion: motionScale() === 0,
      busy: tween.current !== null || sp.dragging || getShowroom().status !== 'ready',
    };
    const dt = Math.min(delta, 0.05); // tras un reposo largo el primer delta es enorme
    const prev = sp.speed;
    sp.speed = rampSpeed(prev, idle.tick(ctx), dt, SPIN.degPerSec * DEG, SPIN.rampMs);

    if (sp.speed > 0) {
      if (prev === 0) sp.need = mode.current.kind === 'center' ? fitAllAround(c.target) : 0;
      if (!sp.active) {
        sp.active = true;
        useShowroom.setState({ autoRotate: true });
      }
      drifted.current = true; // la vista activa sigue marcada hasta que el usuario mueva la cámara
      // Gira alrededor del objetivo actual desde la posición actual; si hace falta, se aleja
      // suavemente a la distancia a la que el coche cabe desde cualquier azimut.
      const off = camera.position.clone().sub(c.target);
      const len = off.length();
      if (len < sp.need) off.multiplyScalar(1 + ((sp.need - len) * (1 - Math.exp(-dt / 0.6))) / len);
      off.applyAxisAngle(UP, sp.speed * dt);
      camera.position.copy(c.target).add(off);
      camera.lookAt(c.target);
      invalidate();
    } else if (sp.active) {
      sp.active = false;
      useShowroom.setState({ autoRotate: false });
    }

    const wait = idle.pendingMs(ctx);
    if (wait !== null && sp.timer === undefined) {
      sp.timer = window.setTimeout(() => {
        sp.timer = undefined;
        invalidate();
      }, Math.ceil(wait) + 1);
    }
  });

  return <OrbitControls ref={controls} makeDefault enablePan={false} onStart={onStart} onEnd={onEnd} />;
}
