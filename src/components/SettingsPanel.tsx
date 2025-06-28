import { X } from 'lucide-react';
import { type Settings, type SettingsPanelProps } from './types';

export function SettingsPanel({
  settings,
  onSettingsChange,
  onClose,
}: SettingsPanelProps) {
  const updateSetting = (key: keyof Settings, value: number | boolean) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const formatMinutes = (seconds: number) => Math.floor(seconds / 60);
  const handleMinutesChange = (key: keyof Settings, minutes: number) => {
    updateSetting(key, minutes * 60);
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8'>
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        onClick={onClose}
      />
      <div
        className='relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-2xl'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-6 pb-4'>
          <h2 className='text-2xl font-bold text-white'>Settings</h2>
          <button
            onClick={onClose}
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
                <input
                  type='number'
                  min='1'
                  max='60'
                  value={formatMinutes(settings.focusDuration)}
                  onChange={e =>
                    handleMinutesChange(
                      'focusDuration',
                      parseInt(e.target.value) || 25
                    )
                  }
                  className='w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 backdrop-blur-sm transition-all duration-200 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30'
                />
              </div>

              {/* Break Time */}
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-white/70'>
                  Break Time
                </label>
                <input
                  type='number'
                  min='1'
                  max='30'
                  value={formatMinutes(settings.breakDuration)}
                  onChange={e =>
                    handleMinutesChange(
                      'breakDuration',
                      parseInt(e.target.value) || 5
                    )
                  }
                  className='w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 backdrop-blur-sm transition-all duration-200 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30'
                />
              </div>

              {/* Long Rest Time */}
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-white/70'>
                  Long Rest Time
                </label>
                <input
                  type='number'
                  min='1'
                  max='60'
                  value={formatMinutes(settings.restDuration)}
                  onChange={e =>
                    handleMinutesChange(
                      'restDuration',
                      parseInt(e.target.value) || 15
                    )
                  }
                  className='w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 backdrop-blur-sm transition-all duration-200 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30'
                />
              </div>

              {/* Long Rest After */}
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-white/70'>
                  Long Rest After (focus sessions)
                </label>
                <input
                  type='number'
                  min='2'
                  max='10'
                  value={settings.restInterval}
                  onChange={e =>
                    updateSetting('restInterval', parseInt(e.target.value) || 4)
                  }
                  className='w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 backdrop-blur-sm transition-all duration-200 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30'
                />
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
                onClick={() =>
                  updateSetting('soundEnabled', !settings.soundEnabled)
                }
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

          {/* Action Buttons */}
          <div className='flex gap-3'>
            <button
              onClick={onClose}
              className='flex-1 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 font-medium text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30'
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className='flex-1 rounded-2xl bg-white px-6 py-3 font-medium text-black transition-all duration-200 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/30'
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
