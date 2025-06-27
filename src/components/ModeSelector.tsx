'use client';

import { TimerMode } from '@/app/page';

interface ModeSelectorProps {
  currentMode: TimerMode;
  onModeChange: (mode: TimerMode) => void;
  isRunning: boolean;
}

export function ModeSelector({
  currentMode,
  onModeChange,
  isRunning,
}: ModeSelectorProps) {
  const modes = [
    { id: 'focus', label: 'Focus', emoji: '🎯', color: 'bg-green-500' },
    { id: 'break', label: 'Break', emoji: '☕', color: 'bg-yellow-500' },
    { id: 'longBreak', label: 'Long Break', emoji: '🌙', color: 'bg-red-500' },
  ];

  return (
    <div className="flex glass-subtle rounded-2xl p-2 mb-12">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => !isRunning && onModeChange(mode.id as TimerMode)}
          disabled={isRunning}
          className={`
            relative px-6 py-3 rounded-xl font-medium transition-all duration-300
            ${
              currentMode === mode.id
                ? `${mode.color} text-white shadow-lg`
                : 'text-white/60 hover:text-white/80'
            }
            ${isRunning ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
          `}>
          {/* Content */}
          <span className="relative flex items-center gap-2 text-sm">
            <span className="text-lg">{mode.emoji}</span>
            {mode.label}
          </span>
        </button>
      ))}
    </div>
  );
}
