const lineClamp = require('@tailwindcss/line-clamp');

module.exports = {
  content: ['src/**/*.{ts,tsx,jsx,js}', 'index.html'],
  theme: {
    extend: {
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1.25rem',
        pill: '9999px',
      },
      boxShadow: {
        soft: '0 6px 30px -12px rgba(15, 23, 42, 0.25)',
        softmd: '0 10px 35px -12px rgba(15, 23, 42, 0.30)',
      },
      colors: {
        brand: {
          DEFAULT: '#6CC24A', // lime green primary
          dark: '#56a53d',
          50: '#F3FAF1',
          100: '#E6F5E3',
          200: '#CCEBC4',
          300: '#A8DC8E',
          400: '#84CD58',
          500: '#6CC24A',
          600: '#56a53d',
          700: '#458531',
          800: '#346625',
          900: '#23471A',
        },
        ink: {
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94a3b8',
          300: '#cbd5e1',
        },
      },
      // For gradients used in the ribbon/spotlight
      backgroundImage: {
        'brand-ribbon': 'linear-gradient(90deg, #6CC24A 0%, #22d3ee 100%)',
        'brand-glass': 'linear-gradient(180deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.5) 100%)',
      },
    },
  },
  plugins: [lineClamp],
}