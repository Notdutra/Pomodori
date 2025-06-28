'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { TimerDisplay } from '@/components/TimerDisplay';
import { ModeSelector } from '@/components/ModeSelector';
import { SettingsPanel } from '@/components/SettingsPanel';
import { TomatoIcon } from '@/components/TomatoIcon';

export type TimerMode = 'focus' | 'break' | 'rest';

interface PomodoroSettings {
  focusDuration: number;
  breakDuration: number;
  restDuration: number;
  restInterval: number;
  soundEnabled: boolean;
}

const defaultSettings: PomodoroSettings = {
  focusDuration: 25 * 60, // 25 minutes
  breakDuration: 5 * 60, // 5 minutes
  restDuration: 15 * 60, // 15 minutes
  restInterval: 4, // Every 4 focus sessions
  soundEnabled: true,
};

export default function Timer() {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(defaultSettings.focusDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [settings, setSettings] = useState<PomodoroSettings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('pomodori-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Basic validation that parsed object has the expected structure
        if (parsed && typeof parsed.focusDuration === 'number') {
          setSettings(parsed);
          setTimeLeft(parsed.focusDuration);
        }
      }
    } catch (error) {
      // If localStorage is corrupted, just use defaults
      console.error('Failed to load settings from localStorage:', error);
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pomodori-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }, [settings]);

  const handleTimerComplete = useCallback(() => {
    if (settings.soundEnabled) {
      // TODO: Add actual audio notification
    }

    if (mode === 'focus') {
      const newCompleted = completedSessions + 1;
      setCompletedSessions(newCompleted);

      // Switch to break mode
      const shouldUseRest = newCompleted % settings.restInterval === 0;
      const nextMode = shouldUseRest ? 'rest' : 'break';
      setMode(nextMode);
      setTimeLeft(
        shouldUseRest ? settings.restDuration : settings.breakDuration
      );
    } else {
      // Switch back to focus mode
      setMode('focus');
      setTimeLeft(settings.focusDuration);
    }
  }, [mode, completedSessions, settings]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer completed
      setIsRunning(false);
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, handleTimerComplete]);

  const handleModeChange = useCallback(
    (newMode: TimerMode) => {
      // Force immediate state update for better mobile responsiveness
      setIsRunning(false);
      setMode(newMode);

      // Use setTimeout to ensure state updates are applied
      setTimeout(() => {
        switch (newMode) {
          case 'focus':
            setTimeLeft(settings.focusDuration);
            break;
          case 'break':
            setTimeLeft(settings.breakDuration);
            break;
          case 'rest':
            setTimeLeft(settings.restDuration);
            break;
        }
      }, 0);
    },
    [settings.focusDuration, settings.breakDuration, settings.restDuration]
  );

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    switch (mode) {
      case 'focus':
        setTimeLeft(settings.focusDuration);
        break;
      case 'break':
        setTimeLeft(settings.breakDuration);
        break;
      case 'rest':
        setTimeLeft(settings.restDuration);
        break;
    }
  };

  const getDuration = () => {
    switch (mode) {
      case 'focus':
        return settings.focusDuration;
      case 'break':
        return settings.breakDuration;
      case 'rest':
        return settings.restDuration;
      default:
        return settings.focusDuration; // fallback
    }
  };

  const duration = getDuration();
  const progress = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;

  return (
    <div
      className={`gradient-transition relative min-h-screen overflow-hidden transition-colors duration-700 ease-in-out ${
        mode === 'focus'
          ? 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700'
          : mode === 'break'
            ? 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-700'
            : 'bg-gradient-to-br from-rose-400 via-rose-500 to-rose-700'
      }`}
    >
      {/* Settings button - premium floating */}
      <button
        onClick={() => setShowSettings(true)}
        className='fixed right-4 top-4 z-20 rounded-2xl border border-white/20 bg-white/5 p-3.5 shadow-2xl transition-all duration-500 hover:scale-105 hover:border-white/30 hover:bg-white/10 active:scale-90 sm:right-6 sm:top-6'
        aria-label='Open settings'
      >
        <Settings className='h-5 w-5 text-white/60 drop-shadow-sm' />
      </button>

      {/* Main container - clean centered layout */}
      <div className='flex min-h-screen flex-col items-center justify-center px-6 py-8'>
        <div className='w-full max-w-sm space-y-6'>
          {/* Title with tomato icon */}
          <div className='mb-8 text-center'>
            <div className='mb-2 flex items-center justify-center gap-3'>
              <TomatoIcon mode={mode} className='h-14 w-14 sm:h-16 sm:w-16' />
              <h1 className='text-5xl font-bold tracking-tight text-white drop-shadow-lg sm:text-6xl'>
                Pomodori
              </h1>
            </div>
          </div>

          {/* Mode selector - smaller */}
          <div>
            <ModeSelector
              currentMode={mode}
              onModeChange={handleModeChange}
              isRunning={isRunning}
            />
          </div>

          {/* Timer - much larger and hero element */}
          <div className='mb-8 flex justify-center'>
            <TimerDisplay
              timeLeft={timeLeft}
              progress={progress}
              mode={mode}
              className='h-80 w-80 sm:h-96 sm:w-96'
            />
          </div>

          {/* Stats card - very compact */}
          <div className='mb-3 rounded-xl border border-white/30 bg-white/20 p-2 shadow-lg backdrop-blur-xl'>
            <div className='text-center'>
              <p className='mb-0.5 text-xs font-medium uppercase tracking-wider text-white/80'>
                Sessions Completed
              </p>
              <p className='text-lg font-bold text-white'>
                {completedSessions}
              </p>
            </div>
          </div>

          {/* Control buttons */}
          <div className='flex gap-4'>
            <button
              onClick={toggleTimer}
              className='flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/50 bg-white/90 px-8 py-4 text-base font-bold text-gray-800 shadow-lg backdrop-blur-xl transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-white active:scale-[0.98]'
            >
              {isRunning ? (
                <>
                  <Pause className='h-5 w-5' />
                  Pause
                </>
              ) : (
                <>
                  <Play className='h-5 w-5' />
                  Start
                </>
              )}
            </button>

            <button
              onClick={resetTimer}
              disabled={isRunning}
              className={`flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/20 px-6 py-4 text-base font-semibold text-white shadow-lg backdrop-blur-xl transition-all duration-300 ease-out ${
                isRunning
                  ? 'scale-95 cursor-not-allowed opacity-40 saturate-50'
                  : 'opacity-100 saturate-100 hover:scale-[1.02] hover:bg-white/30 hover:text-white active:scale-[0.98]'
              } `}
            >
              <RotateCcw className='h-5 w-5' />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSettingsChange={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
