/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Satoshi', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Clash Display', 'Cabinet Grotesk', 'sans-serif'],
        cabinet: ['Cabinet Grotesk', 'sans-serif'],
        supreme: ['Supreme', 'sans-serif'],
        mono: ['JetBrains Mono', 'Space Mono', 'monospace'],
      },
      colors: {
        // User's custom earthly & popping palettes
        palette: {
          emerald: '#06d6a0',
          cyan: '#1b9aaa',
          pink: '#ef476f',
          gold: '#ffc43d',
          pollen: '#ffd166',
          dusk: '#26547c',
          lightYellow: '#f8ffe5',
          white: '#fcfcfc',
        },
      },
    },
  },
  plugins: [],
};
