/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./App.tsx",
    "./main.tsx",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Calibrated neutral palette to authentically reflect Atom One (Light & Dark)
        zinc: {
          50: '#fafafa',   // Atom One Light canvas
          100: '#f0f0f0',  // Atom One Light panels / gutter
          200: '#e5e5e6',  // Atom One Light border / active tab
          300: '#d0d0d0',  // Atom One Light divider / subtle border
          400: '#a0a1a7',  // Atom One Light muted text / Dark secondary
          500: '#5c6370',  // Atom One Dark comment / muted
          600: '#4b5263',  // Atom One Dark gutter numbers
          700: '#353b45',  // Atom One Dark hover surface / subtle divider
          800: '#2c313a',  // Atom One Dark surface / active tab
          900: '#282c34',  // Atom One Dark editor & workspace canvas
          950: '#21252b',  // Atom One Dark sidebar, statusbar & gutter
        },
        atom: {
          darkBg: '#282c34',
          darkPanel: '#21252b',
          darkSurface: '#2c313a',
          darkHover: '#353b45',
          darkBorder: '#181a1f',
          darkFg: '#abb2bf',
          darkMuted: '#5c6370',
          darkBlue: '#61afef',
          darkPurple: '#c678dd',
          darkGreen: '#98c379',
          darkRed: '#e06c75',
          darkOrange: '#d19a66',
          darkYellow: '#e5c07b',
          darkCyan: '#56b6c2',
          lightBg: '#fafafa',
          lightPanel: '#f0f0f0',
          lightSurface: '#ffffff',
          lightHover: '#e5e5e6',
          lightBorder: '#d0d0d0',
          lightFg: '#383a42',
          lightMuted: '#a0a1a7',
          lightBlue: '#4078f2',
          lightPurple: '#a626a4',
          lightGreen: '#50a14f',
          lightRed: '#e45649',
          lightOrange: '#986801',
          lightCyan: '#0184bc',
        },
      },
    },
  },
  plugins: [],
}
