'use client';

import { useEffect } from 'react';

export type TimerMode = 'focus' | 'break' | 'rest';

interface BackgroundControllerProps {
  mode: TimerMode;
}

export function BackgroundController({ mode }: BackgroundControllerProps) {
  useEffect(() => {
    const getSolidColor = () => {
      return fallbackColor;
    };

    const fallbackColor =
      mode === 'focus' ? '#34d399' : mode === 'break' ? '#fb923c' : '#fb7185';
    // Dynamically set <meta name="theme-color"> to match fallbackColor
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', fallbackColor);

    const solidColor = getSolidColor();

    // Set solid background color only
    document.documentElement.style.setProperty(
      'background',
      solidColor,
      'important'
    );
    document.documentElement.style.setProperty(
      'background-color',
      solidColor,
      'important'
    );

    // Ensure html and body always fill the viewport
    document.documentElement.style.setProperty(
      'min-height',
      '100vh',
      'important'
    );
    document.documentElement.style.setProperty('width', '100%', 'important');
    document.body.style.setProperty('min-height', '100vh', 'important');
    document.body.style.setProperty('width', '100%', 'important');

    // Cleanup on unmount
    return () => {
      document.documentElement.style.removeProperty('background');
      document.documentElement.style.removeProperty('background-color');
      document.documentElement.style.removeProperty('height');
      document.documentElement.style.removeProperty('width');
      document.documentElement.style.removeProperty('padding-top');
      document.documentElement.style.removeProperty('padding-bottom');
      document.documentElement.style.removeProperty('margin-top');
      document.documentElement.style.removeProperty('margin-bottom');
    };
  }, [mode]);

  // This component doesn't render anything visible
  return null;
}
