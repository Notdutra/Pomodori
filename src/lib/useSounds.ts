'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  soundManager,
  playSound as playSoundUtil,
  type SoundType,
} from './sounds';

export function useSounds() {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  useEffect(() => {
    soundManager.setSoundEnabled(isSoundEnabled);
  }, [isSoundEnabled]);

  const playSound = useCallback((soundType: SoundType) => {
    playSoundUtil(soundType);
  }, []);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled(prev => !prev);
  }, []);

  const setSoundVolume = useCallback((volume: number) => {
    soundManager.setVolume(volume);
  }, []);

  return {
    isSoundEnabled,
    setIsSoundEnabled,
    toggleSound,
    playSound,
    setSoundVolume,
  };
}

// Hook for individual components that just need to play sounds
export function usePlaySound() {
  const { playSound } = useSounds();
  return playSound;
}
