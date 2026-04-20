/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/**/*.{vue,ts,tsx,html}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Tinkerwell-inspired dark theme palette
        surface: {
          DEFAULT: '#1e1e2e',
          50:  '#313244',
          100: '#45475a',
          200: '#585b70',
        },
        border: '#313244',
        accent: {
          purple: '#cba6f7',
          blue:   '#89b4fa',
          cyan:   '#89dceb',
          green:  '#a6e3a1',
          yellow: '#f9e2af',
          red:    '#f38ba8',
          orange: '#fab387',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace']
      }
    }
  },
  plugins: []
}
