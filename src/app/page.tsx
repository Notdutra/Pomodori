'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { TimerDisplay } from '@/components/TimerDisplay';
import { ModeSelector } from '@/components/ModeSelector';
import { SettingsPanel } from '@/components/SettingsPanel';
import { TomatoIcon } from '@/components/TomatoIcon';
import { BackgroundController } from '@/components/BackgroundController';
import { usePlaySound } from '@/lib/useSounds';
import { useSafeLocalStorage } from '@/lib/useSafeLocalStorage';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export type TimerMode = 'focus' | 'break' | 'rest';

interface PomodoroSettings {
  focusDuration: number;
  breakDuration: number;
  restDuration: number;
  restInterval: number;
  soundEnabled: boolean;
  alarmSound: string;
  autoStartBreaks: boolean;
  autoStartPomodori: boolean;
}

const defaultSettings: PomodoroSettings = {
  focusDuration: 25 * 60,
  breakDuration: 5 * 60,
  restDuration: 15 * 60,
  restInterval: 4,
  soundEnabled: true,
  alarmSound: '/sounds/alarm_1.wav',
  autoStartBreaks: false,
  autoStartPomodori: false,
};

// Helper function that doesn't need to be inside the component or a hook
// as it's a pure calculation and doesn't rely on component state or props directly.
const getTransitionDirectionHelper = (from: TimerMode, to: TimerMode) => {
  const order = ['focus', 'break', 'rest'];
  const fromIdx = order.indexOf(from);
  const toIdx = order.indexOf(to);
  if (fromIdx === toIdx) return 'none';
  return toIdx > fromIdx ? 'right' : 'left';
};

export default function Timer() {
  // ===== ALL HOOKS FIRST - NO EXCEPTIONS =====
  const [settings, setSettings, settingsError, settingsLoaded] =
    useSafeLocalStorage('pomodori-settings', defaultSettings);

  const [prevMode, setPrevMode] = useState<TimerMode>('focus');
  const [mode, setMode] = useState<TimerMode>('focus');
  const [hasStarted, setHasStarted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSettingsButtonHovered, setIsSettingsButtonHovered] = useState(false); // NEW STATE FOR BUTTON
  const [completedSessions, setCompletedSessions] = useState(0);
  const [pausedTimeLeft, setPausedTimeLeft] = useState<number | null>(null);
  const [msLeft, setMsLeft] = useState(defaultSettings.focusDuration * 1000); // Initialize with default focus time
  const [, forceRerender] = useState(0);

  const isRunningRef = useRef(isRunning);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const durationRef = useRef<number | null>(null);
  const targetEndTimeRef = useRef<number | null>(null);
  const msLeftRef = useRef(msLeft);

  const playSound = usePlaySound();

  // ALL useCallback hooks - define these before any useEffects that depend on them
  const handleModeChange = useCallback(
    (newMode: TimerMode) => {
      if (mode === newMode) return;
      setPrevMode(mode);
      setMode(newMode);
      setIsRunning(false);
      setHasStarted(false);
      const newMs = (() => {
        switch (newMode) {
          case 'focus':
            return settings.focusDuration * 1000;
          case 'break':
            return settings.breakDuration * 1000;
          case 'rest':
            return settings.restDuration * 1000;
          default:
            return settings.focusDuration * 1000;
        }
      })();
      setPausedTimeLeft(newMs);
      setMsLeft(newMs);
      targetEndTimeRef.current = null;
    },
    [mode, settings]
  ); // Dependencies: mode, settings

  const autoStartMode = useCallback(
    (newMode: TimerMode) => {
      setMode(newMode); // Directly set mode
      setHasStarted(true);
      setIsRunning(true);
      const newMs = (() => {
        switch (newMode) {
          case 'focus':
            return settings.focusDuration * 1000;
          case 'break':
            return settings.breakDuration * 1000;
          case 'rest':
            return settings.restDuration * 1000;
          default:
            return settings.focusDuration * 1000;
        }
      })();
      setPausedTimeLeft(null);
      setMsLeft(newMs);
      targetEndTimeRef.current = Date.now() + newMs;
      startTimeRef.current = Date.now();
      durationRef.current = newMs;
    },
    [settings]
  );

  const handleTimerComplete = useCallback(() => {
    playSound(settings.alarmSound as any);
    setCompletedSessions(prev => {
      let nextCompleted = prev;
      let nextMode: TimerMode = mode;
      if (mode === 'focus') {
        nextCompleted = prev + 1;
        if (nextCompleted % settings.restInterval === 0) {
          nextMode = 'rest';
        } else {
          nextMode = 'break';
        }
        if (settings.autoStartBreaks) {
          autoStartMode(nextMode);
        } else {
          handleModeChange(nextMode); // Call the useCallback hook
        }
      } else if (mode === 'break' || mode === 'rest') {
        nextMode = 'focus';
        if (settings.autoStartPomodori) {
          autoStartMode(nextMode);
        } else {
          handleModeChange(nextMode); // Call the useCallback hook
        }
      }
      return nextCompleted;
    });
  }, [mode, settings, autoStartMode, handleModeChange, playSound]);

  // Helper to get current mode's duration
  const getDurationMs = useCallback(() => {
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
  }, [mode, settings]);

  const toggleTimer = useCallback(() => {
    const durationMs = getDurationMs(); // Use the memoized helper
    if (!isRunning) {
      setHasStarted(true);
      let baseMsLeft = pausedTimeLeft !== null ? pausedTimeLeft : msLeft;
      if (baseMsLeft > durationMs) baseMsLeft = durationMs;
      startTimeRef.current = Date.now();
      durationRef.current = baseMsLeft;
      setIsRunning(true);
      setPausedTimeLeft(null);
      setMsLeft(baseMsLeft);
      playSound('start');
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      let msNow = 0;
      if (startTimeRef.current != null && durationRef.current != null) {
        msNow = Math.max(
          0,
          durationRef.current - (Date.now() - startTimeRef.current)
        );
      } else {
        msNow = msLeft;
      }
      setPausedTimeLeft(msNow);
      setMsLeft(msNow);
      setIsRunning(false);
      playSound('pause');
      startTimeRef.current = null;
      durationRef.current = null;
    }
  }, [isRunning, pausedTimeLeft, msLeft, playSound, getDurationMs]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setHasStarted(false);
    playSound('reset');
    const newMs = getDurationMs(); // Use the memoized helper
    setPausedTimeLeft(newMs);
    setMsLeft(newMs);
    startTimeRef.current = null;
    durationRef.current = null;
  }, [playSound, getDurationMs]);

  // ALL useEffect hooks
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    msLeftRef.current = msLeft;
  }, [msLeft]);

  useEffect(() => {
    if (settingsError) {
      console.error('Settings error:', settingsError);
    }
  }, [settingsError]);

  // Initialize/Sync msLeft and pausedTimeLeft after settings are loaded or if mode/settings change
  useEffect(() => {
    if (settingsLoaded) {
      // Only update if not running OR if msLeft is still at its initial default and needs to be set from loaded settings
      if (!isRunning || msLeft === defaultSettings.focusDuration * 1000) {
        const newMs = getDurationMs();
        setMsLeft(newMs);
        setPausedTimeLeft(newMs);
      }
    }
  }, [settingsLoaded, isRunning, mode, settings, getDurationMs, msLeft]);

  // Animation loop using requestAnimationFrame
  useEffect(() => {
    if (!isRunningRef.current) return;
    let stopped = false;
    function frame() {
      if (stopped) return;
      let ms = 0;
      if (startTimeRef.current != null && durationRef.current != null) {
        ms = Math.max(
          0,
          durationRef.current - (Date.now() - startTimeRef.current)
        );
      } else {
        ms = 0;
      }
      msLeftRef.current = ms;
      setMsLeft(ms);
      forceRerender(v => v + 1);
      if (ms > 0 && isRunningRef.current) {
        rafRef.current = requestAnimationFrame(frame);
      } else if (ms <= 0) {
        setIsRunning(false);
        setMsLeft(0);
        forceRerender(v => v + 1);
        handleTimerComplete();
      }
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      stopped = true;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isRunning, handleTimerComplete]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const active = document.activeElement;
      const isInput =
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          (active as HTMLElement).isContentEditable);
      if (!showSettings && !isInput) {
        if (e.code === 'Space' || e.code === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleTimer();
        }

        if (!isRunning && !showSettings) {
          if (e.code === 'ArrowLeft' || e.key === 'ArrowLeft') {
            if (mode === 'break') {
              handleModeChange('focus');
              playSound('select');
            } else if (mode === 'rest') {
              handleModeChange('break');
              playSound('select');
            }
          }

          if (e.code === 'ArrowRight' || e.key === 'ArrowRight') {
            if (mode === 'focus') {
              handleModeChange('break');
              playSound('select');
            } else if (mode === 'break') {
              handleModeChange('rest');
              playSound('select');
            }
          }
        }
      }
      if (e.code === 'Escape' || e.key === 'Escape') {
        if (showSettings) {
          setShowSettings(false);
          playSound('menu');
        } else {
          setShowSettings(true);
          playSound('menu');
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSettings, isRunning, mode, playSound, toggleTimer, handleModeChange]);

  // ===== EARLY RETURN AFTER ALL HOOKS =====
  if (!settingsLoaded) {
    return null;
  }

  // ===== DERIVED VALUES AND JSX RENDER LOGIC =====
  // Call the helper function directly
  const transitionDirection = getTransitionDirectionHelper(prevMode, mode);

  const progress = calcProgress(msLeft, getDurationMs());
  const displaySeconds = calcDisplaySeconds(msLeft);

  // Simple pure functions (don't need useCallback or useMemo as they are pure calculations)
  function calcProgress(msLeft: number, durationMs: number) {
    if (durationMs <= 0) return 0;
    if (msLeft <= 0) return 100;
    return Math.min(100, Math.max(0, (1 - msLeft / durationMs) * 100));
  }

  function calcDisplaySeconds(msLeft: number) {
    return msLeft <= 0 ? 0 : Math.ceil(msLeft / 1000);
  }

  // ===== JSX RETURN =====
  return (
    <ErrorBoundary>
      <BackgroundController
        mode={mode}
        transitionDirection={transitionDirection}
      />
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
                onMouseEnter={() => setIsSettingsButtonHovered(true)}
                onMouseLeave={() => setIsSettingsButtonHovered(false)}
                className='rounded-2xl border border-white/30 bg-white/10 p-2.5 shadow-2xl backdrop-blur-xl transition-all duration-300 sm:p-3.5 lg:absolute lg:-right-4'
                aria-label='Open settings'
                style={{
                  boxShadow:
                    '0 8px 32px 0 rgba(31, 38, 135, 0.15), 0 1.5px 6px 0 rgba(0,0,0,0.10)',
                  // Dynamically apply scale based on showSettings and hovered state
                  transform: `scale(${
                    showSettings
                      ? 0.9 // Fixed scale when settings are open (you can adjust this)
                      : isSettingsButtonHovered
                        ? 0.95 // Scale on hover when settings are closed
                        : 1 // Default scale when not hovered and settings are closed
                  })`,
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
                  timeLeft={displaySeconds}
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

        <SettingsPanel
          settings={settings}
          onSettingsChange={(newSettings: PomodoroSettings) => {
            // Check if the current mode's duration has changed
            let durationKey: keyof PomodoroSettings | null = null;
            switch (mode) {
              case 'focus':
                durationKey = 'focusDuration';
                break;
              case 'break':
                durationKey = 'breakDuration';
                break;
              case 'rest':
                durationKey = 'restDuration';
                break;
            }
            const prevDuration = settings[durationKey!];
            const newDuration = newSettings[durationKey!];
            if (prevDuration !== newDuration) {
              if (isRunning) {
                setIsRunning(false);
                setHasStarted(false);
              }
              setPausedTimeLeft(newDuration * 1000);
              setMsLeft(newDuration * 1000);
              targetEndTimeRef.current = null;
            }
            setSettings(newSettings);
          }}
          onClose={() => setShowSettings(false)}
          isVisible={showSettings}
        />
      </div>
    </ErrorBoundary>
  );
}
