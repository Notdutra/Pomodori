import { type TimerMode } from '@/app/page';

export interface ModeSelectorProps {
  currentMode: TimerMode;
  onModeChange: (mode: TimerMode) => void;
  isRunning: boolean;
}

export interface Settings {
  focusDuration: number;
  breakDuration: number;
  restDuration: number;
  restInterval: number;
  soundEnabled: boolean;
  alarmSound: string;
  autoStartBreaks: boolean;
  autoStartPomodori: boolean;
}

export interface SettingsPanelProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onClose: () => void;
  isVisible: boolean;
}
