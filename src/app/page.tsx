'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { TimerDisplay } from '@/components/TimerDisplay';
import { ModeSelector } from '@/components/ModeSelector';
import { SettingsPanel } from '@/components/SettingsPanel';
import { TomatoIcon } from '@/components/TomatoIcon';
import { BackgroundController } from '@/components/BackgroundController';
import { usePlaySound } from '@/lib/useSounds';

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

export default function Timer() {
  // Track previous mode to determine transition direction
  const [prevMode, setPrevMode] = useState<TimerMode>('focus');
  const getTransitionDirection = (from: TimerMode, to: TimerMode) => {
    // focus(0), break(1), rest(2)
    const order = ['focus', 'break', 'rest'];
    const fromIdx = order.indexOf(from);
    const toIdx = order.indexOf(to);
    if (fromIdx === toIdx) return 'none';
    return toIdx > fromIdx ? 'right' : 'left';
  };
  const [mode, setMode] = useState<TimerMode>('focus');
  const transitionDirection = getTransitionDirection(prevMode, mode);
  const [hasStarted, setHasStarted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef = useRef(isRunning);
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const durationRef = useRef<number | null>(null);
  const [settings, setSettings] = useState<PomodoroSettings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [pausedTimeLeft, setPausedTimeLeft] = useState<number | null>(null);
  const playSound = usePlaySound();
  const targetEndTimeRef = useRef<number | null>(null);

  // --- Timer helpers ---
  const getDurationMs = () => {
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
  };

  // (getMsLeft was unused, removed)

  function calcProgress(msLeft: number, durationMs: number) {
    if (durationMs <= 0) return 0;
    if (msLeft <= 0) return 100;
    return Math.min(100, Math.max(0, (1 - msLeft / durationMs) * 100));
  }

  function calcDisplaySeconds(msLeft: number) {
    return msLeft <= 0 ? 0 : Math.ceil(msLeft / 1000);
  }

  // --- Timer state ---
  const [msLeft, setMsLeft] = useState(getDurationMs());
  const msLeftRef = useRef(msLeft);
  useEffect(() => {
    msLeftRef.current = msLeft;
  }, [msLeft]);
  // Dummy state to force re-render if React skips updates
  const [, forceRerender] = useState(0);

  // Handles mode changes (manual or automatic) and always sets prevMode for animation
  const handleModeChange = (newMode: TimerMode) => {
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
  };

  // Helper to auto start a mode (reset timer and start running)
  const autoStartMode = useCallback(
    (newMode: TimerMode) => {
      // Use functional updates to ensure correct state sequencing
      setMode(() => newMode);
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
      // Reset timer refs for new session
      startTimeRef.current = Date.now();
      durationRef.current = newMs;
    },
    [settings]
  );

  // Handles timer completion and auto-switching logic
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
          handleModeChange(nextMode);
        }
      } else if (mode === 'break' || mode === 'rest') {
        nextMode = 'focus';
        if (settings.autoStartPomodori) {
          autoStartMode(nextMode);
        } else {
          handleModeChange(nextMode);
        }
      }
      return nextCompleted;
    });
  }, [mode, settings, autoStartMode, handleModeChange, playSound]);

  // (timeLeft was unused, removed)

  const toggleTimer = () => {
    const durationMs = getDurationMs();
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
      // Calculate ms left at pause
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
  };

  const resetTimer = () => {
    setIsRunning(false);
    setHasStarted(false);
    playSound('reset');
    const newMs = getDurationMs();
    setPausedTimeLeft(newMs);
    setMsLeft(newMs);
    startTimeRef.current = null;
    durationRef.current = null;
  };

  // Keyboard shortcuts: Space toggles timer, Escape closes settings
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const active = document.activeElement;
      const isInput =
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          (active as HTMLElement).isContentEditable);
      if (!showSettings && !isInput) {
        // Space toggles timer
        if (e.code === 'Space' || e.code === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleTimer();
        }

        // if timer is not running and not in settings, allow mode changes
        if (!isRunning && !showSettings) {
          // Arrow navigation for timer modes
          if (e.code === 'ArrowLeft' || e.key === 'ArrowLeft') {
            if (mode === 'break') {
              handleModeChange('focus');
              playSound('menu');
            } else if (mode === 'rest') {
              handleModeChange('break');
              playSound('menu');
            }
          }

          if (e.code === 'ArrowRight' || e.key === 'ArrowRight') {
            if (mode === 'focus') {
              handleModeChange('break');
              playSound('menu');
            } else if (mode === 'break') {
              handleModeChange('rest');
              playSound('menu');
            }
          }
        }
      }
      // Escape open and closes settings
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
  }, [showSettings, toggleTimer, playSound, mode, handleModeChange]);

  // --- Animation loop using requestAnimationFrame ---
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
      forceRerender(v => v + 1); // Force re-render in case React skips
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
  }, [isRunning, mode, settings, pausedTimeLeft]);

  // --- Derived display values ---
  const durationMs = getDurationMs();
  const progress = calcProgress(msLeft, durationMs);
  const displaySeconds = calcDisplaySeconds(msLeft);

  return (
    <>
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

        {showSettings && (
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
          />
        )}
      </div>
    </>
  );
}
