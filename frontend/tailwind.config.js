/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#040814',
          900: '#070d1f',
          800: '#0c1530',
          700: '#142049',
          600: '#1b2c66',
          500: '#26408b',
          400: '#3a5cb8',
        },
        gold: {
          500: '#f5c518',
          400: '#fcd34d',
          300: '#fde68a',
        },
        ink: '#020410',
        line: 'rgba(245,197,24,0.12)',
      },
      fontFamily: {
        display: ['"Rajdhani"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 30px -5px rgba(245,197,24,0.3)',
        panel: '0 8px 40px -10px rgba(0,0,0,0.6)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'scan': 'scan 3s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245,197,24,0.4)' },
          '50%':      { boxShadow: '0 0 0 12px rgba(245,197,24,0)' },
        },
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
