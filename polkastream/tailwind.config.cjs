/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        flow: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
      },
      animation: {
        'shimmer': 'shimmer 3s linear infinite',
        'ripple': 'ripple 8s linear infinite',
        'wave': 'wave 10s ease-in-out infinite',
        'bubble': 'bubble 4s ease-in-out infinite',
        'flow': 'liquidFlow 15s ease-in-out infinite',
        'stream': 'streamFlow 3s linear infinite',
        'liquid-text': 'liquidText 4s linear infinite',
        'liquid-border': 'liquidBorder 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'drip': 'fall 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%) translateY(-100%) rotate(45deg)' },
          '100%': { transform: 'translateX(100%) translateY(100%) rotate(45deg)' },
        },
        ripple: {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: '0.5' },
          '100%': { transform: 'translate(50%, 50%) scale(1.5)', opacity: '0' },
        },
        wave: {
          '0%, 100%': { transform: 'translate(-25%, -25%) scale(1)' },
          '50%': { transform: 'translate(-50%, -50%) scale(1.1)' },
        },
        bubble: {
          '0%': { transform: 'translateY(0) scale(0)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(-100px) scale(1)', opacity: '0' },
        },
        liquidFlow: {
          '0%, 100%': { backgroundPosition: '0% 0%' },
          '50%': { backgroundPosition: '100% 100%' },
        },
        streamFlow: {
          '0%': { left: '-100%', width: '50%' },
          '100%': { left: '100%', width: '50%' },
        },
        liquidText: {
          '0%': { backgroundPosition: '0% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        liquidBorder: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fall: {
          '0%': { transform: 'translateY(0) scaleY(1)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(30px) scaleY(1.2)', opacity: '0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'flow': '0 0 30px rgba(6, 182, 212, 0.1), inset 0 0 30px rgba(6, 182, 212, 0.05)',
        'flow-lg': '0 0 40px rgba(6, 182, 212, 0.2), inset 0 0 40px rgba(6, 182, 212, 0.1)',
      },
    },
  },
  plugins: [],
}