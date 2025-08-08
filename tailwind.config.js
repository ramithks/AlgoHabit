/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        accent: '#6366f1',
        accentMuted: '#818cf8',
        danger: '#f87171',
        success: '#34d399',
        surface: {
          50: '#1b1c22',
          100: '#202129',
          200: '#262830',
          300: '#2d3039',
          400: '#353945',
          500: '#3d424f',
          600: '#474d5c',
          700: '#535a6c',
          800: '#5f677c',
          900: '#6b748c'
        }
      },
      boxShadow: {
        'glow-accent': '0 0 0 1px rgba(99,102,241,.4), 0 0 12px -2px rgba(99,102,241,.5)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
