/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        space: {
          bgStart:    '#1A1725',
          bgEnd:      '#13111C',
          cardTop:    '#262131',
          cardBottom: '#1E1B26',
          surface:    '#191621',
          textWhite:  '#F3F4F6',
          mutedRed:   '#3E262A',
        },
        cosmic: {
          gold:   '#D4AF37',
          amber:  '#FBBF24',
        },
      },
      backgroundImage: {
        'page-bg':   'radial-gradient(circle at center, #1A1725 0%, #13111C 100%)',
        'card-bg':   'linear-gradient(180deg, #262131 0%, #1E1B26 100%)',
        'gold-btn':  'linear-gradient(to right, #FBBF24, #D4AF37)',
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(212,175,55,0.25)',
        'card':      '0 4px 30px rgba(0,0,0,0.4)',
      },
      dropShadow: {
        'gold':    '0 0 8px rgba(212,175,55,0.3)',
        'gold-lg': '0 0 16px rgba(212,175,55,0.5)',
      },
    },
  },
  plugins: [],
}