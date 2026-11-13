// Esquema tipado de un vehículo del showroom. Todo lo que el visor sabe del
// modelo sale de un objeto `VehicleConfig`; el visor no conoce nombres de nodos.

export type Vec3 = [number, number, number];

/** Archivo GLB. El primero es el principal; los demás se montan sobre él. */
export interface AssetDef {
  id: string;
  /** Ruta servida (relativa a `public/`), p. ej. `models/jac-6-phev.glb`. */
  url: string;
  /** Montaje opcional para GLB adicionales que no comparten coordenadas con el principal. */
  mount?: {
    /** Nodo del GLB principal al que se cuelga; por defecto, la raíz del vehículo. */
    parentNode?: string;
    position?: Vec3;
    rotationDeg?: Vec3;
    scale?: number;
  };
}

export type PartGroupId = 'exterior' | 'interior' | 'ruedas' | 'accesorios';

export interface PartDef {
  /** Identificador estable usado por la UI, el estado y la persistencia. */
  id: string;
  /** Nombre comercial (lo único que ve el usuario). */
  name: string;
  group: PartGroupId;
  description: string;
  /**
   * Nodos del GLB que forman la pieza. Cada malla pertenece a la pieza del
   * ancestro configurado más cercano, así que un hijo configurado aparte
   * (p. ej. `Caucho_DI` dentro de `Rueda_DI`) no se mezcla con su padre.
   */
  nodes: string[];
}

export interface PaintDef {
  id: string;
  name: string;
  /** `null` = restaurar el material tal como viene en el GLB. */
  hex: string | null;
  metalness?: number;
  roughness?: number;
  metallic?: boolean;
}

export interface AccessoryDef {
  id: string;
  name: string;
  /** Pieza (de `parts`) que se muestra cuando el accesorio está activo. */
  partId: string;
  /** Accesorios que deben estar activos para usar este. */
  requires?: string[];
  /** Accesorios con el mismo grupo son mutuamente excluyentes. */
  exclusiveGroup?: string;
  /** Datos sin confirmar por el cliente. No se usan como reglas. */
  pending?: string[];
}

/** Grupo de variantes mutuamente excluyentes (p. ej. rines). */
export interface VariantGroupDef {
  id: string;
  name: string;
  options: { id: string; name: string; partId: string }[];
  defaultOptionId: string;
}

export interface OpeningDef {
  id: string;
  name: string;
  /** Nodo cuyo origen es la bisagra. */
  node: string;
  /** Eje local de giro. */
  axis: 'x' | 'y' | 'z';
  /** Signo del giro que abre hacia fuera. */
  sign: 1 | -1;
  maxDeg: number;
}

interface ViewBase {
  id: string;
  name: string;
  /** Etiqueta corta para la barra de vistas de escritorio. */
  shortName: string;
  fov: number;
}

export interface OrbitViewDef extends ViewBase {
  kind: 'orbit';
  /** Desde el frente del coche, positivo hacia su lado izquierdo. */
  azimuthDeg: number;
  elevationDeg: number;
  /** Múltiplo de la distancia que encuadra el coche en esta vista (1 = ajuste exacto). */
  distance: number;
}

export interface InteriorViewDef extends ViewBase {
  kind: 'interior';
  position: Vec3;
  target: Vec3;
}

export type ViewDef = OrbitViewDef | InteriorViewDef;

/** Atribución del modelo 3D, obligatoria en licencias tipo CC BY. */
export interface VehicleCredits {
  title: string;
  author: string;
  license: string;
  /** Página del modelo en su origen. */
  url: string;
  licenseUrl: string;
}

export interface VehicleConfig {
  id: string;
  brand: string;
  name: string;
  version: string;
  /** Marca los textos provisionales pendientes del cliente. */
  provisionalCopy: boolean;
  /** Si existe, la UI muestra la atribución al pie del panel. */
  credits?: VehicleCredits;
  assets: AssetDef[];
  /** Ajuste global aplicado al contenedor común (nunca pieza a pieza). */
  transform: { position: Vec3; rotationDeg: Vec3; scale: number };
  partGroups: { id: PartGroupId; name: string }[];
  parts: PartDef[];
  /**
   * Ajustes de presentación por nombre de material, aplicados en tiempo de
   * ejecución (el GLB no se modifica). Sirve para que los materiales muy oscuros
   * reflejen más el estudio y lean volumen sin subir la exposición global.
   */
  materialTuning: Record<string, { envMapIntensity?: number }>;
  /** Nombre del material de pintura en el GLB. */
  paintMaterial: string;
  paints: PaintDef[];
  variantGroups: VariantGroupDef[];
  accessories: AccessoryDef[];
  openings: OpeningDef[];
  /** Desplazamiento de despiece al 100 %, por nodo, en el espacio del padre (metros). */
  explode: Record<string, Vec3>;
  /** Rotación automática del vehículo (vista exterior) y su reanudación por inactividad. */
  idleRotation: {
    /** Ms sin acciones del usuario antes de volver a girar. */
    idleMs: number;
    /** Velocidad de giro, grados por segundo. */
    degPerSec: number;
    /** Ms que tarda la velocidad en subir de 0 al máximo al (re)arrancar. */
    rampMs: number;
  };
  views: ViewDef[];
  defaultViewId: string;
  /** Pendientes del cliente; se listan en el README y en la herramienta de desarrollo. */
  pending: string[];
}
