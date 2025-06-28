import React from 'react';

export function TomatoIcon({
  mode,
  className = '',
}: {
  mode: 'focus' | 'break' | 'rest';
  className?: string;
}) {
  // Color by mode
  let fill = '';
  let stroke = '';
  switch (mode) {
    case 'focus':
      fill = 'fill-emerald-500';
      stroke = 'stroke-emerald-800';
      break;
    case 'break':
      fill = 'fill-orange-500';
      stroke = 'stroke-orange-800';
      break;
    case 'rest':
      fill = 'fill-rose-500';
      stroke = 'stroke-rose-800';
      break;
  }
  return (
    <svg
      viewBox='0 0 48 48'
      className={`h-12 w-12 ${fill} ${stroke} ${className}`}
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      focusable='false'
    >
      {/* Tomato body */}
      <ellipse
        cx='24'
        cy='28'
        rx='16'
        ry='14'
        className={fill + ' ' + stroke}
        strokeWidth='2.5'
      />
      {/* Tomato stem */}
      <path
        d='M24 14c0-4 4-7 4-7s-2 2-4 2-4-2-4-2 4 3 4 7z'
        fill='none'
        className={stroke}
        strokeWidth='2.5'
      />
    </svg>
  );
}
