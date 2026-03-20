/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sone: {
          paper: 'var(--paper)',
          ink: 'var(--ink)',
          muted: 'var(--muted)',
          line: 'var(--line)',
          accent: 'var(--accent)',
          strong: 'var(--accent-strong)',
          warm: 'var(--warm)',
          deep: 'var(--warm-deep)',
        },
      },
      fontFamily: {
        body: ['var(--font-body)'],
        heading: ['var(--font-heading)'],
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
      },
    },
  },
  plugins: [],
}
