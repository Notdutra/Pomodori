import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        glass: {
          primary: 'rgba(255, 255, 255, 0.15)',
          secondary: 'rgba(255, 255, 255, 0.08)',
          tertiary: 'rgba(255, 255, 255, 0.04)',
        },
        focus: {
          '50': '#f0fdf4',
          '100': '#dcfce7',
          '200': '#bbf7d0',
          '300': '#86efac',
          '400': '#4ade80',
          '500': '#22c55e',
          '600': '#16a34a',
          '700': '#15803d',
          '800': '#166534',
          '900': '#166534',
          glass: 'rgba(34, 197, 94, 0.12)',
          hover: 'rgba(34, 197, 94, 0.18)',
          active: '#059669',
        },
        break: {
          '50': '#fffde7',
          '100': '#fff9c4',
          '200': '#fff59d',
          '400': '#fcd34d',
          '500': '#ffd600',
          '700': '#92400e',
          '800': '#ff8f00',
          '900': '#ff6f00',
          glass: 'rgba(255, 214, 0, 0.12)',
          hover: 'rgba(255, 214, 0, 0.18)',
          active: '#ffb300',
          text: '#7c6500',
        },
        rest: {
          '50': '#fef2f2',
          '100': '#fee2e2',
          '400': '#fb7185',
          '500': '#f87171',
          '700': '#7f1d1d',
          '800': '#991b1b',
          '900': '#7f1d1d',
          glass: 'rgba(239, 68, 68, 0.12)',
          hover: 'rgba(239, 68, 68, 0.18)',
          active: '#dc2626',
        },
        accent: {
          '500': '#6366f1',
          '600': '#4f46e5',
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        focusDark: {
          '500': '#166534',
          '700': '#15803d',
          glass: 'rgba(34, 197, 94, 0.18)',
        },
        breakDark: {
          '500': '#a16207',
          '700': '#92400e',
          glass: 'rgba(234, 179, 8, 0.18)',
        },
        restDark: {
          '500': '#991b1b',
          '700': '#b91c1c',
          glass: 'rgba(251, 111, 111, 0.18)',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'timer-pulse': 'timerPulse 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': {
            opacity: '0',
          },
          '100%': {
            opacity: '1',
          },
        },
        slideUp: {
          '0%': {
            transform: 'translateY(20px)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        pulseSoft: {
          '0%, 100%': {
            opacity: '0.8',
          },
          '50%': {
            opacity: '0.4',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
        timerPulse: {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '1',
          },
          '50%': {
            transform: 'scale(1.05)',
            opacity: '0.8',
          },
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      fontSize: {
        display: [
          '6rem',
          {
            lineHeight: '1',
            fontWeight: '100',
          },
        ],
        timer: [
          '5rem',
          {
            lineHeight: '1',
            fontWeight: '400',
          },
        ],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
        'glass-lg': '0 25px 45px 0 rgba(0, 0, 0, 0.15)',
        'inner-glass': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'glow-focus': '0 0 60px rgba(249, 115, 22, 0.3)',
        'glow-break': '0 0 60px rgba(16, 185, 129, 0.3)',
        'glow-rest': '0 0 60px rgba(59, 130, 246, 0.3)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
    require('tailwindcss-animate'),
  ],
};
export default config;

// Add base style to remove default focus outlines
// This should be added to your global CSS (e.g., src/app/globals.css):
// *:focus { outline: none !important; box-shadow: none !important; }
