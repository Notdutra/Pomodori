'use client';

import { motion } from 'framer-motion';
import { X, Volume2, VolumeX } from 'lucide-react';

interface PomodoroSettings {
  focusDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  soundEnabled: boolean;
}

interface SettingsPanelProps {
  settings: PomodoroSettings;
  onSettingsChange: (settings: PomodoroSettings) => void;
  onClose: () => void;
}

export function SettingsPanel({
  settings,
  onSettingsChange,
  onClose,
}: SettingsPanelProps) {
  const updateSetting = (
    key: keyof PomodoroSettings,
    value: number | boolean
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const formatMinutes = (seconds: number) => Math.floor(seconds / 60);
  const handleMinutesChange = (
    key: keyof PomodoroSettings,
    minutes: number
  ) => {
    updateSetting(key, minutes * 60);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}>
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        className="relative w-full max-w-md glass-strong rounded-3xl p-8"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-white">Settings</h2>
          <motion.button
            onClick={onClose}
            className="p-2 glass-subtle rounded-xl hover:glass transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}>
            <X className="w-5 h-5 text-white/70" />
          </motion.button>
        </div>

        {/* Settings */}
        <div className="space-y-6">
          {/* Timer durations */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white/90">
              Timer Durations
            </h3>

            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <label className="text-white/70">Focus</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formatMinutes(settings.focusDuration)}
                    onChange={(e) =>
                      handleMinutesChange(
                        'focusDuration',
                        parseInt(e.target.value) || 25
                      )
                    }
                    className="w-16 px-3 py-2 glass-subtle rounded-xl text-white text-center border-0 focus:ring-2 focus:ring-focus-500 bg-transparent"
                  />
                  <span className="text-white/60 text-sm">min</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-white/70">Short Break</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formatMinutes(settings.breakDuration)}
                    onChange={(e) =>
                      handleMinutesChange(
                        'breakDuration',
                        parseInt(e.target.value) || 5
                      )
                    }
                    className="w-16 px-3 py-2 glass-subtle rounded-xl text-white text-center border-0 focus:ring-2 focus:ring-break-500 bg-transparent"
                  />
                  <span className="text-white/60 text-sm">min</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-white/70">Long Break</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formatMinutes(settings.longBreakDuration)}
                    onChange={(e) =>
                      handleMinutesChange(
                        'longBreakDuration',
                        parseInt(e.target.value) || 15
                      )
                    }
                    className="w-16 px-3 py-2 glass-subtle rounded-xl text-white text-center border-0 focus:ring-2 focus:ring-longBreak-500 bg-transparent"
                  />
                  <span className="text-white/60 text-sm">min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Long break interval */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-white/90 font-medium">
                Long Break Interval
              </label>
              <p className="text-white/60 text-sm">
                After how many focus sessions
              </p>
            </div>
            <input
              type="number"
              min="2"
              max="10"
              value={settings.longBreakInterval}
              onChange={(e) =>
                updateSetting(
                  'longBreakInterval',
                  parseInt(e.target.value) || 4
                )
              }
              className="w-16 px-3 py-2 glass-subtle rounded-xl text-white text-center border-0 focus:ring-2 focus:ring-white/30 bg-transparent"
            />
          </div>

          {/* Sound toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-white/90 font-medium">
                Sound Notifications
              </label>
              <p className="text-white/60 text-sm">
                Play sound when timer completes
              </p>
            </div>
            <motion.button
              onClick={() =>
                updateSetting('soundEnabled', !settings.soundEnabled)
              }
              className={`p-3 rounded-xl transition-all duration-300 ${
                settings.soundEnabled
                  ? 'glass-strong text-white shadow-glow-focus'
                  : 'glass-subtle text-white/50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}>
              {settings.soundEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-white/50 text-sm text-center">
            Settings are automatically saved
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
