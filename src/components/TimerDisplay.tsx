'use client';

import { TimerMode } from '@/app/page';
import { useMemo } from 'react';

interface TimerDisplayProps {
  timeLeft: number;
  progress: number;
  mode: TimerMode;
  isRunning: boolean;
}

export function TimerDisplay({
  timeLeft,
  progress,
  mode,
  isRunning,
}: TimerDisplayProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  // Responsive sizing
  const radius = 100; // Base size
  const strokeWidth = 6;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const rotationOffset = -90; // Rotate the circle to start at the top

  const modeColors = {
    focus: {
      ring: '#10b981', // Green
      text: '#d1fae5',
    },
    break: {
      ring: '#fbbf24', // Yellow
      text: '#fef3c7',
    },
    longBreak: {
      ring: '#ef4444', // Red
      text: '#fee2e2',
    },
  };

  const currentColors = modeColors[mode];

  return (
    <div className="relative flex items-center justify-center w-full max-w-sm mx-auto">
      {/* Glass container */}
      <div className="relative glass-strong rounded-full p-8 sm:p-12 md:p-16 w-full aspect-square max-w-80 overflow-hidden">
        {/* Progress ring */}
        <svg
          className="absolute top-0 left-0 w-full h-full"
          viewBox={`0 0 ${radius * 2} ${radius * 2}`}
          style={{ pointerEvents: 'none' }}>
          {/* Background circle */}
          <circle
            stroke="rgba(255, 255, 255, 0.3)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle */}
          <circle
            stroke={currentColors.ring}
            fill="transparent"
            strokeWidth={strokeWidth + 2}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            transform={`rotate(${rotationOffset} ${radius} ${radius})`}
          />
        </svg>

        {/* Timer text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1 sm:space-y-2">
          <div
            className="text-4xl sm:text-5xl md:text-6xl font-thin text-white"
            style={{ fontFeatureSettings: '"tnum"' }}>
            {formatTime(minutes)}:{formatTime(seconds)}
          </div>

          <div
            className="text-xs sm:text-sm font-medium uppercase tracking-wider px-2 text-center"
            style={{ color: currentColors.text }}>
            {mode === 'focus'
              ? 'Focus Time'
              : mode === 'break'
              ? 'Short Break'
              : 'Long Break'}
          </div>
        </div>
      </div>
    </div>
  );
}
