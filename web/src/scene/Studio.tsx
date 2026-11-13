import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { useShowroom } from '../state/store';
import { getRuntime } from './compose';

const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

/**
 * Estudio claro (DESIGN §9): entorno procedural de softboxes blancos (sin HDRI
 * externo ni CDN, no puede fallar su carga) y sombras de contacto. Las sombras
 * se calculan una vez y se rehacen solo cuando cambia la geometría visible.
 */
export function Studio() {
  const interior = useShowroom((s) => s.interior);
  useShowroom((s) => s.shadowVersion); // re-render → ContactShadows recalcula un frame
  const rt = getRuntime();
  const length = rt ? rt.bounds.max.z - rt.bounds.min.z : 4.7;
  const res = coarse ? 512 : 1024;

  return (
    <>
      <color attach="background" args={['#EDEDED']} />
      {/* Las sombras van bajo y = 0: el desenfoque de drei dibuja su plano en y = 0 y una
          cámara de sombra por encima lo recorta (near = 0) y deja la sombra vacía. */}
      <Environment resolution={256} frames={1} environmentIntensity={interior ? 1.6 : 1}>
        {/* Cenital amplio: lee el volumen del capó y el techo. */}
        <Lightformer form="rect" intensity={3} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 5, 1]} />
        {/* Tiras laterales largas: dibujan la línea de cintura (asimetría leve). */}
        <Lightformer form="rect" intensity={4} position={[6, 1.4, 0]} rotation-y={-Math.PI / 2} scale={[12, 1.2, 1]} />
        <Lightformer form="rect" intensity={3.2} position={[-6, 1.4, 0]} rotation-y={Math.PI / 2} scale={[12, 1.2, 1]} />
        {/* Paneles de relleno grandes y suaves. */}
        <Lightformer form="rect" intensity={0.8} position={[7, 2.5, 0]} rotation-y={-Math.PI / 2} scale={[14, 4, 1]} />
        <Lightformer form="rect" intensity={0.8} position={[-7, 2.5, 0]} rotation-y={Math.PI / 2} scale={[14, 4, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[0, 1.5, 7]} rotation-y={Math.PI} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[0, 1.5, -7]} scale={[8, 3, 1]} />
        {/* Rebote del suelo claro del estudio: evita bajos negros. */}
        <Lightformer form="rect" intensity={0.5} position={[0, -0.5, 0]} rotation-x={-Math.PI / 2} scale={[14, 14, 1]} />
        {interior && <Lightformer form="rect" intensity={1.5} position={[0, 2.2, 0]} rotation-x={Math.PI / 2} scale={[2, 1, 1]} />}
      </Environment>
      <ContactShadows frames={1} position={[0, -0.002, 0]} opacity={0.4} blur={2.4} far={1.4} scale={1.6 * length} resolution={res} color="#000000" />
      <ContactShadows frames={1} position={[0, -0.004, 0]} opacity={0.15} blur={6} far={3} scale={2.4 * length} resolution={res} color="#000000" />
    </>
  );
}
