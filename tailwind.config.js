/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'scroll': 'scroll 20s linear infinite',
      },
      keyframes: {
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      backgroundImage: {
        'stripe-white': 'linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent)',
        'grid-white': 'linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,.3) 1px, transparent 1px)',
      },
      backgroundSize: {
        'stripe-white': '20px 20px',
      },
    },
  },
  plugins: [],
};
