const lineClamp = require('@tailwindcss/line-clamp');

module.exports = {
  content: ['src/**/*.{ts,tsx,jsx,js}', 'index.html'],
  theme: {
    extend: {
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        pill: '9999px',
      },
      boxShadow: {
        soft: '0 6px 30px -12px rgba(15, 23, 42, 0.25)',
        softmd: '0 10px 35px -12px rgba(15, 23, 42, 0.30)',
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100:'#e0e7ff',
          500:'#6366f1', // base
          600:'#5859e7',
          700:'#4f46e5',
        },
      },
      // For gradients used in the ribbon/spotlight
      backgroundImage: {
        'brand-ribbon': 'linear-gradient(90deg, #4f46e5 0%, #22d3ee 100%)',
        'brand-glass': 'linear-gradient(180deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.5) 100%)',
      },
    },
  },
  plugins: [],
}