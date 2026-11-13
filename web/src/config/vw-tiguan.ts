// ============================================================================
// CONFIGURACIÓN · VOLKSWAGEN TIGUAN 2025
// Modelo de Sketchfab (licencia Free Standard), adaptado con blender/tiguan_adaptar.py:
// girado 180° y con sus piezas unidas en los mismos nodos que el JAC 6.
// Nombres y descripciones PROVISIONALES: describen la pieza sin inventar
// especificaciones, precios, versiones comerciales ni colores de catálogo.
// ============================================================================
import type { VehicleConfig } from './types';

export const VW_TIGUAN_CONFIG: VehicleConfig = {
  id: 'vw-tiguan-2025',
  brand: 'Volkswagen',
  name: 'VW Tiguan',
  version: '2025',
  provisionalCopy: true,
  credits: {
    title: 'Volkswagen Tiguan (2025)',
    author: 'geyges',
    license: 'Sketchfab Free Standard',
    url: 'https://sketchfab.com/3d-models/18333bf2a9564772917ae8a349b81e62',
    licenseUrl: 'https://sketchfab.com/licenses',
  },

  assets: [{ id: 'principal', url: 'models/vw-tiguan-2025.glb' }],
  // El GLB sale en metros, +Y arriba, frente hacia +Z y conductor en +X (igual que el JAC 6).
  transform: { position: [0, 0, 0], rotationDeg: [0, 0, 0], scale: 1 },

  partGroups: [
    { id: 'exterior', name: 'Exterior' },
    { id: 'interior', name: 'Interior' },
    { id: 'ruedas', name: 'Ruedas' },
  ],

  parts: [
    { id: 'carroceria', name: 'Carrocería', group: 'exterior', nodes: ['Carroceria'],
      description: 'Casco exterior pintado con ópticas, cristales fijos, pilares, piso y techo interior.' },
    { id: 'puerta-di', name: 'Puerta delantera izquierda', group: 'exterior', nodes: ['Puerta_DI'],
      description: 'Puerta del conductor con su espejo y su panel interior.' },
    { id: 'puerta-dd', name: 'Puerta delantera derecha', group: 'exterior', nodes: ['Puerta_DD'],
      description: 'Puerta del copiloto con su espejo y su panel interior.' },
    { id: 'puerta-ti', name: 'Puerta trasera izquierda', group: 'exterior', nodes: ['Puerta_TI'],
      description: 'Puerta trasera del lado del conductor con su panel interior.' },
    { id: 'puerta-td', name: 'Puerta trasera derecha', group: 'exterior', nodes: ['Puerta_TD'],
      description: 'Puerta trasera del lado del copiloto con su panel interior.' },
    { id: 'porton', name: 'Portón trasero', group: 'exterior', nodes: ['Porton'],
      description: 'Portón del maletero con la luneta y los pilotos.' },
    { id: 'techo', name: 'Techo panorámico', group: 'exterior', nodes: ['Techo_cristal'],
      description: 'Techo de cristal: panel delantero practicable y panel trasero fijo.' },

    { id: 'tablero', name: 'Tablero', group: 'interior', nodes: ['Tablero'],
      description: 'Tablero, consola central y mandos.' },
    { id: 'pantalla', name: 'Pantalla', group: 'interior', nodes: ['Pantalla'],
      description: 'Cuadro de instrumentos digital y pantalla multimedia.' },
    { id: 'volante', name: 'Volante', group: 'interior', nodes: ['Volante'],
      description: 'Aro, radios, botones y emblema.' },
    { id: 'asientos', name: 'Asientos', group: 'interior',
      nodes: ['Asiento_conductor', 'Asiento_copiloto', 'Asientos_traseros'],
      description: 'Asientos delanteros y banca trasera con cabeceras y apoyabrazos.' },

    { id: 'rines', name: 'Rines', group: 'ruedas', nodes: ['Rueda_DI', 'Rueda_DD', 'Rueda_TI', 'Rueda_TD'],
      description: 'Rines de las cuatro ruedas.' },
    { id: 'neumaticos', name: 'Neumáticos', group: 'ruedas', nodes: ['Caucho_DI', 'Caucho_DD', 'Caucho_TI', 'Caucho_TD'],
      description: 'Los cuatro neumáticos (cauchos).' },
    { id: 'pinzas', name: 'Frenos', group: 'ruedas', nodes: ['Pinza_DI', 'Pinza_DD', 'Pinza_TI', 'Pinza_TD'],
      description: 'Discos y pinzas de freno de las cuatro ruedas.' },
  ],

  materialTuning: {},

  paintMaterial: 'Gris Ascot [laou1klg]',
  // Sin carta de colores verificada: solo el color del modelo.
  paints: [{ id: 'original', name: 'Original del modelo (Gris Ascot)', hex: null }],

  variantGroups: [],
  accessories: [],

  // Pivote = origen del nodo (la bisagra original del modelo), mismos ejes y signos que el JAC 6.
  openings: [
    { id: 'puerta-di', name: 'Puerta delantera izquierda', node: 'Puerta_DI', axis: 'y', sign: -1, maxDeg: 65 },
    { id: 'puerta-dd', name: 'Puerta delantera derecha', node: 'Puerta_DD', axis: 'y', sign: 1, maxDeg: 65 },
    { id: 'puerta-ti', name: 'Puerta trasera izquierda', node: 'Puerta_TI', axis: 'y', sign: -1, maxDeg: 65 },
    { id: 'puerta-td', name: 'Puerta trasera derecha', node: 'Puerta_TD', axis: 'y', sign: 1, maxDeg: 65 },
    { id: 'porton', name: 'Portón trasero', node: 'Porton', axis: 'x', sign: 1, maxDeg: 80 },
  ],

  // +X = izquierda (conductor), +Y = arriba, +Z = frente.
  // Asientos y tablero no están: se quedan en su sitio al desarmar (decisión del cliente).
  explode: {
    Volante: [0, 0.95, 0],
    Pantalla: [0, 1.0, 0.6],
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
  },

  idleRotation: { idleMs: 6000, degPerSec: 10, rampMs: 1500 },

  views: [
    { id: 'tres-cuartos', kind: 'orbit', name: 'Tres cuartos frontal', shortName: '3/4 frontal', azimuthDeg: 35, elevationDeg: 12, distance: 1, fov: 30 },
    { id: 'frente', kind: 'orbit', name: 'Frente', shortName: 'Frente', azimuthDeg: 0, elevationDeg: 6, distance: 1, fov: 30 },
    { id: 'trasera', kind: 'orbit', name: 'Trasera', shortName: 'Trasera', azimuthDeg: 180, elevationDeg: 6, distance: 1, fov: 30 },
    { id: 'lateral-izquierdo', kind: 'orbit', name: 'Lateral izquierdo', shortName: 'Izquierdo', azimuthDeg: 90, elevationDeg: 4, distance: 1, fov: 30 },
    { id: 'lateral-derecho', kind: 'orbit', name: 'Lateral derecho', shortName: 'Derecho', azimuthDeg: -90, elevationDeg: 4, distance: 1, fov: 30 },
    { id: 'superior', kind: 'orbit', name: 'Superior', shortName: 'Superior', azimuthDeg: 0, elevationDeg: 85, distance: 1, fov: 30 },
    // Ojo del conductor detrás del volante (centro del aro en 0,36 · 1,00 · 0,60).
    { id: 'interior', kind: 'interior', name: 'Interior', shortName: 'Interior', position: [0.36, 1.25, 0.02], target: [0.18, 1.08, 0.9], fov: 70 },
  ],
  defaultViewId: 'tres-cuartos',

  pending: [
    'Nombres comerciales y descripciones definitivas de las piezas.',
    'Logotipo Volkswagen en SVG (hoy se usa un encabezado tipográfico provisional).',
    'Versión comercial (el modelo solo indica el año 2025).',
    'Carta de colores de pintura verificada (hoy solo el color original del modelo).',
    'Confirmar que la licencia Free Standard de Sketchfab cubre servir el GLB en una web pública.',
  ],
};
