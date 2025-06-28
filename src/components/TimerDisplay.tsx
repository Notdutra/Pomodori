'use client';

import type { TimerMode } from '@/app/page';

interface TimerDisplayProps {
  timeLeft: number;
  progress: number;
  mode: TimerMode;
  className?: string;
}

export function TimerDisplay({
  timeLeft,
  progress,
  mode,
  className,
}: TimerDisplayProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  const radius = 50;
  const strokeWidth = 6;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;

  // Ensure progress is a valid number to avoid NaN
  const safeProgress = isNaN(progress)
    ? 0
    : Math.max(0, Math.min(100, progress));
  const strokeDashoffset = circumference - (safeProgress / 100) * circumference;

  const rotationOffset = -90;

  const modeRingClass = {
    focus: 'stroke-emerald-100',
    break: 'stroke-orange-100',
    rest: 'stroke-rose-100',
  };
  const modeLabel = {
    focus: 'Focus Time',
    break: 'Short Break',
    rest: 'Rest Time',
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className='relative aspect-square h-full w-full overflow-hidden rounded-full bg-white/5 shadow-xl backdrop-blur-lg'>
        {/* Progress ring */}
        <svg
          className='absolute left-0 top-0 h-full w-full'
          viewBox={`0 0 ${radius * 2} ${radius * 2}`}
          style={{ pointerEvents: 'none' }}
        >
          {/* Background circle */}
          <circle
            stroke='rgba(255, 255, 255, 0.15)'
            fill='transparent'
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle with enhanced styling */}
          <circle
            className={modeRingClass[mode]}
            fill='transparent'
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap='round'
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            transform={`rotate(${rotationOffset} ${radius} ${radius})`}
            style={{
              filter:
                mode === 'focus'
                  ? 'drop-shadow(0 0 8px #10b981) drop-shadow(0 0 16px #10b98150)'
                  : mode === 'break'
                    ? 'drop-shadow(0 0 8px #f97316) drop-shadow(0 0 16px #f9731650)'
                    : 'drop-shadow(0 0 8px #f43f5e) drop-shadow(0 0 16px #f43f5e50)',
              transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </svg>

        {/* Timer text with premium typography */}
        <div className='absolute inset-0 flex flex-col items-center justify-center space-y-1'>
          <div
            className='text-[clamp(2rem,5vmin,3rem)] font-extralight tracking-tight text-white drop-shadow-lg'
            style={{
              fontFeatureSettings: '"tnum"',
              textShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
            }}
          >
            {formatTime(minutes)}:{formatTime(seconds)}
          </div>

          <div
            className={`text-center text-[clamp(0.5rem,1.2vmin,0.75rem)] font-semibold uppercase tracking-widest opacity-90 ${
              mode === 'focus'
                ? 'text-emerald-100'
                : mode === 'break'
                  ? 'text-orange-100'
                  : 'text-rose-100'
            }`}
            style={{
              textShadow: '0 0 10px rgba(255, 255, 255, 0.2)',
            }}
          >
            {modeLabel[mode]}
          </div>
        </div>
      </div>
    </div>
  );
}
