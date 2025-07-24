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
  // Detect Safari (not Chrome or Chromium-based)
  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent;
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(ua);
    setIsSafari(isSafariBrowser);
  }, []);
  // Show the 1px black bar only briefly after mount....this is done simply so i can use dia without this stupid top bar color sampling glitch
  const [showTopBar, setShowTopBar] = useState(true);
  useEffect(() => {
    if (isSafari) return;
    const timeout = setTimeout(() => setShowTopBar(false), 2000);
    return () => clearTimeout(timeout);
  }, [isSafari]);
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

  useEffect(() => {
    const color = getColor(mode);
    const prevHtmlBg = document.documentElement.style.background;
    const prevBodyBg = document.body.style.background;
    document.documentElement.style.background = color;
    document.body.style.background = color;
    return () => {
      document.documentElement.style.background = prevHtmlBg;
      document.body.style.background = prevBodyBg;
    };
  }, [mode, getColor]);

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
      }
    : {
        background: currentSolidColor,
      };

  return createPortal(
    <>
      {/* 1px fixed black bar at the very top for browser UI color sampling, except on Safari, and only briefly after mount */}
      {!isSafari && showTopBar && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: 1,
            background: '#000',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          pointerEvents: 'none',
          willChange: 'background',
          ...backgroundStyle,
        }}
      />
    </>,
    document.body
  );
}
