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

// ===== DEFAULT SETTINGS (used if nothing in localStorage) =====
const defaultSettings: PomodoroSettings = {
  focusDuration: 25 * 60, // default focus has 25 minutes in seconds
  breakDuration: 5 * 60, // default break has 5 minutes in seconds
  restDuration: 15 * 60, // default rest has 15 minutes in seconds
  restInterval: 4, // this is how many focus sessions to auto switch to rest, default at 4
  soundEnabled: true, // default sound enabled
  alarmSound: '/sounds/alarm_1.wav', // Default selected alarm
  autoStartBreaks: false, // default not to auto start breaks
  autoStartPomodori: false, // default not to auto start pomodori
};

// ===== PURE HELPER: Figure out animation direction for background transitions =====
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
  const [isSettingsButtonHovered, setIsSettingsButtonHovered] = useState(false);
  const [msLeft, setMsLeft] = useState(defaultSettings.focusDuration * 1000);
  const [pausedTimeLeft, setPausedTimeLeft] = useState<number | null>(null);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [prevMode, setPrevMode] = useState<TimerMode>('focus');
  const [showSettings, setShowSettings] = useState(false);
  const targetEndTimeRef = useRef<number | null>(null);
  const [mode, setMode] = useState<TimerMode>('focus');
  const [hasStarted, setHasStarted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const durationRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const hasStartedRef = useRef(hasStarted);
  const isRunningRef = useRef(isRunning);
  const [, forceRerender] = useState(0);
  const msLeftRef = useRef(msLeft);
  const playSound = usePlaySound();
  const modeRef = useRef(mode);

  // Remove unused state
  // const [safariBlurFix, setSafariBlurFix] = useState(0);

  // Title update function
  const updateTitle = useCallback(
    (
      currentMode: TimerMode,
      currentIsRunning: boolean,
      currentHasStarted: boolean,
      currentMsLeft: number
    ) => {
      function formatTime(ms: number) {
        const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
        const m = Math.floor(totalSeconds / 60)
          .toString()
          .padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
      }

      const modeLabel = {
        focus: 'Focus',
        break: 'Break',
        rest: 'Rest',
      }[currentMode];

      let msLeftForTitle = currentMsLeft;
      if (currentIsRunning && endTimeRef.current) {
        msLeftForTitle = Math.max(0, endTimeRef.current - Date.now());
      }

      if (currentIsRunning) {
        document.title = `${modeLabel} - ${formatTime(msLeftForTitle)}`;
      } else if (currentHasStarted) {
        document.title = `${modeLabel} - Paused`;
      } else {
        document.title = `Pomodori - ${modeLabel}`;
      }
    },
    []
  );

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

  // Helper functions for mode changes
  const autoStartModeHelper = useCallback(
    (newMode: TimerMode) => {
      setMode(newMode);
      setHasStarted(true);
      setIsRunning(true);

      const newMs = getDurationByMode(newMode);
      setPausedTimeLeft(null);
      setMsLeft(newMs);

      // Update refs immediately
      modeRef.current = newMode;
      isRunningRef.current = true;
      hasStartedRef.current = true;
      msLeftRef.current = newMs;

      targetEndTimeRef.current = Date.now() + newMs;
      startTimeRef.current = Date.now();
      durationRef.current = newMs;
      endTimeRef.current = Date.now() + newMs;

      // Immediately update title for auto-start
      updateTitle(newMode, true, true, newMs);
    },
    [settings, updateTitle]
  );

  const handleModeChangeHelper = useCallback(
    (newMode: TimerMode) => {
      setPrevMode(mode);
      setMode(newMode);
      setIsRunning(false);
      setHasStarted(false);

      // Update refs immediately
      modeRef.current = newMode;
      isRunningRef.current = false;
      hasStartedRef.current = false;

      const newMs = getNewModeDuration(newMode);
      setPausedTimeLeft(newMs);
      setMsLeft(newMs);
      msLeftRef.current = newMs;

      targetEndTimeRef.current = null;

      // Immediately update title for mode change without auto-start
      updateTitle(newMode, false, false, newMs);
    },
    [mode, settings, updateTitle]
  );

  const handleModeChange = useCallback(
    (newMode: TimerMode) => {
      if (mode === newMode) return;
      handleModeChangeHelper(newMode);
    },
    [mode, handleModeChangeHelper]
  );

  const handleTimerComplete = useCallback(() => {
    playSound(settings.alarmSound as any);
    setCompletedSessions(prev => {
      const nextCompleted = prev + (mode === 'focus' ? 1 : 0);
      let nextMode: TimerMode = mode;

      if (mode === 'focus') {
        nextMode =
          nextCompleted % settings.restInterval === 0 ? 'rest' : 'break';

        if (settings.autoStartBreaks) {
          setTimeout(() => autoStartModeHelper(nextMode), 0);
        } else {
          setTimeout(() => handleModeChangeHelper(nextMode), 0);
        }
      } else if (mode === 'break' || mode === 'rest') {
        nextMode = 'focus';

        if (settings.autoStartPomodori) {
          setTimeout(() => autoStartModeHelper(nextMode), 0);
        } else {
          setTimeout(() => handleModeChangeHelper(nextMode), 0);
        }
      }

      return nextCompleted;
    });
  }, [mode, settings, playSound, autoStartModeHelper, handleModeChangeHelper]);

  const toggleTimer = useCallback(() => {
    const durationMs = getDurationMs();
    if (!isRunning) {
      setHasStarted(true);
      let baseMsLeft = pausedTimeLeft !== null ? pausedTimeLeft : msLeft;
      if (baseMsLeft > durationMs) baseMsLeft = durationMs;
      startTimeRef.current = Date.now();
      durationRef.current = baseMsLeft;
      endTimeRef.current = Date.now() + baseMsLeft;
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
      endTimeRef.current = null;
    }
  }, [isRunning, pausedTimeLeft, msLeft, playSound, getDurationMs]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setHasStarted(false);
    playSound('reset');
    const newMs = getDurationMs();
    setPausedTimeLeft(newMs);
    setMsLeft(newMs);
    startTimeRef.current = null;
    durationRef.current = null;
  }, [playSound, getDurationMs]);

  // Sync refs with state
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    hasStartedRef.current = hasStarted;
  }, [hasStarted]);

  useEffect(() => {
    msLeftRef.current = msLeft;
  }, [msLeft]);

  useEffect(() => {
    if (settingsError) {
      console.error('Settings error:', settingsError);
    }
  }, [settingsError]);

  // Initialize/Sync msLeft and pausedTimeLeft after settings are loaded
  useEffect(() => {
    if (settingsLoaded) {
      const newMs = getDurationMs();
      setMsLeft(newMs);
      setPausedTimeLeft(newMs);
    }
  }, [settingsLoaded, mode, settings, getDurationMs]);

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

  // Background timer for when page is hidden
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    function updateTimer() {
      if (!isRunningRef.current) {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        return;
      }

      let ms = 0;
      if (startTimeRef.current != null && durationRef.current != null) {
        ms = Math.max(
          0,
          durationRef.current - (Date.now() - startTimeRef.current)
        );
      }

      msLeftRef.current = ms;
      setMsLeft(ms);

      // Always update title when running in background
      updateTitle(
        modeRef.current,
        isRunningRef.current,
        hasStartedRef.current,
        ms
      );

      // Check if timer completed
      if (ms <= 0) {
        setIsRunning(false);
        msLeftRef.current = 0;
        isRunningRef.current = false;
        setMsLeft(0);
        handleTimerComplete();
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        // Start background updates when page is hidden
        if (isRunningRef.current && !intervalId) {
          updateTimer();
          intervalId = setInterval(updateTimer, 1000);
        } else {
          // Even if not running, update title once when going to background
          updateTitle(
            modeRef.current,
            isRunningRef.current,
            hasStartedRef.current,
            msLeftRef.current
          );
        }
      } else {
        // Stop background updates when page is visible
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        // Immediate update when page becomes visible
        updateTitle(mode, isRunning, hasStarted, msLeft);
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start interval if page is already hidden and timer is running
    if (
      document.visibilityState === 'hidden' &&
      isRunningRef.current &&
      !intervalId
    ) {
      intervalId = setInterval(updateTimer, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mode, isRunning, hasStarted, msLeft, handleTimerComplete, updateTitle]);

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
        if (isPlayPauseKey(e)) {
          e.preventDefault();
          toggleTimer();
        }

        function isPlayPauseKey(e: KeyboardEvent) {
          return e.code === 'Space' || e.code === 'Enter' || e.key === ' ';
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

  // Immediate title update when state changes (for focused tab)
  useEffect(() => {
    if (document.visibilityState === 'visible') {
      updateTitle(mode, isRunning, hasStarted, msLeft);
    }
  }, [mode, isRunning, hasStarted, msLeft, updateTitle]);

  // ===== EARLY RETURN AFTER ALL HOOKS =====
  if (!settingsLoaded) {
    return null;
  }

  // ===== DERIVED VALUES AND PURE CALCULATION HELPERS =====
  const transitionDirection = getTransitionDirectionHelper(prevMode, mode);
  const progress = calcProgress(msLeft, getDurationMs());
  const displaySeconds = calcDisplaySeconds(msLeft);

  function getDurationByMode(newMode: string) {
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
  }

  function getNewModeDuration(newMode: string) {
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
  }

  // ===== PURE CALCULATION HELPERS =====
  function calcProgress(msLeft: number, durationMs: number) {
    if (durationMs <= 0) return 0;
    if (msLeft <= 0) return 100;
    return Math.min(100, Math.max(0, (1 - msLeft / durationMs) * 100));
  }

  function calcDisplaySeconds(msLeft: number) {
    return msLeft <= 0 ? 0 : Math.ceil(msLeft / 1000);
  }

  function getModeDurationKey() {
    let durationKey: keyof PomodoroSettings;
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
      default:
        durationKey = 'focusDuration';
        break;
    }
    return durationKey;
  }

  function timerDurationChange(prevDuration: number, newDuration: number) {
    if (prevDuration !== newDuration) {
      if (isRunning) {
        setIsRunning(false);
        setHasStarted(false);
      }
      setPausedTimeLeft(newDuration * 1000);
      setMsLeft(newDuration * 1000);
      targetEndTimeRef.current = null;
    }
  }

  // ===== JSX RETURN (UI LAYOUT) =====
  return (
    <ErrorBoundary>
      <div>
        <BackgroundController
          mode={mode}
          transitionDirection={transitionDirection}
        />
        <div
          key={mode}
          data-mode={mode} // Add data attribute for CSS targeting
          className='fixed inset-0 min-h-screen overflow-auto bg-transparent transition-colors duration-700 ease-in-out'
          style={{
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
            willChange: 'background-image, background-color',
          }}
        >
          <div
            className='min-h-screen-safe flex flex-col items-center justify-center px-6 py-0'
            key={mode} // Force re-render on mode change for Safari
          >
            <div className='w-full sm:mb-6 sm:w-full sm:max-w-4xl lg:max-w-6xl'>
              <div className='mb-2 flex w-full items-center justify-between sm:justify-between lg:static lg:justify-center'>
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
                  className='safari-blur-fix rounded-2xl border border-white/30 bg-white/10 p-2.5 shadow-2xl backdrop-blur-xl transition-all duration-300 sm:p-3.5 lg:absolute lg:-right-4'
                  aria-label='Open settings'
                  style={{
                    boxShadow:
                      '0 8px 32px 0 rgba(31, 38, 135, 0.15), 0 1.5px 6px 0 rgba(0,0,0,0.10)',
                    transform: `scale(${
                      showSettings ? 0.9 : isSettingsButtonHovered ? 0.95 : 1
                    })`,
                  }}
                >
                  <Settings className='h-4 w-4 text-white/60 drop-shadow-sm sm:h-5 sm:w-5' />
                </button>
              </div>
            </div>

            <div className='w-full max-w-sm space-y-6'>
              <div className='mb-6 flex items-center justify-center'>
                <div className='safari-blur-fix-2xl flex w-full max-w-[420px] items-center justify-center rounded-3xl border border-white/40 bg-white/20 px-4 py-1.5 shadow-[0_8px_40px_0_rgba(31,38,135,0.18)] backdrop-blur-2xl transition-all duration-500'>
                  <ModeSelector
                    currentMode={mode}
                    onModeChange={handleModeChange}
                    isRunning={isRunning}
                  />
                </div>
              </div>

              <div className='mb-8 flex justify-center'>
                <div className='safari-blur-fix-2xl rounded-full border border-white/40 bg-white/20 p-2 shadow-[0_8px_40px_0_rgba(31,38,135,0.18)] backdrop-blur-2xl'>
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

              <div className='safari-blur-fix-2xl mb-6 rounded-3xl border border-white/40 bg-white/20 p-4 shadow-[0_8px_40px_0_rgba(31,38,135,0.18)] backdrop-blur-2xl transition-all duration-500'>
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
                  className='safari-blur-fix-2xl flex flex-1 items-center justify-center gap-2 rounded-3xl border border-white/40 bg-white/20 px-0 py-4 text-base font-bold text-white shadow-[0_8px_40px_0_rgba(31,38,135,0.18)] backdrop-blur-2xl transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-white/30 active:scale-[0.98]'
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
                  className={`safari-blur-fix-2xl flex items-center justify-center gap-2 rounded-3xl border border-white/40 bg-white/20 px-6 py-4 text-base font-semibold text-white shadow-[0_8px_40px_0_rgba(31,38,135,0.18)] backdrop-blur-2xl transition-all duration-300 ease-out ${
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
              const durationKey: keyof PomodoroSettings = getModeDurationKey();
              timerDurationChange(
                settings[durationKey],
                newSettings[durationKey]
              );
              setSettings(newSettings);
            }}
            onClose={() => setShowSettings(false)}
            isVisible={showSettings}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
