'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type TimerMode = 'focus' | 'break' | 'rest';

interface BackgroundControllerProps {
  mode: TimerMode;
  transitionDirection?: 'left' | 'right' | 'none';
  fadeDurationMs?: number;
}

// Helper function to interpolate between two colors
const interpolateColor = (
  color1: string,
  color2: string,
  factor: number
): string => {
  const rgb1 = color1.match(/\w\w/g)!.map(x => parseInt(x, 16));
  const rgb2 = color2.match(/\w\w/g)!.map(x => parseInt(x, 16));

  const r = Math.round(rgb1[0] + factor * (rgb2[0] - rgb1[0]));
  const g = Math.round(rgb1[1] + factor * (rgb2[1] - rgb1[1]));
  const b = Math.round(rgb1[2] + factor * (rgb2[2] - rgb1[2]));

  return `rgb(${r}, ${g}, ${b})`;
};

export function BackgroundController({
  mode,
  transitionDirection = 'none',
  fadeDurationMs = 400,
}: BackgroundControllerProps) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [fadeProgress, setFadeProgress] = useState(0);
  const [fromColor, setFromColor] = useState('');
  const [toColor, setToColor] = useState('');
  const [direction, setDirection] = useState<'left' | 'right' | 'none'>('none');

  const rafRef = useRef<number | null>(null);
  const prevModeRef = useRef<TimerMode>(mode);

  const getColor = (timerMode: TimerMode) => {
    switch (timerMode) {
      case 'focus':
        return '#34d399';
      case 'break':
        return '#fb923c';
      case 'rest':
        return '#fb7185';
    }
  };

  useEffect(() => {
    if (transitionDirection !== 'none' && prevModeRef.current !== mode) {
      setFromColor(getColor(prevModeRef.current));
      setToColor(getColor(mode));
      setDirection(transitionDirection);
      setShowOverlay(true);
      setFadeProgress(0);

      const startTime = performance.now();

      const animateFade = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / fadeDurationMs, 1);

        setFadeProgress(progress);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animateFade);
        } else {
          setShowOverlay(false);
        }
      };

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(animateFade);
    }

    prevModeRef.current = mode;

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mode, transitionDirection, fadeDurationMs]);

  useEffect(() => {
    const color = getColor(mode);
    document.body.style.transition = 'background-color 0.2s linear';
    document.body.style.backgroundColor = color;

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', color);
  }, [mode]);

  if (!showOverlay) return null;

  // Programmatically create as many sections as needed
  const numSections = 100; // Can be 1000 or any number
  const gradientStops: string[] = [];

  for (let i = 0; i <= numSections; i++) {
    const position = (i / numSections) * 100; // 0% to 100%
    const normalizedPosition = i / numSections; // 0 to 1

    // Calculate individual section timing based on direction
    let sectionStartTime, sectionDuration;

    if (direction === 'right') {
      // Right side starts first (position 1.0), left side starts last (position 0.0)
      sectionStartTime = (1 - normalizedPosition) * 0.3; // 0.3 is stagger amount
      sectionDuration = 0.7; // Each section takes 70% of total time to transform
    } else {
      // Left side starts first (position 0.0), right side starts last (position 1.0)
      sectionStartTime = normalizedPosition * 0.3;
      sectionDuration = 0.7;
    }

    // Calculate this section's individual transformation progress
    const sectionProgress = Math.max(
      0,
      Math.min(1, (fadeProgress - sectionStartTime) / sectionDuration)
    );

    // Smooth easing for each section
    const easedProgress =
      sectionProgress * sectionProgress * (3 - 2 * sectionProgress);

    // Interpolate color for this specific section
    const sectionColor = interpolateColor(fromColor, toColor, easedProgress);

    gradientStops.push(`${sectionColor} ${position}%`);
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: '-200px',
        left: '-200px',
        right: '-200px',
        bottom: '-200px',
        zIndex: -1,
        pointerEvents: 'none',
        background: `linear-gradient(90deg, ${gradientStops.join(', ')})`,
        filter: 'blur(80px)',
        willChange: 'background, filter',
      }}
    />,
    document.body
  );
}
