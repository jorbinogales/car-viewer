import type { ReactNode, SVGProps } from 'react';

/**
 * Iconos de vista de cámara. Mismo contrato que lucide: 24 × 24, trazo 1.5,
 * `currentColor`, línea simple, sin relleno. Cada uno es una silueta del coche
 * vista desde el ángulo que activa. Una sola fuente: `ViewIcon`.
 */
type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & { size?: number; strokeWidth?: number };

const SIDE = 'M4.8 16.8H3.4a.9.9 0 0 1-.9-.9v-2.9c0-.5.3-.9.8-1.1l4.7-1.5 2.1-2.9c.3-.4.7-.6 1.2-.6h6.3c.5 0 .9.2 1.1.6l1.6 2.7c.2.3.3.6.3 1v4.6c0 .5-.4.9-.9.9H19.2M8.1 10.4h12.2M13.7 6.9v3.5M11.2 5.4h6.6M9 16.8h6';

const GLYPHS: Record<string, ReactNode> = {
  // Visto desde delante y a la izquierda: la cara frontal queda a la izquierda, el flanco a la derecha.
  'tres-cuartos': (
    <>
      <path d="M3 16.2V12l6.5 1.2L21 11.6v4M9.5 13.2v4.4M3 16.2l6.5 1.4 1.2-.2M14.1 16.8l2.9-.5M20.4 15.7l.6-.1" />
      <circle cx="12.4" cy="17.1" r="1.7" />
      <circle cx="18.7" cy="16" r="1.7" />
      <path d="M5.3 11.7 11.8 12.9 13 9.1 6.5 7.9ZM6.5 7.9l7-1 6.5 1.2 1 3.5M13 9.1l7-1M16.6 11.9l.1-3.6" />
    </>
  ),
  frente: (
    <>
      <path d="M5 16V12.2c0-.4.1-.7.2-1L6.7 8c.3-.7.9-1 1.6-1h7.4c.7 0 1.3.3 1.6 1l1.5 3.2c.1.3.2.6.2 1V16c0 .3-.2.5-.5.5H5.5c-.3 0-.5-.2-.5-.5Z" />
      <path d="M6.2 11h11.6M7.8 13.7h1.8M14.4 13.7h1.8" />
      <rect x="5.4" y="16.5" width="2.6" height="2.8" rx=".6" />
      <rect x="16" y="16.5" width="2.6" height="2.8" rx=".6" />
    </>
  ),
  trasera: (
    <>
      <path d="M5 16V12.2c0-.4.1-.7.2-1L6.7 8c.3-.7.9-1 1.6-1h7.4c.7 0 1.3.3 1.6 1l1.5 3.2c.1.3.2.6.2 1V16c0 .3-.2.5-.5.5H5.5c-.3 0-.5-.2-.5-.5Z" />
      <path d="M7.6 11.2 8.3 8.6h7.4l.7 2.6M6.6 13.2v2.4M17.4 13.2v2.4M10.2 13.4h3.6v1.8h-3.6z" />
      <rect x="5.4" y="16.5" width="2.6" height="2.8" rx=".6" />
      <rect x="16" y="16.5" width="2.6" height="2.8" rx=".6" />
    </>
  ),
  // Lado izquierdo del coche visto de frente al flanco: el morro apunta a la izquierda.
  'lateral-izquierdo': (
    <g transform="translate(.6 0)">
      <path d={SIDE} />
      <circle cx="7" cy="16.8" r="2" />
      <circle cx="17" cy="16.8" r="2" />
    </g>
  ),
  // Espejo del anterior: el morro apunta a la derecha.
  'lateral-derecho': (
    <g transform="matrix(-1 0 0 1 24.6 0)">
      <path d={SIDE} />
      <circle cx="7" cy="16.8" r="2" />
      <circle cx="17" cy="16.8" r="2" />
    </g>
  ),
  superior: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="4.5" />
      <path d="M8.7 9 9.4 6.4h5.2L15.3 9v7L14.6 18H9.4L8.7 16ZM8.7 9h6.6M8.7 16h6.6" />
      <path d="M5.4 5.8v3M18.6 5.8v3M5.4 15.2v3M18.6 15.2v3" />
    </>
  ),
  // Volante visto desde el asiento del conductor.
  interior: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M3.2 10.6c3.3.2 5.4.6 6.4 1.4M20.8 10.6c-3.3.2-5.4.6-6.4 1.4M12 14.4V21" />
    </>
  ),
};

export function ViewIcon({ viewId, size = 24, strokeWidth = 1.5, ...rest }: IconProps & { viewId: string }) {
  const glyph = GLYPHS[viewId];
  if (!glyph) return null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {glyph}
    </svg>
  );
}

/**
 * Iconos de apertura: planta mínima del coche (frente arriba) con UNA apertura resaltada
 * en trazo grueso. Cerrada = pegada al flanco; abierta = girada hacia fuera. Así el icono
 * dice qué apertura es y en qué estado está.
 */
const DOOR_LEN = 4.5;
const SWING = { x: DOOR_LEN * Math.sin(Math.PI / 3), y: DOOR_LEN * Math.cos(Math.PI / 3) };
// puerta: lado (-1 izquierda, 1 derecha) y bisagra delantera (y).
const DOORS: Record<string, { side: -1 | 1; y: number }> = {
  'puerta-di': { side: -1, y: 7 },
  'puerta-ti': { side: -1, y: 12.5 },
  'puerta-dd': { side: 1, y: 7 },
  'puerta-td': { side: 1, y: 12.5 },
};

export const hasOpeningIcon = (openingId: string) => openingId === 'porton' || openingId in DOORS;

export function OpeningIcon({ openingId, open, size = 24, strokeWidth = 1.5, ...rest }: IconProps & { openingId: string; open: boolean }) {
  const door = DOORS[openingId];
  let moving: ReactNode;
  if (door) {
    const x = door.side === -1 ? 7 : 17;
    const end = open ? `${x + door.side * SWING.x} ${door.y + SWING.y}` : `${x} ${door.y + DOOR_LEN}`;
    moving = <path d={`M${x} ${door.y}L${end}`} strokeWidth={3} />;
  } else if (openingId === 'porton') {
    moving = open ? <path d="M9 19v2.8M15 19v2.8M9 22.2h6" strokeWidth={2.4} /> : <path d="M9 19h6" strokeWidth={3} />;
  } else {
    return null;
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <rect x="7" y="2" width="10" height="17" rx="3.5" />
      <path d="M9.4 4.6h1.6M13 4.6h1.6" strokeWidth={1.2} />
      {moving}
    </svg>
  );
}

/** ¿Hay icono para esta vista? Si no, la barra cae a texto. */
export const hasViewIcon = (viewId: string) => viewId in GLYPHS;
