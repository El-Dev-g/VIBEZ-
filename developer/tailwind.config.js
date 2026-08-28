/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vibez: {
          bg: '#090d16',
          card: '#0f172a',
          surface: '#1e293b',
          border: '#334155',
          emerald: '#10b981',
          accent: '#38bdf8',
          purple: '#818cf8',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
