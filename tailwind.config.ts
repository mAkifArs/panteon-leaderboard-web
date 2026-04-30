import type { Config } from 'tailwindcss'

/**
 * Design tokens scraped from panteon.games (dark canvas, muted nav,
 * Apple-system tipografi) blended with leaderboard-specific
 * intent tokens (prize medals, rank states).
 *
 * Brand tokens come from the site's actual computed styles. Prize
 * + rank tokens are leaderboard-specific and live alongside.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        panteon: {
          bg: '#0a0a0a',
          fg: '#ffffff',
          muted: '#b3b3b3',
          'muted-soft': '#666666',
          border: '#1f1f1f',
          'border-strong': '#2a2a2a',
          surface: '#111111',
          'surface-2': '#171717',
          'surface-3': '#0d0d0d',
          accent: '#ffffff',
          orange: '#f58220',
          'orange-deep': '#e26d0a',
          'orange-soft': '#f7780b',
          eyebrow: '#f8f8f8',
        },
        prize: {
          gold: '#f5b301',
          silver: '#c0c4c9',
          bronze: '#c47a3d',
        },
        trend: {
          up: '#65d985',
          down: '#e26d6d',
        },
        rank: {
          self: {
            bg: '#1a1a1a',
            border: '#ffffff',
            text: '#ffffff',
          },
          neighbour: {
            bg: '#0f0f0f',
          },
          normal: {
            bg: '#0a0a0a',
          },
        },
      },
      screens: {
        md: '720px',
      },
      fontFamily: {
        sans: [
          'SF Pro Display',
          '-apple-system',
          'BlinkMacSystemFont',
          'Helvetica Neue',
          'Helvetica',
          'Arial',
          'Tahoma',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'SF Mono', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        nav: '0.08em',
      },
      keyframes: {
        'lb-pulse': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.6)', opacity: '0.5' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'pulse-soft': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'lb-pulse': 'lb-pulse 1.2s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config
