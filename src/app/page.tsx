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
// (Not a hook, doesn't depend on state, just a pure function)
const getTransitionDirectionHelper = (from: TimerMode, to: TimerMode) => {
  const order = ['focus', 'break', 'rest'];
  const fromIdx = order.indexOf(from);
  const toIdx = order.indexOf(to);
  if (fromIdx === toIdx) return 'none';
  return toIdx > fromIdx ? 'right' : 'left';
};

export default function Timer() {
  // ===== ALL HOOKS FIRST - NO EXCEPTIONS =====
  // (This section is intentionally crammed: all state, refs, and hooks are grouped for quick scanning)
  // If you add a new state or ref, put it here!
  const [settings, setSettings, settingsError, settingsLoaded] =
    useSafeLocalStorage('pomodori-settings', defaultSettings); // persistent settings (localStorage)
  const [isSettingsButtonHovered, setIsSettingsButtonHovered] = useState(false); // UI: settings button hover state
  const [msLeft, setMsLeft] = useState(defaultSettings.focusDuration * 1000); // ms left on timer (main state)
  const [pausedTimeLeft, setPausedTimeLeft] = useState<number | null>(null); // ms left when paused
  const [completedSessions, setCompletedSessions] = useState(0); // how many pomodoros completed
  const [prevMode, setPrevMode] = useState<TimerMode>('focus'); // for background transition animation
  const [showSettings, setShowSettings] = useState(false); // settings panel open/close
  const targetEndTimeRef = useRef<number | null>(null); // used for robust timing (not always needed)
  const [mode, setMode] = useState<TimerMode>('focus'); // current mode (focus/break/rest)
  const [hasStarted, setHasStarted] = useState(false); // has timer started at least once?
  const [isRunning, setIsRunning] = useState(false); // is timer currently running?
  const startTimeRef = useRef<number | null>(null); // when did this session start?
  const durationRef = useRef<number | null>(null); // how long is this session (ms)?
  const endTimeRef = useRef<number | null>(null); // absolute end time (for title updates)
  const rafRef = useRef<number | null>(null); // requestAnimationFrame id (for cleanup)
  const hasStartedRef = useRef(hasStarted); // mirror of hasStarted for use in intervals
  const isRunningRef = useRef(isRunning); // mirror of isRunning for use in intervals
  const [, forceRerender] = useState(0); // force rerender for SVG ring animation
  const msLeftRef = useRef(msLeft); // mirror of msLeft for use in intervals
  const playSound = usePlaySound(); // custom hook for playing sounds
  const modeRef = useRef(mode); // mirror of mode for use in intervals
  // (If you add a new ref or state, keep it in this block for sanity!)

  // ALL useCallback hooks - define these before any useEffects that depend on them
  const handleModeChange = useCallback(
    (newMode: TimerMode) => {
      if (mode === newMode) return;
      handleModeChangeHelper(newMode);
    },
    [mode, settings]
  );

  const autoStartMode = useCallback(
    (newMode: TimerMode) => autoStartModeHelper(newMode),
    [settings]
  );

  const handleTimerComplete = useCallback(() => {
    playSound(settings.alarmSound as any);
    setCompletedSessions(prev => calculateNextCompletedSessions(prev));
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
  // Initialize/Sync msLeft and pausedTimeLeft after settings are loaded or if mode/settings change
  useEffect(() => {
    if (settingsLoaded) {
      // Only update msLeft when mode or settings change, not when pausing
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
        // --- Keyboard navigation helpers ---
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

  // Update document.title with time left and mode every second, even when tab is not focused
  // Title update: focused = reactive, unfocused = interval
  useEffect(() => {
    const originalTitle = document.title;
    function formatTime(ms: number) {
      const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
      const m = Math.floor(totalSeconds / 60)
        .toString()
        .padStart(2, '0');
      const s = (totalSeconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    }
    function updateTitleLocal(
      localMode: TimerMode,
      localIsRunning: boolean,
      localHasStarted: boolean,
      localMsLeft: number
    ) {
      let modeLabel = '';
      switch (localMode) {
        case 'focus':
          modeLabel = 'Focus';
          break;
        case 'break':
          modeLabel = 'Break';
          break;
        case 'rest':
          modeLabel = 'Rest';
          break;
        default:
          modeLabel = '';
      }
      let msLeftForTitle = localMsLeft;
      if (localIsRunning && endTimeRef.current) {
        msLeftForTitle = Math.max(0, endTimeRef.current - Date.now());
      }
      if (localIsRunning) {
        document.title = `${modeLabel} - ${formatTime(msLeftForTitle)}`;
      } else if (localHasStarted) {
        document.title = `${modeLabel} - Paused`;
      } else {
        document.title = `Pomodori - ${modeLabel}`;
      }
    }

    let intervalId: NodeJS.Timeout | null = null;
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        // On focus, update immediately with latest state
        updateTitleLocal(mode, isRunning, hasStarted, msLeft);
        // Stop interval if running
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } else {
        // On blur, start interval
        if (!intervalId) {
          intervalId = setInterval(() => {
            updateTitleLocal(
              modeRef.current,
              isRunningRef.current,
              hasStartedRef.current,
              msLeftRef.current
            );
          }, 1000);
        }
      }
    }

    // Initial setup
    intervalId = initializeTitleUpdater(
      updateTitleLocal,
      intervalId,
      handleVisibilityChange
    );

    return cleanupVisibilityHandler(
      intervalId,
      handleVisibilityChange,
      originalTitle
    );
  }, [mode, isRunning, hasStarted, msLeft]);

  // ===== EARLY RETURN AFTER ALL HOOKS =====
  if (!settingsLoaded) {
    return null;
  }

  // ===== DERIVED VALUES AND PURE CALCULATION HELPERS =====
  // (This section is for values that depend on state, and pure helpers)

  // Figure out which direction to animate the background (left/right/none)
  const transitionDirection = getTransitionDirectionHelper(prevMode, mode);

  // Progress for SVG ring (0-100)
  const progress = calcProgress(msLeft, getDurationMs());
  // Seconds left for display (rounded up)
  const displaySeconds = calcDisplaySeconds(msLeft);

  function autoStartModeHelper(newMode: TimerMode) {
    setMode(newMode);
    setHasStarted(true);
    setIsRunning(true);
    const newMs = getDurationByMode(newMode);
    setPausedTimeLeft(null);
    setMsLeft(newMs);
    targetEndTimeRef.current = Date.now() + newMs;
    startTimeRef.current = Date.now();
    durationRef.current = newMs;
  }

  function handleModeChangeHelper(newMode: TimerMode) {
    setPrevMode(mode);
    setMode(newMode);
    setIsRunning(false);
    setHasStarted(false);
    const newMs = getNewModeDuration(newMode);
    setPausedTimeLeft(newMs);
    setMsLeft(newMs);
    targetEndTimeRef.current = null;
  }

  function initializeTitleUpdater(
    updateTitleLocal: (
      localMode: TimerMode,
      localIsRunning: boolean,
      localHasStarted: boolean,
      localMsLeft: number
    ) => void,
    intervalId: NodeJS.Timeout | null,
    handleVisibilityChange: () => void
  ) {
    if (document.visibilityState === 'visible') {
      updateTitleLocal(mode, isRunning, hasStarted, msLeft);
    } else {
      intervalId = setInterval(() => {
        updateTitleLocal(
          modeRef.current,
          isRunningRef.current,
          hasStartedRef.current,
          msLeftRef.current
        );
      }, 1000);
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return intervalId;
  }

  function cleanupVisibilityHandler(
    intervalId: NodeJS.Timeout | null,
    handleVisibilityChange: () => void,
    originalTitle: string
  ): void | (() => void) {
    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.title = originalTitle;
    };
  }

  function getNewModeDuration(newMode: string) {
    return (() => {
      switch (newMode) {
        case 'focus':
          return settings.focusDuration * 1000; // Convert minutes to milliseconds
        case 'break':
          return settings.breakDuration * 1000; // Convert minutes to milliseconds
        case 'rest':
          return settings.restDuration * 1000; // Convert minutes to milliseconds
        default:
          return settings.focusDuration * 1000;
      }
    })();
  }

  function calculateNextCompletedSessions(prev: number) {
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
  }

  function getDurationByMode(newMode: string) {
    return (() => {
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
  }

  // ===== PURE CALCULATION HELPERS =====
  // (Don't need useCallback/useMemo, just pure math)
  function calcProgress(msLeft: number, durationMs: number) {
    if (durationMs <= 0) return 0; // avoid div by zero
    if (msLeft <= 0) return 100; // done
    return Math.min(100, Math.max(0, (1 - msLeft / durationMs) * 100));
  }

  function calcDisplaySeconds(msLeft: number) {
    return msLeft <= 0 ? 0 : Math.ceil(msLeft / 1000);
  }

  // ===== JSX RETURN (UI LAYOUT) =====
  // (This is the main render tree. If you want to find the UI, start here.)
  return (
    <ErrorBoundary>
      <div>
        {/* Animated background, changes with mode and direction */}
        <BackgroundController
          mode={mode}
          transitionDirection={transitionDirection}
        />
        {/* Main app container, handles background transitions and layout */}
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
          {/* Centered content area */}
          <div className='min-h-screen-safe flex flex-col items-center justify-center px-6 py-0'>
            {/* Header: Logo and Settings button */}
            <div className='w-full sm:mb-6 sm:w-full sm:max-w-4xl lg:max-w-6xl'>
              <div className='mb-2 flex w-full items-center justify-between sm:justify-between lg:relative lg:justify-center'>
                <div className='flex items-center gap-3'>
                  {/* Tomato logo icon */}
                  <TomatoIcon
                    mode={mode}
                    className='h-14 w-14 drop-shadow-xl sm:h-16 sm:w-16'
                  />
                  <h1 className='text-4xl font-bold leading-none tracking-tight text-white drop-shadow-2xl sm:text-6xl'>
                    Pomodori
                  </h1>
                </div>
                {/* Settings button (top right) */}
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

            {/* Mode selector (Focus/Break/Rest) */}
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

              {/* Timer display (SVG ring, time left, etc) */}
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

              {/* Sessions completed counter */}
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

              {/* Timer controls: Start/Pause/Resume and Reset */}
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

          {/* Settings panel (slides in/out) */}
          <SettingsPanel
            settings={settings}
            onSettingsChange={(newSettings: PomodoroSettings) => {
              // Check if the current mode's duration has changed
              const durationKey: keyof PomodoroSettings = getModeDurationKey();
              // compares the current timers duration with the new setting
              timerDurationChange(
                settings[durationKey],
                newSettings[durationKey]
              ); // If the duration has changed, reset the timer
              setSettings(newSettings); // Update settings in localStorage
            }}
            onClose={() => setShowSettings(false)}
            isVisible={showSettings}
          />
        </div>
      </div>
    </ErrorBoundary>
  );

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
        // Should never happen, but fallback for TS safety
        durationKey = 'focusDuration';
        break;
    }
    return durationKey;
  }

  function timerDurationChange(prevDuration: number, newDuration: number) {
    if (prevDuration !== newDuration) {
      // If the timer is running, stop it and reset
      if (isRunning) {
        setIsRunning(false);
        setHasStarted(false);
      }
      // Reset the timer to the new duration
      setPausedTimeLeft(newDuration * 1000);
      setMsLeft(newDuration * 1000);
      targetEndTimeRef.current = null;
    }
  }
}
