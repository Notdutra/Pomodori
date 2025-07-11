'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { TimerDisplay } from '@/components/TimerDisplay';
import { ModeSelector } from '@/components/ModeSelector';
import { SettingsPanel } from '@/components/SettingsPanel';
import { TomatoIcon } from '@/components/TomatoIcon';
import { BackgroundController } from '@/components/BackgroundController';
import { usePlaySound } from '@/lib/useSounds';
import { soundManager } from '@/lib/sounds';

export type TimerMode = 'focus' | 'break' | 'rest';

interface PomodoroSettings {
  focusDuration: number;
  breakDuration: number;
  restDuration: number;
  restInterval: number;
  soundEnabled: boolean;
  alarmSound: string;
}

const defaultSettings: PomodoroSettings = {
  focusDuration: 25 * 60,
  breakDuration: 5 * 60,
  restDuration: 15 * 60,
  restInterval: 4,
  soundEnabled: true,
  alarmSound: '/sounds/alarm_1.wav',
};

export default function Timer() {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [hasStarted, setHasStarted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const rafRef = useRef<number | null>(null);
  const [settings, setSettings] = useState<PomodoroSettings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [pausedTimeLeft, setPausedTimeLeft] = useState<number | null>(null);
  const playSound = usePlaySound();
  const targetEndTimeRef = useRef<number | null>(null);

  const getDuration = () => {
    switch (mode) {
      case 'focus':
        return settings.focusDuration;
      case 'break':
        return settings.breakDuration;
      case 'rest':
        return settings.restDuration;
      default:
        return settings.focusDuration;
    }
  };

  const getCurrentTimeLeft = () => {
    if (isRunning && targetEndTimeRef.current) {
      return Math.max(targetEndTimeRef.current - Date.now(), 0);
    } else if (!isRunning && pausedTimeLeft !== null) {
      return pausedTimeLeft;
    } else {
      switch (mode) {
        case 'focus':
          return settings.focusDuration * 1000;
        case 'break':
          return settings.breakDuration * 1000;
        case 'rest':
          return settings.restDuration * 1000;
        default:
          return settings.focusDuration * 1000;
      }
    }
  };

  const [displayed, setDisplayed] = useState(() => {
    const msLeft = getCurrentTimeLeft();
    const seconds = Math.ceil(msLeft / 1000);
    const duration = getDuration() * 1000;
    const progress = duration > 0 ? ((duration - msLeft) / duration) * 100 : 0;
    return { seconds, progress };
  });

  const prevDurationsRef = useRef({
    focus: defaultSettings.focusDuration,
    break: defaultSettings.breakDuration,
    rest: defaultSettings.restDuration,
  });

  useEffect(() => {
    let shouldReset = false;
    switch (mode) {
      case 'focus':
        if (settings.focusDuration !== prevDurationsRef.current.focus) {
          shouldReset = true;
        }
        break;
      case 'break':
        if (settings.breakDuration !== prevDurationsRef.current.break) {
          shouldReset = true;
        }
        break;
      case 'rest':
        if (settings.restDuration !== prevDurationsRef.current.rest) {
          shouldReset = true;
        }
        break;
    }
    if (shouldReset) {
      setIsRunning(false);
      setPausedTimeLeft(null);
      switch (mode) {
        case 'focus':
          setPausedTimeLeft(settings.focusDuration * 1000);
          break;
        case 'break':
          setPausedTimeLeft(settings.breakDuration * 1000);
          break;
        case 'rest':
          setPausedTimeLeft(settings.restDuration * 1000);
          break;
      }
    }
    prevDurationsRef.current = {
      focus: settings.focusDuration,
      break: settings.breakDuration,
      rest: settings.restDuration,
    };
  }, [
    settings.focusDuration,
    settings.breakDuration,
    settings.restDuration,
    mode,
  ]);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('pomodori-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed && typeof parsed.focusDuration === 'number') {
          setSettings(parsed);
          setPausedTimeLeft(parsed.focusDuration * 1000);
        }
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('pomodori-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }, [settings]);

  useEffect(() => {
    soundManager.setAlarmSound(settings.alarmSound);
  }, [settings.alarmSound]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    function update() {
      const msLeft = getCurrentTimeLeft();
      const seconds = Math.ceil(msLeft / 1000);
      const duration = getDuration() * 1000;
      const progress =
        duration > 0 ? ((duration - msLeft) / duration) * 100 : 0;
      setDisplayed({ seconds, progress });
    }
    update();
    if (isRunning) {
      interval = setInterval(update, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isRunning,
    mode,
    settings.focusDuration,
    settings.breakDuration,
    settings.restDuration,
    pausedTimeLeft,
  ]);

  const handleTimerComplete = useCallback(() => {
    if (settings.soundEnabled) {
      soundManager.playSound('complete');
    }
    let nextMode: TimerMode;
    let nextDuration: number;
    if (mode === 'focus') {
      const newCompleted = completedSessions + 1;
      setCompletedSessions(newCompleted);
      const shouldUseRest = newCompleted % settings.restInterval === 0;
      nextMode = shouldUseRest ? 'rest' : 'break';
      nextDuration = shouldUseRest
        ? settings.restDuration
        : settings.breakDuration;
    } else if (mode === 'break' || mode === 'rest') {
      nextMode = 'focus';
      nextDuration = settings.focusDuration;
    } else {
      nextMode = 'focus';
      nextDuration = settings.focusDuration;
    }
    setMode(nextMode);
    setPausedTimeLeft(nextDuration * 1000);
    setIsRunning(false);
    setHasStarted(false);
    targetEndTimeRef.current = null;
  }, [mode, completedSessions, settings]);

  const handleModeChange = useCallback(
    (newMode: TimerMode) => {
      setIsRunning(false);
      setHasStarted(false);
      setPausedTimeLeft(null);
      switch (newMode) {
        case 'focus':
          setPausedTimeLeft(settings.focusDuration * 1000);
          break;
        case 'break':
          setPausedTimeLeft(settings.breakDuration * 1000);
          break;
        case 'rest':
          setPausedTimeLeft(settings.restDuration * 1000);
          break;
      }
      setMode(newMode);
    },
    [settings.focusDuration, settings.breakDuration, settings.restDuration]
  );

  const timeLeft = displayed.seconds;

  const toggleTimer = () => {
    if (!isRunning) {
      // Start or resume
      setHasStarted(true);
      let baseTimeLeft: number;
      if (pausedTimeLeft !== null) {
        baseTimeLeft = pausedTimeLeft;
      } else {
        // Use getCurrentTimeLeft() to get ms left
        baseTimeLeft = getCurrentTimeLeft();
      }
      // Clamp to new duration if paused time is greater than new duration
      let currentModeDurationMs = 0;
      switch (mode) {
        case 'focus':
          currentModeDurationMs = settings.focusDuration * 1000;
          break;
        case 'break':
          currentModeDurationMs = settings.breakDuration * 1000;
          break;
        case 'rest':
          currentModeDurationMs = settings.restDuration * 1000;
          break;
      }
      if (baseTimeLeft > currentModeDurationMs) {
        baseTimeLeft = currentModeDurationMs;
      }
      targetEndTimeRef.current = Date.now() + baseTimeLeft;
      setIsRunning(true);
      setPausedTimeLeft(null);
      playSound('start');
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (targetEndTimeRef.current) {
        const now = Date.now();
        const remaining = Math.max(targetEndTimeRef.current - now, 0);
        const rounded = Math.ceil(remaining / 1000) * 1000;
        setPausedTimeLeft(rounded);
      }
      setIsRunning(false);
      playSound('pause');
      targetEndTimeRef.current = null;
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setHasStarted(false);
    playSound('reset');
    let newTime = 0;
    switch (mode) {
      case 'focus':
        newTime = settings.focusDuration * 1000;
        break;
      case 'break':
        newTime = settings.breakDuration * 1000;
        break;
      case 'rest':
        newTime = settings.restDuration * 1000;
        break;
    }
    setPausedTimeLeft(newTime);
    targetEndTimeRef.current = null;
  };

  const progress = displayed.progress;

  useEffect(() => {
    if (isRunning && timeLeft === 0) {
      handleTimerComplete();
    }
  }, [isRunning, timeLeft, handleTimerComplete]);

  return (
    <>
      <BackgroundController mode={mode} />
      <div
        key={mode}
        className='fixed inset-0 min-h-screen overflow-auto bg-transparent transition-colors duration-700 ease-in-out'
        style={{
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
          WebkitTransform: 'translateZ(0)',
          transform: 'translateZ(0)',
          willChange: 'background-image, background-color',
        }}
      >
        <div className='min-h-screen-safe flex flex-col items-center justify-center px-6 py-0'>
          <div className='w-full sm:mb-6 sm:w-full sm:max-w-4xl lg:max-w-6xl'>
            <div className='mb-2 flex w-full items-center justify-between sm:justify-between lg:relative lg:justify-center'>
              <div className='flex items-center gap-3'>
                <TomatoIcon
                  mode={mode}
                  className='h-14 w-14 drop-shadow-xl sm:h-16 sm:w-16'
                />
                <h1 className='text-4xl font-bold leading-none tracking-tight text-white drop-shadow-2xl sm:text-6xl'>
                  Pomodori
                </h1>
              </div>
              <button
                onPointerDown={() => {
                  setShowSettings(true);
                  playSound('menu');
                }}
                className='rounded-2xl border border-white/30 bg-white/10 p-2.5 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:scale-105 hover:border-white/50 hover:bg-white/20 active:scale-90 sm:p-3.5 lg:absolute lg:-right-4'
                aria-label='Open settings'
                style={{
                  boxShadow:
                    '0 8px 32px 0 rgba(31, 38, 135, 0.15), 0 1.5px 6px 0 rgba(0,0,0,0.10)',
                }}
              >
                <Settings className='h-4 w-4 text-white/60 drop-shadow-sm sm:h-5 sm:w-5' />
              </button>
            </div>
          </div>

          <div className='w-full max-w-sm space-y-6'>
            <div className='mb-6 flex items-center justify-center'>
              <div className='flex w-full max-w-[420px] items-center justify-center rounded-3xl border border-white/40 bg-white/20 px-4 py-1.5 shadow-[0_8px_40px_0_rgba(31,38,135,0.18)] backdrop-blur-2xl transition-all duration-500'>
                <ModeSelector
                  currentMode={mode}
                  onModeChange={handleModeChange}
                  isRunning={isRunning}
                />
              </div>
            </div>

            <div className='mb-8 flex justify-center'>
              <div className='rounded-full border border-white/40 bg-white/20 p-2 shadow-[0_8px_40px_0_rgba(31,38,135,0.18)] backdrop-blur-2xl'>
                <TimerDisplay
                  timeLeft={displayed.seconds}
                  progress={progress}
                  mode={mode}
                  isRunning={isRunning}
                  hasStarted={!!hasStarted}
                  className='h-80 w-80 drop-shadow-xl sm:h-96 sm:w-96'
                />
              </div>
            </div>

            <div className='mb-6 rounded-3xl border border-white/40 bg-white/20 p-4 shadow-[0_8px_40px_0_rgba(31,38,135,0.18)] backdrop-blur-2xl transition-all duration-500'>
              <div className='text-center'>
                <p className='mb-0.5 text-xs font-medium uppercase tracking-wider text-white/80'>
                  Sessions Completed
                </p>
                <p className='text-lg font-bold text-white'>
                  {completedSessions}
                </p>
              </div>
            </div>

            <div className='flex gap-4'>
              <button
                onPointerDown={toggleTimer}
                className='flex flex-1 items-center justify-center gap-2 rounded-3xl border border-white/40 bg-white/20 px-0 py-4 text-base font-bold text-white shadow-[0_8px_40px_0_rgba(31,38,135,0.18)] backdrop-blur-2xl transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-white/30 active:scale-[0.98]'
              >
                {isRunning ? (
                  <>
                    <Pause className='h-5 w-5' />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className='h-5 w-5' />
                    {hasStarted ? 'Resume' : 'Start'}
                  </>
                )}
              </button>

              <button
                onPointerDown={resetTimer}
                disabled={isRunning}
                className={`flex items-center justify-center gap-2 rounded-3xl border border-white/40 bg-white/20 px-6 py-4 text-base font-semibold text-white shadow-[0_8px_40px_0_rgba(31,38,135,0.18)] backdrop-blur-2xl transition-all duration-300 ease-out ${
                  isRunning
                    ? 'scale-95 cursor-not-allowed opacity-40 saturate-50'
                    : 'opacity-100 saturate-100 hover:scale-[1.02] hover:bg-white/30 active:scale-[0.98]'
                } `}
              >
                <RotateCcw className='h-5 w-5' />
                {'Reset'}
              </button>
            </div>
          </div>
        </div>

        {showSettings && (
          <SettingsPanel
            settings={settings}
            onSettingsChange={setSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    </>
  );
}
{
  ('Reset');
}
