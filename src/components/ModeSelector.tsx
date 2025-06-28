'use client';

import { type TimerMode } from '@/app/page';
import { type ModeSelectorProps } from './types';
import { motion } from 'framer-motion';
import { useState, useCallback } from 'react';

export function ModeSelector({
  currentMode,
  onModeChange,
  isRunning,
}: ModeSelectorProps) {
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  const activeColor = 'bg-white/20 text-white border-white/30';

  const modes = [
    {
      id: 'focus',
      label: 'Focus',
      hoverColor:
        'hover:bg-emerald-400/60 hover:border-emerald-300 hover:text-emerald-50 hover:shadow-md hover:shadow-black/20',
    },
    {
      id: 'break',
      label: 'Break',
      hoverColor:
        'hover:bg-orange-400/60 hover:border-orange-300 hover:text-orange-50 hover:shadow-md hover:shadow-black/20',
    },
    {
      id: 'rest',
      label: 'Rest',
      hoverColor:
        'hover:bg-rose-400/60 hover:border-rose-300 hover:text-rose-50 hover:shadow-md hover:shadow-black/20',
    },
  ];

  const handleMouseDown = useCallback(
    (id: string) => {
      if (!isRunning && currentMode !== id) {
        setPressedButton(id);
        onModeChange(id as TimerMode);
      }
    },
    [currentMode, onModeChange, isRunning]
  );

  const handleMouseUp = useCallback(() => {
    setPressedButton(null);
  }, []);

  return (
    <div className='flex w-full gap-3 p-3'>
      {modes.map(item => {
        const isActive = currentMode === item.id;
        const isPressed = pressedButton === item.id;

        return (
          <motion.button
            key={item.id}
            onMouseDown={() => handleMouseDown(item.id)}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => {}} // prevents double trigger because of mouse down
            disabled={isRunning}
            className={`relative min-w-0 flex-1 overflow-hidden rounded-2xl border px-3 py-3 text-sm font-semibold backdrop-blur-xl ${
              isPressed
                ? 'border-white/30 bg-white/20 text-white' // prioritize the pressed style
                : isActive
                  ? activeColor
                  : `border-white/15 bg-white/5 text-white/40 ${!isRunning ? item.hoverColor : ''}`
            } ${isRunning ? 'cursor-not-allowed opacity-60' : 'cursor-pointer opacity-100'} `}
            animate={{
              scale: isPressed || isActive ? 0.9 : 1.0,
            }}
            whileHover={
              !isRunning && !isActive && !isPressed ? { scale: 0.95 } : {}
            }
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
              mass: 1.0,
            }}
          >
            <div className='flex flex-col items-center gap-1'>
              <span className='text-xs font-medium uppercase tracking-wide'>
                {item.label}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
