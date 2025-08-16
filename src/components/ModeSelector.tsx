'use client';

import { type TimerMode } from '@/app/page';
import { type ModeSelectorProps } from './types';
import { motion } from 'framer-motion';
import { useState, useCallback } from 'react';
import { usePlaySound } from '@/lib/useSounds';

export function ModeSelector({
  currentMode,
  onModeChange,
  isRunning,
}: ModeSelectorProps) {
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const playSound = usePlaySound();

  // Mode-specific active colors
  const activeColors: Record<string, string> = {
    focus: 'bg-emerald-400/60 text-emerald-50 border-emerald-200',
    break: 'bg-orange-400/60 text-orange-50 border-orange-200',
    rest: 'bg-rose-400/60 text-rose-50 border-rose-200',
  };
  // Even less white, more neutral inactive style
  const inactiveColors: Record<string, string> = {
    focus: 'bg-emerald-100/5 border-white/10 text-black/30',
    break: 'bg-orange-100/5 border-white/10 text-black/30',
    rest: 'bg-rose-100/5 border-white/10 text-black/30',
  };

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

  const handlePointerDown = useCallback(
    (id: string) => {
      if (!isRunning && currentMode !== id) {
        playSound('select');
        setPressedButton(id);
        onModeChange(id as TimerMode);
      } else if (isRunning) {
        playSound('deny');
      }
    },
    [currentMode, onModeChange, isRunning, playSound]
  );

  const handlePointerUp = useCallback(() => {
    setPressedButton(null);
  }, []);

  return (
    <div className='flex w-full gap-3 p-3'>
      {modes.map(item => {
        const isActive = currentMode === item.id;
        const isPressed = pressedButton === item.id;

        return (
          <motion.button
            key={`${item.id}-${currentMode}`}
            onPointerDown={() => handlePointerDown(item.id)}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            // Don't disable the button - we want to handle clicks manually
            className={`mode-selector-button relative min-w-0 flex-1 overflow-hidden rounded-2xl border px-3 py-3 text-sm font-semibold backdrop-blur-xl ${
              isPressed
                ? activeColors[item.id]
                : isActive
                  ? activeColors[item.id]
                  : `${inactiveColors[item.id]} ${!isRunning ? item.hoverColor : ''}`
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
            // iOS Safari optimizations
            style={{
              WebkitTapHighlightColor: 'transparent',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              touchAction: 'manipulation',
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
