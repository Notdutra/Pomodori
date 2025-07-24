import React from 'react';

export function TomatoIcon({
  mode,
  className = '',
}: {
  mode: 'focus' | 'break' | 'rest';
  className?: string;
}) {
  // Single stroke color by mode
  let stroke = '';
  switch (mode) {
    case 'focus':
      stroke = 'stroke-emerald-800';
      break;
    case 'break':
      stroke = 'stroke-orange-800';
      break;
    case 'rest':
      stroke = 'stroke-rose-800';
      break;
  }
  return (
    <svg
      viewBox='0 0 48 48'
      className={`h-12 w-12 ${stroke} ${className}`}
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      focusable='false'
    >
      {/* Tomato body (outline only) */}
      <ellipse
        cx='24'
        cy='28'
        rx='16'
        ry='14'
        fill='rgba(0,0,0,0.20)'
        className={stroke}
        strokeWidth='2.2'
      />
      {/* Tomato stem (same stroke) */}
      <path
        d='M24 14c0-4 4-7 4-7s-2 2-4 2-4-2-4-2 4 3 4 7z'
        fill='none'
        className={stroke}
        strokeWidth='2.2'
      />
    </svg>
  );
}
