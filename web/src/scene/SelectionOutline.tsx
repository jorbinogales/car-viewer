import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  Color,
  DoubleSide,
  LessEqualDepth,
  MeshBasicMaterial,
  NoBlending,
  NormalBlending,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
  type Mesh,
} from 'three';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { useShowroom } from '../state/store';
import { getRuntime, OCCLUDER_LAYER, SELECTED_LAYER } from './compose';

/*
 * Contorno de selección de doble trazo (DESIGN §10): línea #0A0A0A de 2 px
 * pegada a la pieza + halo blanco de 2 px por fuera, en px CSS × dpr.
 *
 * Por qué así y no <Outlines> de drei ni EffectComposer:
 * - <Outlines> duplica cada malla como casco invertido: con la carrocería
 *   (0,9 M caras) son 0,9 M triángulos más por trazo y por frame, y en mallas
 *   con aristas duras el casco se abre.
 * - Un EffectComposer obliga a mover el tone mapping y el MSAA a pasadas de
 *   posproceso para todo el frame, también sin selección.
 * Aquí el render normal no cambia. Solo con una pieza seleccionada se añade:
 * una pasada de profundidad de las mallas opacas, la pieza en blanco, y dos
 * pasadas de pantalla completa de 17 muestras (transformada de distancia
 * separable) que se componen sobre el frame. Sin selección el coste es cero.
 */

const MAX_R = 12;

const vertex = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const horizontal = new ShaderMaterial({
  uniforms: { tMask: { value: null }, texel: { value: new Vector2() }, radius: { value: 4 } },
  vertexShader: vertex,
  fragmentShader: /* glsl */ `
    uniform sampler2D tMask; uniform vec2 texel; uniform float radius; varying vec2 vUv;
    void main() {
      float best = radius + 1.0;
      for (int i = -${MAX_R}; i <= ${MAX_R}; i++) {
        float fi = float(i);
        if (abs(fi) > radius) continue;
        if (texture2D(tMask, vUv + vec2(fi * texel.x, 0.0)).r > 0.5) best = min(best, abs(fi));
      }
      gl_FragColor = vec4(best / (radius + 1.0), 0.0, 0.0, 1.0);
    }`,
  blending: NoBlending,
  depthTest: false,
  depthWrite: false,
});

const composite = new ShaderMaterial({
  uniforms: {
    tMask: { value: null }, tH: { value: null }, texel: { value: new Vector2() },
    radius: { value: 4 }, lineW: { value: 2 }, haloW: { value: 2 },
  },
  vertexShader: vertex,
  fragmentShader: /* glsl */ `
    uniform sampler2D tMask; uniform sampler2D tH; uniform vec2 texel;
    uniform float radius; uniform float lineW; uniform float haloW; varying vec2 vUv;
    void main() {
      float best = 1e4;
      for (int j = -${MAX_R}; j <= ${MAX_R}; j++) {
        float fj = float(j);
        if (abs(fj) > radius) continue;
        float h = texture2D(tH, vUv + vec2(0.0, fj * texel.y)).r * (radius + 1.0);
        if (h <= radius + 0.01) best = min(best, length(vec2(h, fj)));
      }
      float outside = 1.0 - texture2D(tMask, vUv).r;
      float line = 1.0 - smoothstep(lineW - 0.5, lineW + 0.5, best);
      float halo = 1.0 - smoothstep(lineW + haloW - 0.5, lineW + haloW + 0.5, best);
      float a = halo * outside;
      if (a <= 0.0) discard;
      gl_FragColor = vec4(mix(vec3(1.0), vec3(0.0392), line / max(halo, 1e-4)), a);
    }`,
  blending: NormalBlending,
  transparent: true,
  depthTest: false,
  depthWrite: false,
});

const occluderMat = new MeshBasicMaterial({ color: 0x000000, side: DoubleSide });
const selectedMat = new MeshBasicMaterial({ color: 0xffffff, side: DoubleSide, depthFunc: LessEqualDepth, depthWrite: false });

export function SelectionOutline() {
  const selected = useShowroom((s) => s.selected);
  const status = useShowroom((s) => s.status);
  const invalidate = useThree((s) => s.invalidate);

  const targets = useMemo(
    () => ({
      mask: new WebGLRenderTarget(1, 1, { samples: 4, depthBuffer: true }),
      h: new WebGLRenderTarget(1, 1, { depthBuffer: false }),
      quad: new FullScreenQuad(),
    }),
    [],
  );
  useEffect(() => () => {
    targets.mask.dispose();
    targets.h.dispose();
    targets.quad.dispose();
  }, [targets]);

  // La pieza seleccionada entra en su capa; las demás salen.
  useEffect(() => {
    const rt = getRuntime();
    if (!rt) return;
    const meshes: Mesh[] = selected ? rt.index.partMeshes.get(selected) ?? [] : [];
    for (const m of rt.index.meshPart.keys()) m.layers.disable(SELECTED_LAYER);
    for (const m of meshes) m.layers.enable(SELECTED_LAYER);
    invalidate();
  }, [selected, status, invalidate]);

  // Prioridad 1: este componente hace el render del frame.
  useFrame(({ gl, scene, camera }) => {
    gl.render(scene, camera);

    const rt = getRuntime();
    const meshes = selected && rt ? rt.index.partMeshes.get(selected) ?? [] : [];
    if (!meshes.some((m) => m.visible)) return;

    const size = gl.getDrawingBufferSize(new Vector2());
    if (targets.mask.width !== size.x || targets.mask.height !== size.y) {
      targets.mask.setSize(size.x, size.y);
      targets.h.setSize(size.x, size.y);
    }
    const dpr = gl.getPixelRatio();
    const lineW = 2 * dpr;
    const haloW = 2 * dpr;
    const radius = Math.min(MAX_R, Math.ceil(lineW + haloW + 1));

    const prev = { clear: gl.getClearColor(new Color()), alpha: gl.getClearAlpha(), background: scene.background, override: scene.overrideMaterial, mask: camera.layers.mask, autoClear: gl.autoClear };
    scene.background = null;
    gl.autoClear = false;

    // 1) Profundidad de lo opaco en negro; 2) la pieza en blanco donde se ve.
    gl.setRenderTarget(targets.mask);
    gl.setClearColor(0x000000, 0);
    gl.clear(true, true, false);
    scene.overrideMaterial = occluderMat;
    camera.layers.set(OCCLUDER_LAYER);
    gl.render(scene, camera);
    scene.overrideMaterial = selectedMat;
    camera.layers.set(SELECTED_LAYER);
    gl.render(scene, camera);

    // 3) Distancia horizontal; 4) vertical + composición sobre el frame.
    horizontal.uniforms.tMask.value = targets.mask.texture;
    horizontal.uniforms.texel.value.set(1 / size.x, 1 / size.y);
    horizontal.uniforms.radius.value = radius;
    targets.quad.material = horizontal;
    gl.setRenderTarget(targets.h);
    targets.quad.render(gl);

    composite.uniforms.tMask.value = targets.mask.texture;
    composite.uniforms.tH.value = targets.h.texture;
    composite.uniforms.texel.value.set(1 / size.x, 1 / size.y);
    composite.uniforms.radius.value = radius;
    composite.uniforms.lineW.value = lineW;
    composite.uniforms.haloW.value = haloW;
    targets.quad.material = composite;
    gl.setRenderTarget(null);
    targets.quad.render(gl);

    scene.background = prev.background;
    scene.overrideMaterial = prev.override;
    camera.layers.mask = prev.mask;
    gl.autoClear = prev.autoClear;
    gl.setClearColor(prev.clear, prev.alpha);
  }, 1);

  return null;
}
