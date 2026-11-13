// ============================================================================
// CONFIGURACIÓN DE EJEMPLO · JAC 6 PHEV
// Datos verificados en docs/modelo-jac6.md. Los nombres comerciales y las
// descripciones son PROVISIONALES (pendientes del cliente): describen la
// pieza sin inventar especificaciones, precios ni versiones comerciales.
// Para registrar una pieza nueva basta con añadirla a `parts` (ver README).
// ============================================================================
import type { VehicleConfig } from './types';

export const JAC6_CONFIG: VehicleConfig = {
  id: 'jac-6-phev',
  brand: 'JAC',
  name: 'JAC 6',
  version: 'PHEV',
  provisionalCopy: true,

  assets: [{ id: 'principal', url: 'models/jac-6-phev.glb' }],
  // El GLB ya viene en metros, +Y arriba y frente hacia +Z: sin reorientar.
  transform: { position: [0, 0, 0], rotationDeg: [0, 0, 0], scale: 1 },

  partGroups: [
    { id: 'exterior', name: 'Exterior' },
    { id: 'interior', name: 'Interior' },
    { id: 'ruedas', name: 'Ruedas' },
    { id: 'accesorios', name: 'Accesorios' },
  ],

  parts: [
    { id: 'carroceria', name: 'Carrocería', group: 'exterior', nodes: ['Carroceria'],
      description: 'Casco exterior pintado con ópticas, cristales fijos, pilares y techo interior.' },
    { id: 'puerta-di', name: 'Puerta delantera izquierda', group: 'exterior', nodes: ['Puerta_DI'],
      description: 'Puerta del conductor con su panel interior.' },
    { id: 'puerta-dd', name: 'Puerta delantera derecha', group: 'exterior', nodes: ['Puerta_DD'],
      description: 'Puerta del copiloto con su panel interior.' },
    { id: 'puerta-ti', name: 'Puerta trasera izquierda', group: 'exterior', nodes: ['Puerta_TI'],
      description: 'Puerta trasera del lado del conductor con su panel interior.' },
    { id: 'puerta-td', name: 'Puerta trasera derecha', group: 'exterior', nodes: ['Puerta_TD'],
      description: 'Puerta trasera del lado del copiloto con su panel interior.' },
    { id: 'porton', name: 'Portón trasero', group: 'exterior', nodes: ['Porton'],
      description: 'Portón del maletero con sus pilotos traseros.' },
    { id: 'techo', name: 'Techo panorámico', group: 'exterior', nodes: ['Techo_cristal'],
      description: 'Techo de cristal panorámico.' },

    { id: 'tablero', name: 'Tablero', group: 'interior', nodes: ['Tablero'],
      description: 'Tablero, consola central, columna de dirección, palancas y pedales.' },
    { id: 'pantalla', name: 'Pantalla', group: 'interior', nodes: ['Pantalla'],
      description: 'Pantalla doble sobre el tablero: cuadro de instrumentos y multimedia.' },
    { id: 'volante', name: 'Volante', group: 'interior', nodes: ['Volante'],
      description: 'Aro, radios, airbag, botones y emblema.' },
    { id: 'asientos', name: 'Asientos', group: 'interior',
      nodes: ['Asiento_conductor', 'Asiento_copiloto', 'Asientos_traseros'],
      description: 'Asientos delanteros con cinturón y banca trasera con cabeceras.' },
    { id: 'cortinilla', name: 'Cortinilla del techo', group: 'interior', nodes: ['Techo_cortinilla'],
      description: 'Cortinilla interior del techo panorámico.' },

    { id: 'rines', name: 'Rines', group: 'ruedas', nodes: ['Rueda_DI', 'Rueda_DD', 'Rueda_TI', 'Rueda_TD'],
      description: 'Rines y bujes de las cuatro ruedas.' },
    { id: 'neumaticos', name: 'Neumáticos', group: 'ruedas', nodes: ['Caucho_DI', 'Caucho_DD', 'Caucho_TI', 'Caucho_TD'],
      description: 'Los cuatro neumáticos (cauchos).' },
    { id: 'pinzas', name: 'Pinzas de freno', group: 'ruedas', nodes: ['Pinza_DI', 'Pinza_DD', 'Pinza_TI', 'Pinza_TD'],
      description: 'Pinzas de freno de las cuatro ruedas.' },

    { id: 'acc-barras', name: 'Barras de techo', group: 'accesorios', nodes: ['Acc_barras'],
      description: 'Barras transversales de techo.' },
    { id: 'acc-canastilla', name: 'Canastilla de techo', group: 'accesorios', nodes: ['Acc_canastilla'],
      description: 'Canastilla de carga sobre las barras de techo.' },
    { id: 'acc-portabicis', name: 'Portabicicletas', group: 'accesorios', nodes: ['Acc_portabicis', 'Acc_portabicis_mastil'],
      description: 'Portabicicletas trasero.' },
    { id: 'acc-organizador', name: 'Organizador de maletero', group: 'accesorios', nodes: ['Acc_organizador'],
      description: 'Organizador textil para el maletero.' },
    { id: 'acc-tapete', name: 'Tapete de maletero', group: 'accesorios', nodes: ['Acc_tapete'],
      description: 'Tapete de caucho para el maletero.' },
    { id: 'acc-tiron', name: 'Enganche de remolque', group: 'accesorios', nodes: ['Acc_tiron'],
      description: 'Enganche trasero de remolque.' },
  ],

  // Albedos de 0,02–0,05: sin esto, tablero, cueros y gomas se ven como siluetas negras.
  materialTuning: {
    Plastico_negro: { envMapIntensity: 2.4 },
    Cuero_negro: { envMapIntensity: 2.6 },
    Tela_negra: { envMapIntensity: 3 },
    Plastico_brillo: { envMapIntensity: 1.6 },
    Neumatico: { envMapIntensity: 1.8 },
    Neumatico_flanco: { envMapIntensity: 1.6 },
    Cuero_asientos: { envMapIntensity: 1.4 },
    Pinza: { envMapIntensity: 1.5 },
  },

  paintMaterial: 'Pintura',
  paints: [
    { id: 'original', name: 'Original del modelo', hex: null },
    { id: 'ocean-blue', name: 'Ocean Blue', hex: '#8fb4c9', metalness: 0.6, roughness: 0.32, metallic: true },
    { id: 'iron-gray', name: 'Iron Gray', hex: '#59606a', metalness: 0.7, roughness: 0.34, metallic: true },
    { id: 'artic-white', name: 'Artic White', hex: '#e9e9e6', metalness: 0.1, roughness: 0.3, metallic: false },
    { id: 'onyx-black', name: 'Onyx Black', hex: '#16181b', metalness: 0.45, roughness: 0.26, metallic: true },
  ],

  // Solo existe una variante de rines: no hay grupo de opciones.
  variantGroups: [],

  accessories: [
    { id: 'barras', name: 'Barras de techo', partId: 'acc-barras' },
    { id: 'canastilla', name: 'Canastilla de techo', partId: 'acc-canastilla', requires: ['barras'],
      pending: ['¿Existe variante negra ("canastilla black")? El GLB solo trae una malla.'] },
    { id: 'portabicis', name: 'Portabicicletas', partId: 'acc-portabicis',
      pending: ['Dependencia con el enganche de remolque sin confirmar.'] },
    { id: 'organizador', name: 'Organizador de maletero', partId: 'acc-organizador' },
    { id: 'tapete', name: 'Tapete de maletero', partId: 'acc-tapete' },
    { id: 'tiron', name: 'Enganche de remolque', partId: 'acc-tiron' },
  ],

  // Pivote = origen del nodo. Signos y límites verificados con capturas (web/qa).
  openings: [
    { id: 'puerta-di', name: 'Puerta delantera izquierda', node: 'Puerta_DI', axis: 'y', sign: -1, maxDeg: 65 },
    { id: 'puerta-dd', name: 'Puerta delantera derecha', node: 'Puerta_DD', axis: 'y', sign: 1, maxDeg: 65 },
    { id: 'puerta-ti', name: 'Puerta trasera izquierda', node: 'Puerta_TI', axis: 'y', sign: -1, maxDeg: 65 },
    { id: 'puerta-td', name: 'Puerta trasera derecha', node: 'Puerta_TD', axis: 'y', sign: 1, maxDeg: 65 },
    { id: 'porton', name: 'Portón trasero', node: 'Porton', axis: 'x', sign: 1, maxDeg: 80 },
  ],

  // +X = izquierda (conductor), +Y = arriba, +Z = frente.
  // Cada rueda sale como UNA pieza: rin + caucho + pinza con el mismo desplazamiento (±0,6 m, fuera de la carrocería).
  // El caucho es hijo del rin, así que no lleva desplazamiento propio: viaja con él.
  // Las puertas van más lejos que las ruedas (±1,6 m) para no cruzarse con ellas.
  explode: {
    Asiento_conductor: [1.0, 0.3, 0],
    Asiento_copiloto: [-1.0, 0.3, 0],
    Asientos_traseros: [0, 0.5, -1.2],
    Volante: [0, 0.95, 0],
    Pantalla: [0, 1.0, 0.6],
    Tablero: [0, 0, 3.0],   // sale entero por delante del parachoques (frente en z 2,34; el tablero empieza en z −0,30)
    Pinza_DI: [0.6, 0, 0],
    Pinza_TI: [0.6, 0, 0],
    Pinza_DD: [-0.6, 0, 0],
    Pinza_TD: [-0.6, 0, 0],
    Rueda_DI: [0.6, 0, 0],
    Rueda_TI: [0.6, 0, 0],
    Rueda_DD: [-0.6, 0, 0],
    Rueda_TD: [-0.6, 0, 0],
    Puerta_DI: [1.6, 0, 0],
    Puerta_TI: [1.6, 0, 0],
    Puerta_DD: [-1.6, 0, 0],
    Puerta_TD: [-1.6, 0, 0],
    Porton: [0, 0.4, -1.5],
    Techo_cristal: [0, 1.2, 0],
    Techo_cortinilla: [0, 0.7, 0],
    Acc_barras: [0, 1.5, 0],
    Acc_canastilla: [0, 1.9, 0],
  },

  idleRotation: { idleMs: 6000, degPerSec: 10, rampMs: 1500 },


  views: [
    { id: 'tres-cuartos', kind: 'orbit', name: 'Tres cuartos frontal', shortName: '3/4 frontal', azimuthDeg: 35, elevationDeg: 12, distance: 1, fov: 30 },
    { id: 'frente', kind: 'orbit', name: 'Frente', shortName: 'Frente', azimuthDeg: 0, elevationDeg: 6, distance: 1, fov: 30 },
    { id: 'trasera', kind: 'orbit', name: 'Trasera', shortName: 'Trasera', azimuthDeg: 180, elevationDeg: 6, distance: 1, fov: 30 },
    { id: 'lateral-izquierdo', kind: 'orbit', name: 'Lateral izquierdo', shortName: 'Izquierdo', azimuthDeg: 90, elevationDeg: 4, distance: 1, fov: 30 },
    { id: 'lateral-derecho', kind: 'orbit', name: 'Lateral derecho', shortName: 'Derecho', azimuthDeg: -90, elevationDeg: 4, distance: 1, fov: 30 },
    { id: 'superior', kind: 'orbit', name: 'Superior', shortName: 'Superior', azimuthDeg: 0, elevationDeg: 85, distance: 1, fov: 30 },
    { id: 'interior', kind: 'interior', name: 'Interior', shortName: 'Interior', position: [0.39, 1.22, -0.05], target: [0.2, 1.1, 0.8], fov: 70 },
  ],
  defaultViewId: 'tres-cuartos',

  pending: [
    'Nombres comerciales y descripciones definitivas de las piezas.',
    'Logotipo JAC en SVG (hoy se usa un encabezado tipográfico provisional).',
    'Versión comercial.',
    'Variante negra de la canastilla (el GLB solo trae una malla).',
    'Dependencia del portabicicletas con el enganche de remolque.',
    'Textos de los puntos informativos.',
    'Licencia del modelo 3D.',
  ],
};
