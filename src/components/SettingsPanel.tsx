import { X } from 'lucide-react';
import { useState, useRef } from 'react';
import { type Settings, type SettingsPanelProps } from './types';
import { usePlaySound } from '@/lib/useSounds';
import { ALARM_OPTIONS } from '@/lib/sounds';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function SettingsPanel({
  settings,
  onSettingsChange,
  onClose,
}: SettingsPanelProps) {
  const playSound = usePlaySound();

  // Local state for each input as string
  const [focusInput, setFocusInput] = useState(() =>
    String(Math.floor(settings.focusDuration / 60))
  );
  const [breakInput, setBreakInput] = useState(() =>
    String(Math.floor(settings.breakDuration / 60))
  );
  const [restInput, setRestInput] = useState(() =>
    String(Math.floor(settings.restDuration / 60))
  );
  const [restIntervalInput, setRestIntervalInput] = useState(() =>
    String(settings.restInterval)
  );

  // Sync local state if settings change from outside
  // (optional, but good for consistency)
  // Could use useEffect here if needed

  const updateSetting = (
    key: keyof Settings,
    value: number | boolean | string
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  // State to control dropdown open/close
  const [alarmDropdownOpen, setAlarmDropdownOpen] = useState(false);

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8'>
      <div
        className='absolute inset-0 backdrop-blur-sm'
        /* Overlay no longer closes modal on click */
      />
      <div className='relative flex w-full max-w-md items-center justify-center'>
        {/* Subtle dark overlay just behind the modal */}
        <div className='pointer-events-none absolute inset-0 z-0 rounded-3xl bg-neutral-600/50' />
        <div
          className='relative z-10 w-full overflow-hidden rounded-3xl border border-white/20 bg-white/5 shadow-2xl backdrop-blur-3xl'
          onPointerDown={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className='flex items-center justify-between p-6 pb-4'>
            <h2 className='text-2xl font-bold text-white'>Settings</h2>
            <button
              onPointerDown={() => {
                onClose();
                playSound('close');
              }}
              className='rounded-full p-2 transition-all duration-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30'
            >
              <X className='h-5 w-5 text-white/70 hover:text-white' />
            </button>
          </div>

          {/* Settings Content */}
          <div className='px-6 pb-6'>
            {/* Timer Duration Section */}
            <div className='mb-8'>
              <h3 className='mb-4 text-lg font-medium text-white/90'>
                Timer Duration (minutes)
              </h3>

              <div className='space-y-4'>
                {/* Focus Time */}
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-white/70'>
                    Focus Time
                  </label>
                  <div className='flex items-center rounded-2xl border border-white/20 bg-white/10 px-2 py-1'>
                    <button
                      type='button'
                      aria-label='Decrease focus time'
                      className='flex h-9 w-9 items-center justify-center rounded-l-2xl text-xl text-white transition-colors hover:bg-white/10 active:bg-white/20 disabled:opacity-40'
                      onClick={() => {
                        const num = parseInt(focusInput) || 1;
                        if (num > 1) {
                          setFocusInput(String(num - 1));
                          updateSetting('focusDuration', (num - 1) * 60);
                          playSound('deselect');
                        }
                      }}
                      onPointerDown={e => {
                        if (parseInt(focusInput) <= 1) {
                          playSound('deny');
                          e.preventDefault();
                        }
                      }}
                      disabled={parseInt(focusInput) <= 1}
                    >
                      &minus;
                    </button>
                    {/** Editable value for Focus Time */}
                    {(() => {
                      const [isEditing, setIsEditing] = useState(false);
                      const inputRef = useRef(null);
                      // Only for Focus Time, so key is focusInput
                      return isEditing ? (
                        <input
                          ref={inputRef}
                          type='text'
                          inputMode='numeric'
                          pattern='[0-9]*'
                          min={1}
                          max={60}
                          className='flex-1 appearance-none border-none bg-transparent text-center text-lg font-semibold text-white outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
                          value={focusInput}
                          onChange={e => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setFocusInput(val);
                            // Update setting instantly as user types
                            let num = parseInt(val);
                            if (isNaN(num) || num < 1) num = 1;
                            if (num > 60) num = 60;
                            updateSetting('focusDuration', num * 60);
                          }}
                          onBlur={() => {
                            let num = parseInt(focusInput);
                            if (isNaN(num) || num < 1) num = 1;
                            if (num > 60) num = 60;
                            setFocusInput(String(num));
                            updateSetting('focusDuration', num * 60);
                            setIsEditing(false);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <span
                          className='flex-1 cursor-pointer select-none text-center text-lg font-semibold text-white'
                          onClick={() => setIsEditing(true)}
                        >
                          {focusInput}
                        </span>
                      );
                    })()}
                    <button
                      type='button'
                      aria-label='Increase focus time'
                      className='flex h-9 w-9 items-center justify-center rounded-r-2xl text-xl text-white transition-colors hover:bg-white/10 active:bg-white/20 disabled:opacity-40'
                      onClick={() => {
                        const num = parseInt(focusInput) || 1;
                        if (num < 60) {
                          setFocusInput(String(num + 1));
                          updateSetting('focusDuration', (num + 1) * 60);
                          playSound('select');
                        } else {
                          playSound('deny');
                        }
                      }}
                      disabled={parseInt(focusInput) >= 60}
                    >
                      &#43;
                    </button>
                  </div>
                </div>

                {/* Break Time */}
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-white/70'>
                    Break Time
                  </label>
                  <div className='flex items-center rounded-2xl border border-white/20 bg-white/10 px-2 py-1'>
                    <button
                      type='button'
                      aria-label='Decrease break time'
                      className='flex h-9 w-9 items-center justify-center rounded-l-2xl text-xl text-white transition-colors hover:bg-white/10 active:bg-white/20 disabled:opacity-40'
                      onClick={() => {
                        const num = parseInt(breakInput) || 1;
                        if (num > 1) {
                          setBreakInput(String(num - 1));
                          updateSetting('breakDuration', (num - 1) * 60);
                          playSound('select');
                        }
                      }}
                      onPointerDown={e => {
                        if (parseInt(breakInput) <= 1) {
                          playSound('deny');
                          e.preventDefault();
                        }
                      }}
                      disabled={parseInt(breakInput) <= 1}
                    >
                      &minus;
                    </button>
                    {/** Editable value for Break Time */}
                    {(() => {
                      const [isEditing, setIsEditing] = useState(false);
                      const inputRef = useRef(null);
                      return isEditing ? (
                        <input
                          ref={inputRef}
                          type='text'
                          inputMode='numeric'
                          pattern='[0-9]*'
                          min={1}
                          max={30}
                          className='flex-1 appearance-none border-none bg-transparent text-center text-lg font-semibold text-white outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
                          value={breakInput}
                          onChange={e => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setBreakInput(val);
                            // Update setting instantly as user types
                            let num = parseInt(val);
                            if (isNaN(num) || num < 1) num = 1;
                            if (num > 30) num = 30;
                            updateSetting('breakDuration', num * 60);
                          }}
                          onBlur={() => {
                            let num = parseInt(breakInput);
                            if (isNaN(num) || num < 1) num = 1;
                            if (num > 30) num = 30;
                            setBreakInput(String(num));
                            updateSetting('breakDuration', num * 60);
                            setIsEditing(false);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <span
                          className='flex-1 cursor-pointer select-none text-center text-lg font-semibold text-white'
                          onClick={() => setIsEditing(true)}
                        >
                          {breakInput}
                        </span>
                      );
                    })()}
                    <button
                      type='button'
                      aria-label='Increase break time'
                      className='flex h-9 w-9 items-center justify-center rounded-r-2xl text-xl text-white transition-colors hover:bg-white/10 active:bg-white/20 disabled:opacity-40'
                      onClick={() => {
                        const num = parseInt(breakInput) || 1;
                        if (num < 30) {
                          setBreakInput(String(num + 1));
                          updateSetting('breakDuration', (num + 1) * 60);
                          playSound('select');
                        } else {
                          playSound('deny');
                        }
                      }}
                      disabled={parseInt(breakInput) >= 30}
                    >
                      &#43;
                    </button>
                  </div>
                </div>

                {/* Long Rest Time */}
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-white/70'>
                    Long Rest Time
                  </label>
                  <div className='flex items-center rounded-2xl border border-white/20 bg-white/10 px-2 py-1'>
                    <button
                      type='button'
                      aria-label='Decrease long rest time'
                      className='flex h-9 w-9 items-center justify-center rounded-l-2xl text-xl text-white transition-colors hover:bg-white/10 active:bg-white/20 disabled:opacity-40'
                      onClick={() => {
                        const num = parseInt(restInput) || 1;
                        if (num > 1) {
                          setRestInput(String(num - 1));
                          updateSetting('restDuration', (num - 1) * 60);
                          playSound('select');
                        }
                      }}
                      onPointerDown={e => {
                        if (parseInt(restInput) <= 1) {
                          playSound('deny');
                          e.preventDefault();
                        }
                      }}
                      disabled={parseInt(restInput) <= 1}
                    >
                      &minus;
                    </button>
                    {/** Editable value for Long Rest Time */}
                    {(() => {
                      const [isEditing, setIsEditing] = useState(false);
                      const inputRef = useRef(null);
                      return isEditing ? (
                        <input
                          ref={inputRef}
                          type='text'
                          inputMode='numeric'
                          pattern='[0-9]*'
                          min={1}
                          max={60}
                          className='flex-1 appearance-none border-none bg-transparent text-center text-lg font-semibold text-white outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
                          value={restInput}
                          onChange={e => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setRestInput(val);
                            // Update setting instantly as user types
                            let num = parseInt(val);
                            if (isNaN(num) || num < 1) num = 1;
                            if (num > 60) num = 60;
                            updateSetting('restDuration', num * 60);
                          }}
                          onBlur={() => {
                            let num = parseInt(restInput);
                            if (isNaN(num) || num < 1) num = 1;
                            if (num > 60) num = 60;
                            setRestInput(String(num));
                            updateSetting('restDuration', num * 60);
                            setIsEditing(false);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <span
                          className='flex-1 cursor-pointer select-none text-center text-lg font-semibold text-white'
                          onClick={() => setIsEditing(true)}
                        >
                          {restInput}
                        </span>
                      );
                    })()}
                    <button
                      type='button'
                      aria-label='Increase long rest time'
                      className='flex h-9 w-9 items-center justify-center rounded-r-2xl text-xl text-white transition-colors hover:bg-white/10 active:bg-white/20 disabled:opacity-40'
                      onClick={() => {
                        const num = parseInt(restInput) || 1;
                        if (num < 60) {
                          setRestInput(String(num + 1));
                          updateSetting('restDuration', (num + 1) * 60);
                          playSound('select');
                        } else {
                          playSound('deny');
                        }
                      }}
                      disabled={parseInt(restInput) >= 60}
                    >
                      &#43;
                    </button>
                  </div>
                </div>

                {/* Long Rest After */}
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-white/70'>
                    Long Rest After (focus sessions)
                  </label>
                  <div className='flex items-center rounded-2xl border border-white/20 bg-white/10 px-2 py-1'>
                    <button
                      type='button'
                      aria-label='Decrease long rest interval'
                      className='flex h-9 w-9 items-center justify-center rounded-l-2xl text-xl text-white transition-colors hover:bg-white/10 active:bg-white/20 disabled:opacity-40'
                      onClick={() => {
                        const num = parseInt(restIntervalInput) || 2;
                        if (num > 2) {
                          setRestIntervalInput(String(num - 1));
                          updateSetting('restInterval', num - 1);
                          playSound('select');
                        }
                      }}
                      onPointerDown={e => {
                        if (parseInt(restIntervalInput) <= 2) {
                          playSound('deny');
                          e.preventDefault();
                        }
                      }}
                      disabled={parseInt(restIntervalInput) <= 2}
                    >
                      &minus;
                    </button>
                    {/** Editable value for Long Rest After */}
                    {(() => {
                      const [isEditing, setIsEditing] = useState(false);
                      const inputRef = useRef(null);
                      return isEditing ? (
                        <input
                          ref={inputRef}
                          type='text'
                          inputMode='numeric'
                          pattern='[0-9]*'
                          min={2}
                          max={10}
                          className='flex-1 appearance-none border-none bg-transparent text-center text-lg font-semibold text-white outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
                          value={restIntervalInput}
                          onChange={e => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setRestIntervalInput(val);
                            // Update setting instantly as user types
                            let num = parseInt(val);
                            if (isNaN(num) || num < 2) num = 2;
                            if (num > 10) num = 10;
                            updateSetting('restInterval', num);
                          }}
                          onBlur={() => {
                            let num = parseInt(restIntervalInput);
                            if (isNaN(num) || num < 2) num = 2;
                            if (num > 10) num = 10;
                            setRestIntervalInput(String(num));
                            updateSetting('restInterval', num);
                            setIsEditing(false);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <span
                          className='flex-1 cursor-pointer select-none text-center text-lg font-semibold text-white'
                          onClick={() => setIsEditing(true)}
                        >
                          {restIntervalInput}
                        </span>
                      );
                    })()}
                    <button
                      type='button'
                      aria-label='Increase long rest interval'
                      className='flex h-9 w-9 items-center justify-center rounded-r-2xl text-xl text-white transition-colors hover:bg-white/10 active:bg-white/20 disabled:opacity-40'
                      onClick={() => {
                        const num = parseInt(restIntervalInput) || 2;
                        if (num < 10) {
                          setRestIntervalInput(String(num + 1));
                          updateSetting('restInterval', num + 1);
                          playSound('select');
                        } else {
                          playSound('deny');
                        }
                      }}
                      disabled={parseInt(restIntervalInput) >= 10}
                    >
                      &#43;
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sound Notifications */}
            <div className='mb-8'>
              <div className='flex items-center justify-between'>
                <span className='text-lg font-medium text-white/90'>
                  Sound Notifications
                </span>
                <button
                  onPointerDown={() => {
                    const newSoundEnabled = !settings.soundEnabled;
                    updateSetting('soundEnabled', newSoundEnabled);
                    // Play different sounds for turning ON vs OFF
                    playSound(newSoundEnabled ? 'select' : 'deselect');
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/30 ${
                    settings.soundEnabled
                      ? 'bg-white/30 backdrop-blur-sm'
                      : 'bg-white/10 backdrop-blur-sm'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Alarm Sound Selection */}
            <div className='mb-8'>
              <div className='flex items-center justify-between gap-2'>
                <span
                  className={`text-lg font-medium ${
                    settings.soundEnabled ? 'text-white/90' : 'text-white/40'
                  }`}
                >
                  Alarm Sound
                </span>
                <div className='flex items-center gap-2'>
                  <Select
                    value={settings.alarmSound}
                    open={alarmDropdownOpen}
                    onOpenChange={open => {
                      if (open && !alarmDropdownOpen && settings.soundEnabled) {
                        playSound('select');
                      }
                      setAlarmDropdownOpen(open);
                    }}
                    // onValueChange is handled manually below
                    disabled={!settings.soundEnabled}
                  >
                    <SelectTrigger
                      className={`min-w-[120px] rounded-2xl border transition-all duration-200 ${
                        settings.soundEnabled
                          ? 'border-white/20 bg-white/10 text-white backdrop-blur-sm focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30'
                          : 'cursor-not-allowed border-white/10 bg-white/5 text-white/40 backdrop-blur-sm'
                      }`}
                    >
                      <SelectValue>
                        {ALARM_OPTIONS.find(
                          opt => opt.value === settings.alarmSound
                        )?.label || 'Select alarm'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className='rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl'>
                      {ALARM_OPTIONS.map(option => {
                        const isSelected = settings.alarmSound === option.value;
                        return (
                          <div
                            key={option.value}
                            role='option'
                            aria-selected={isSelected}
                            tabIndex={0}
                            className={`flex-1 cursor-pointer select-none rounded-xl px-3 py-2 pr-8 text-white outline-none transition-colors duration-150 ${
                              isSelected
                                ? 'bg-white/20 font-semibold text-white'
                                : 'hover:bg-white/10 focus:bg-white/20'
                            }`}
                            onPointerDown={e => {
                              e.preventDefault();
                              if (!settings.soundEnabled) return;
                              if (isSelected) {
                                playSound('select');
                                setAlarmDropdownOpen(false);
                              } else {
                                playSound(option.value as any);
                                updateSetting('alarmSound', option.value);
                                setAlarmDropdownOpen(true);
                              }
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                if (!settings.soundEnabled) return;
                                if (isSelected) {
                                  playSound('select');
                                  setAlarmDropdownOpen(false);
                                } else {
                                  playSound(option.value as any);
                                  updateSetting('alarmSound', option.value);
                                  setAlarmDropdownOpen(true);
                                }
                              }
                            }}
                          >
                            {option.label}
                          </div>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {/* Removed always-visible preview button next to select */}
                </div>
              </div>
            </div>
          </div>
          {/* Settings Content ...existing code... */}
        </div>
      </div>
    </div>
  );
}
