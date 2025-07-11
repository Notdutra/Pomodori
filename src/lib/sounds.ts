// Sound utility for playing UI sounds
export type SoundType =
  | 'menu'
  | 'close'
  | 'select'
  | 'deselect'
  | 'start'
  | 'pause'
  | 'reset'
  | 'save'
  | 'cancel'
  | 'deny'
  | 'complete';

// Allow playSound to accept either a SoundType or a direct file path (for alarms)
export type PlayableSound = SoundType | string;

const pop1 = '/sounds/pop_1.wav';
const pop2 = '/sounds/pop_2.wav';
const pop3 = '/sounds/pop_3.wav';
const pop4 = '/sounds/pop_4.wav';
const pop5 = '/sounds/pop_5.wav';
const special = '/sounds/special.wav';
const deny = '/sounds/deny.wav';

// Alarm sound options
export const ALARM_OPTIONS = [
  { value: '/sounds/alarm_1.wav', label: 'Alarm 1' },
  { value: '/sounds/alarm_2.wav', label: 'Alarm 2' },
  { value: '/sounds/alarm_3.wav', label: 'Alarm 3' },
  { value: '/sounds/alarm_4.wav', label: 'Alarm 4' },
  { value: '/sounds/alarm_5.wav', label: 'Alarm 5' },
  { value: '/sounds/alarm_6.wav', label: 'Alarm 6' },
  { value: '/sounds/alarm_7.wav', label: 'Alarm 7' },
] as const;

// Default alarm sound
export const DEFAULT_ALARM = ALARM_OPTIONS[0].value;

// Sound file mappings
const SOUND_FILES: Record<SoundType, string | string[]> = {
  close: pop1,
  cancel: pop1,

  deselect: pop2,

  select: pop3,

  menu: pop4,

  start: [pop3, pop5], // Two-sound sequence: pop3 then pop5
  pause: [pop5, pop2], // Two-sound sequence: pop5 then pop2

  save: pop5,

  deny: deny,

  reset: special,

  complete: DEFAULT_ALARM, // Will be updated dynamically based on user selection
};

// Timing delays for specific sounds (in milliseconds)
const SOUND_DELAYS: Record<string, number> = {
  [pop5]: 100, // pop5 gets shorter delay
  // Default delay for other sounds is 50ms
};

// Centralized volume settings per sound file
const VOLUME_SETTINGS: Record<string, number> = {
  '/sounds/pop_5.mp3': 1,
  '/sounds/special.mp3': 0.5,
  '/sounds/deny.mp3': 0.8,
  '/sounds/pop_1.wav': 0.8,
  '/sounds/pop_2.wav': 0.9,
  '/sounds/pop_3.wav': 0.9,
  '/sounds/pop_4.wav': 1.0,
  // Alarm volumes
  '/sounds/alarm_1.wav': 0.7,
  '/sounds/alarm_2.wav': 0.7,
  '/sounds/alarm_3.wav': 0.7,
  '/sounds/alarm_4.wav': 0.7,
  '/sounds/alarm_5.wav': 0.7,
  '/sounds/alarm_6.wav': 0.7,
  '/sounds/alarm_7.wav': 0.7,
};

class SoundManager {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private isSoundEnabled = true;

  constructor() {
    // Only preload sounds if we're in the browser
    if (typeof window !== 'undefined') {
      this.preloadSounds();
    }
  }

  private preloadSounds() {
    // Check if Audio is available (browser environment)
    if (typeof Audio === 'undefined') return;

    Object.values(SOUND_FILES).forEach(soundFile => {
      // Handle both single sounds and sound sequences
      const soundsToPreload = Array.isArray(soundFile)
        ? soundFile
        : [soundFile];

      soundsToPreload.forEach(file => {
        if (!this.audioCache.has(file)) {
          const audio = new Audio(file);
          audio.preload = 'auto';
          audio.volume = VOLUME_SETTINGS[file] || 0.5; // Use centralized volume
          this.audioCache.set(file, audio);
        }
      });
    });
  }

  setSoundEnabled(enabled: boolean) {
    this.isSoundEnabled = enabled;
  }

  isSoundEnabledValue() {
    return this.isSoundEnabled;
  }

  async playSound(sound: PlayableSound) {
    if (process.env.NODE_ENV === 'development') {
      // console.warn('[SoundManager] playSound called with:', sound);
    }
    // Check if we're in the browser and sound is enabled
    if (
      !this.isSoundEnabled ||
      typeof window === 'undefined' ||
      typeof Audio === 'undefined'
    ) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Sound blocked:', {
          soundEnabled: this.isSoundEnabled,
          window: typeof window,
          Audio: typeof Audio,
        });
      }
      return;
    }

    // If passed a file path (alarm), play directly
    if (typeof sound === 'string' && sound.startsWith('/sounds/alarm_')) {
      await this.playSingleSound(sound);
      return;
    }

    // Otherwise, treat as SoundType
    const soundFile = SOUND_FILES[sound as SoundType];

    // Handle sound sequences (arrays) vs single sounds
    if (Array.isArray(soundFile)) {
      // Play sounds in sequence with customizable delays
      for (let i = 0; i < soundFile.length; i++) {
        const file = soundFile[i];
        await this.playSingleSound(file);
        // Use custom delay for specific sounds, default to 50ms
        if (i < soundFile.length - 1) {
          const delay = SOUND_DELAYS[file] || 70;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    } else {
      // Play single sound
      await this.playSingleSound(soundFile);
    }
  }

  private async playSingleSound(soundFile: string) {
    if (process.env.NODE_ENV === 'development') {
      // console.warn('[SoundManager] playSingleSound called with:', soundFile);
    }
    const volume = VOLUME_SETTINGS[soundFile] || 0.5;
    let audio = this.audioCache.get(soundFile);

    if (!audio) {
      audio = new Audio(soundFile);
      audio.volume = volume;
      this.audioCache.set(soundFile, audio);
    }

    try {
      // Reset audio to start if it's already playing
      audio.currentTime = 0;
      audio.playbackRate = 1.0; // Always normal speed

      await audio.play();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Could not play sound:', error);
      }
    }
  }

  setVolume(volume: number) {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;

    // Volume should be between 0 and 1
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.audioCache.forEach(audio => {
      audio.volume = clampedVolume;
    });
  }

  setAlarmSound(alarmPath: string) {
    // Update the complete sound to use the selected alarm
    SOUND_FILES.complete = alarmPath;

    // Preload the new alarm sound if not already cached
    if (!this.audioCache.has(alarmPath)) {
      const audio = new Audio(alarmPath);
      audio.preload = 'auto';
      audio.volume = VOLUME_SETTINGS[alarmPath] || 0.7;
      this.audioCache.set(alarmPath, audio);
    }
  }
}

// Create a singleton instance
export const soundManager = new SoundManager();

// Convenience function for playing sounds
export const playSound = (sound: PlayableSound) => {
  soundManager.playSound(sound);
};
