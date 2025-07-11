'use client';
'use client';
import { useEffect } from 'react';
import type { TimerMode } from '@/app/page';

interface TimerDisplayProps {
  timeLeft: number;
  progress: number;
  mode: TimerMode;
  isRunning?: boolean;
  className?: string;
  hasStarted?: boolean;
}

export function TimerDisplay(props: TimerDisplayProps) {
  const {
    timeLeft,
    progress,
    mode,
    isRunning,
    hasStarted = false,
    className,
  } = props;
  // console.warn('[TimerDisplay] render', {
  //   timeLeft,
  //   progress,
  //   mode,
  //   isRunning,
  //   hasStarted,
  // });
  // Update document title based on mode and time left
  useEffect(() => {
    const formatTitleTime = (val: number) =>
      `${String(Math.floor(val / 60)).padStart(2, '0')}:${String(val % 60).padStart(2, '0')}`;
    const currentMode = mode.charAt(0).toUpperCase() + mode.slice(1);
    let title;
    if (hasStarted) {
      title = isRunning
        ? `${currentMode} - ${formatTitleTime(timeLeft)}`
        : 'Pomodori Paused';
    } else {
      title = `Pomodori ${currentMode}`;
    }
    document.title = title;
  }, [mode, isRunning, timeLeft, hasStarted]);
  // SVG ring constants
  const radius = 120;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const rotationOffset = -90;

  // Format time helpers
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  function formatTime(val: number) {
    return val.toString().padStart(2, '0');
  }

  const modeLabel = {
    focus: 'Focus',
    break: 'Break',
    rest: 'Rest',
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className='relative aspect-square h-full w-full overflow-hidden rounded-full bg-white/5 shadow-xl backdrop-blur-lg'>
        {/* Progress ring with gradient and glowing cap */}
        <svg
          className='absolute left-0 top-0 h-full w-full'
          viewBox={`0 0 ${radius * 2} ${radius * 2}`}
          style={{ pointerEvents: 'none' }}
        >
          <defs>
            <linearGradient
              id='progress-gradient'
              x1='0%'
              y1='0%'
              x2='100%'
              y2='0%'
            >
              {mode === 'focus' && (
                <>
                  <stop offset='0%' stopColor='#6ee7b7' />
                  <stop offset='100%' stopColor='#10b981' />
                </>
              )}
              {mode === 'break' && (
                <>
                  <stop offset='0%' stopColor='#fcd34d' />
                  <stop offset='100%' stopColor='#f97316' />
                </>
              )}
              {mode === 'rest' && (
                <>
                  <stop offset='0%' stopColor='#fda4af' />
                  <stop offset='100%' stopColor='#f43f5e' />
                </>
              )}
            </linearGradient>
            <filter id='glow' x='-50%' y='-50%' width='200%' height='200%'>
              <feGaussianBlur stdDeviation='2.2' result='coloredBlur' />
              <feMerge>
                <feMergeNode in='coloredBlur' />
                <feMergeNode in='SourceGraphic' />
              </feMerge>
            </filter>
          </defs>
          {/* Subtle background track for progress indication */}
          <circle
            stroke='rgba(255,255,255,0.13)'
            fill='transparent'
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle with gradient and glow */}
          <circle
            fill='transparent'
            stroke='url(#progress-gradient)'
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap='round'
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            transform={`rotate(${rotationOffset} ${radius} ${radius})`}
            style={{
              filter: 'url(#glow)',
              transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
          {/* Glowing cap at the tip of the progress arc */}
          {progress > 0 &&
            progress < 100 &&
            (() => {
              const angle =
                ((progress / 100) * 360 + rotationOffset) * (Math.PI / 180);
              const x = radius + normalizedRadius * Math.cos(angle);
              const y = radius + normalizedRadius * Math.sin(angle);
              let capColor = '#10b981';
              if (mode === 'break') capColor = '#f97316';
              if (mode === 'rest') capColor = '#f43f5e';
              return (
                <circle
                  cx={x}
                  cy={y}
                  r={strokeWidth / 2.5}
                  fill={capColor}
                  filter='url(#glow)'
                  style={{
                    opacity: 0.97,
                    transition:
                      'cx 0.5s cubic-bezier(0.4, 0, 0.2, 1), cy 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              );
            })()}
        </svg>

        {/* Timer text with premium typography */}
        <div className='absolute inset-0 flex flex-col items-center justify-center space-y-1'>
          <div
            className='text-[clamp(3.5rem,10vmin,4rem)] font-extralight tracking-tight text-white drop-shadow-lg'
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
