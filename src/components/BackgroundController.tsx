'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
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

  const getColor = useMemo(() => {
    return (timerMode: TimerMode) => {
      switch (timerMode) {
        case 'focus':
          return '#34d399'; // Green
        case 'break':
          return '#fb923c'; // Orange
        case 'rest':
          return '#fb7185'; // Pink/Red
      }
    };
  }, []);

  // useEffect to handle the transition animation (showOverlay logic)
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
  }, [mode, transitionDirection, fadeDurationMs, getColor]);

  // FINAL ATTEMPT useEffect for managing browser UI hints
  // useEffect(() => {
  //   if (typeof window === 'undefined' || typeof document === 'undefined') {
  //     return; // Only run in browser environment
  //   }

  //   const color = getColor(mode);
  //   const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  //   const isPWA =
  //     window.matchMedia('(display-mode: standalone)').matches ||
  //     (window.navigator as any).standalone;

  //   // --- Manage theme-color meta tag ---
  //   let metaThemeColor: HTMLMetaElement | null = document.querySelector(
  //     'meta[name="theme-color"]'
  //   );

  //   if (isSafari || isPWA) {
  //     console.log('using safari or PWA');
  //     // If Safari or PWA, ensure meta tag exists and set its content to the app's color
  //     if (!metaThemeColor) {
  //       metaThemeColor = document.createElement('meta');
  //       metaThemeColor.setAttribute('name', 'theme-color');
  //       document.head.appendChild(metaThemeColor);
  //     }
  //     metaThemeColor.setAttribute('content', color);
  //   } else {
  //     console.log('not using safari');

  //     // If NOT Safari/PWA (i.e., Chrome/Dia/etc. regular tab), try to force black theme-color
  //     if (!metaThemeColor) {
  //       metaThemeColor = document.createElement('meta');
  //       metaThemeColor.setAttribute('name', 'theme-color');
  //       document.head.appendChild(metaThemeColor);
  //     }
  //     metaThemeColor.setAttribute('content', '#000000'); // Explicitly force black
  //   }

  //   // --- Manage html/body background styles ---
  //   // Clear previous transitions (important for reset behavior)
  //   document.body.style.transition = '';
  //   document.documentElement.style.transition = '';

  //   if (isSafari) {
  //     // ONLY Safari gets the dynamic html/body background
  //     document.body.style.backgroundColor = color;
  //     document.body.style.background = color;
  //     document.documentElement.style.backgroundColor = color;
  //     document.documentElement.style.background = color;
  //   } else {
  //     // For Chrome/Dia/etc., explicitly ensure html/body background is reset to default.
  //     // This allows the browser's own default theme (which we are trying to influence with theme-color #000000)
  //     // to show through.
  //     document.body.style.backgroundColor = '';
  //     document.body.style.background = '';
  //     document.documentElement.style.backgroundColor = '';
  //     document.documentElement.style.background = '';
  //   }
  // }, [mode, getColor]);

  // Logic for the VISIBLE APP BACKGROUND rendered via createPortal.
  // This part guarantees your APP's content background is ALWAYS correct
  // and vibrant, regardless of browser.
  const currentSolidColor = getColor(mode);
  const numSections = 100;
  const gradientStops: string[] = [];

  if (showOverlay) {
    for (let i = 0; i <= numSections; i++) {
      const position = (i / numSections) * 100;
      const normalizedPosition = i / numSections;
      let sectionStartTime, sectionDuration;
      if (direction === 'right') {
        sectionStartTime = (1 - normalizedPosition) * 0.3;
        sectionDuration = 0.7;
      } else {
        sectionStartTime = normalizedPosition * 0.3;
        sectionDuration = 0.7;
      }
      const sectionProgress = Math.max(
        0,
        Math.min(1, (fadeProgress - sectionStartTime) / sectionDuration)
      );
      const easedProgress =
        sectionProgress * sectionProgress * (3 - 2 * sectionProgress);
      const sectionColor = interpolateColor(fromColor, toColor, easedProgress);
      gradientStops.push(`${sectionColor} ${position}%`);
    }
  }

  const backgroundStyle = showOverlay
    ? {
        background: `linear-gradient(90deg, ${gradientStops.join(', ')})`,
        filter: 'blur(80px)',
      }
    : {
        background: currentSolidColor,
        filter: 'blur(80px)',
      };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: '-1000px',
        left: '-1000px',
        right: '-1000px',
        bottom: '-1000px',
        minWidth: '300vw',
        minHeight: '300vh',
        zIndex: -1,
        pointerEvents: 'none',
        willChange: 'background, filter',
        ...backgroundStyle,
      }}
    />,
    document.body
  );
}
