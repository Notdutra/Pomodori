'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { TimerDisplay } from '@/components/TimerDisplay';
import { ModeSelector } from '@/components/ModeSelector';
import { SettingsPanel } from '@/components/SettingsPanel';

export type TimerMode = 'focus' | 'break' | 'longBreak';

interface PomodoroSettings {
  focusDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  soundEnabled: boolean;
}

const defaultSettings: PomodoroSettings = {
  focusDuration: 25 * 60, // 25 minutes
  breakDuration: 5 * 60, // 5 minutes
  longBreakDuration: 15 * 60, // 15 minutes
  longBreakInterval: 4, // Every 4 focus sessions
  soundEnabled: true,
};

export default function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(defaultSettings.focusDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [settings, setSettings] = useState<PomodoroSettings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('pomodoro-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      setTimeLeft(parsed.focusDuration);
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoro-settings', JSON.stringify(settings));
  }, [settings]);

  const handleTimerComplete = useCallback(() => {
    if (settings.soundEnabled) {
      // Play completion sound (you can add actual audio later)
      console.log('Timer completed!');
    }

    if (mode === 'focus') {
      const newCompleted = completedSessions + 1;
      setCompletedSessions(newCompleted);

      // Switch to break mode
      const shouldUseLongBreak =
        newCompleted % settings.longBreakInterval === 0;
      const nextMode = shouldUseLongBreak ? 'longBreak' : 'break';
      setMode(nextMode);
      setTimeLeft(
        shouldUseLongBreak ? settings.longBreakDuration : settings.breakDuration
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
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer completed
      setIsRunning(false);
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, handleTimerComplete]);

  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);

    switch (newMode) {
      case 'focus':
        setTimeLeft(settings.focusDuration);
        break;
      case 'break':
        setTimeLeft(settings.breakDuration);
        break;
      case 'longBreak':
        setTimeLeft(settings.longBreakDuration);
        break;
    }
  };

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
      case 'longBreak':
        setTimeLeft(settings.longBreakDuration);
        break;
    }
  };

  const getDuration = () => {
    switch (mode) {
      case 'focus':
        return settings.focusDuration;
      case 'break':
        return settings.breakDuration;
      case 'longBreak':
        return settings.longBreakDuration;
    }
  };

  const progress = ((getDuration() - timeLeft) / getDuration()) * 100;

  return (
    <div
      className={`min-h-screen transition-all duration-1000 ${
        mode === 'focus'
          ? 'bg-gradient-to-br from-green-900 to-green-800'
          : mode === 'break'
          ? 'bg-gradient-to-br from-yellow-900 to-yellow-800'
          : 'bg-gradient-to-br from-red-900 to-red-800'
      }`}>
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        {/* Settings button */}
        <button
          onClick={() => setShowSettings(true)}
          className="absolute top-6 right-6 p-3 glass-subtle rounded-2xl hover:glass transition-all duration-300">
          <Settings className="w-6 h-6 text-white/80" />
        </button>

        {/* Session counter */}
        <div className="glass-subtle rounded-2xl px-6 py-3 mb-8">
          <p className="text-white/60 text-sm font-medium">
            Sessions completed:{' '}
            <span className="text-white font-semibold">
              {completedSessions}
            </span>
          </p>
        </div>

        {/* Mode selector */}
        <ModeSelector
          currentMode={mode}
          onModeChange={handleModeChange}
          isRunning={isRunning}
        />

        {/* Timer display */}
        <TimerDisplay
          timeLeft={timeLeft}
          progress={progress}
          mode={mode}
          isRunning={isRunning}
        />

        {/* Control buttons */}
        <div className="flex gap-4 mt-12">
          <button
            onClick={toggleTimer}
            className={`flex items-center gap-3 px-8 py-4 glass-strong rounded-2xl font-semibold text-white transition-all duration-300 border-2 ${
              mode === 'focus'
                ? 'border-green-900'
                : mode === 'break'
                ? 'border-yellow-900'
                : 'border-red-900'
            }`}>
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start
              </>
            )}
          </button>

          <button
            onClick={resetTimer}
            className="flex items-center gap-3 px-6 py-4 glass-subtle rounded-2xl font-semibold text-white/70 hover:text-white transition-all duration-300">
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
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
