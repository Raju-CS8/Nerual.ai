/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"Geist Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // ── New design tokens (values live in index.css, light + dark) ──
        bg:       'rgb(var(--c-bg) / <alpha-value>)',
        surface:  'rgb(var(--c-surface) / <alpha-value>)',
        sunken:   'rgb(var(--c-sunken) / <alpha-value>)',
        line:     {
          DEFAULT: 'rgb(var(--c-line) / <alpha-value>)',
          strong:  'rgb(var(--c-line-strong) / <alpha-value>)',
        },
        ink:      {
          DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',
          2:       'rgb(var(--c-ink-2) / <alpha-value>)',
          3:       'rgb(var(--c-ink-3) / <alpha-value>)',
        },
        accent:   {
          DEFAULT: 'rgb(var(--c-accent) / <alpha-value>)',
          hover:   'rgb(var(--c-accent-hover) / <alpha-value>)',
          soft:    'rgb(var(--c-accent-soft) / <alpha-value>)',
          on:      'rgb(var(--c-on-accent) / <alpha-value>)',
        },
        success:  { DEFAULT: 'rgb(var(--c-success) / <alpha-value>)', soft: 'rgb(var(--c-success-soft) / <alpha-value>)' },
        warning:  { DEFAULT: 'rgb(var(--c-warning) / <alpha-value>)', soft: 'rgb(var(--c-warning-soft) / <alpha-value>)' },
        danger:   { DEFAULT: 'rgb(var(--c-danger) / <alpha-value>)',  soft: 'rgb(var(--c-danger-soft) / <alpha-value>)' },

        // ── Legacy names, remapped so pages I haven't redesigned yet keep working ──
        space: {
          bgStart:    'rgb(var(--c-bg) / <alpha-value>)',
          bgEnd:      'rgb(var(--c-bg) / <alpha-value>)',
          cardTop:    'rgb(var(--c-surface) / <alpha-value>)',
          cardBottom: 'rgb(var(--c-surface) / <alpha-value>)',
          surface:    'rgb(var(--c-surface) / <alpha-value>)',
          textWhite:  'rgb(var(--c-ink) / <alpha-value>)',
          mutedRed:   'rgb(var(--c-danger-soft) / <alpha-value>)',
        },
        cosmic: {
          gold:  'rgb(var(--c-accent) / <alpha-value>)',
          amber: 'rgb(var(--c-accent-hover) / <alpha-value>)',
        },
      },
      backgroundImage: {
        // Legacy gradient utilities now resolve to flat, solid colors
        'page-bg':  'linear-gradient(rgb(var(--c-bg)), rgb(var(--c-bg)))',
        'card-bg':  'linear-gradient(rgb(var(--c-surface)), rgb(var(--c-surface)))',
        'gold-btn': 'linear-gradient(rgb(var(--c-accent)), rgb(var(--c-accent)))',
      },
      boxShadow: {
        // Hairlines over glows. Legacy names kept, glow removed.
        'gold-glow': '0 0 0 0 transparent',
        'card':      '0 1px 2px rgb(0 0 0 / 0.04)',
        'pop':       '0 8px 24px -4px rgb(0 0 0 / 0.12), 0 0 0 1px rgb(var(--c-line))',
      },
      dropShadow: {
        'gold':    '0 0 0 transparent',
        'gold-lg': '0 0 0 transparent',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}