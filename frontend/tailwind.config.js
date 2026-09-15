/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Tajawal", "Segoe UI", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eefbf4",
          100: "#d6f5e3",
          200: "#aeebc9",
          300: "#7bdaab",
          400: "#48c28b",
          500: "#26a670",
          600: "#18855a",
          700: "#156a49",
          800: "#14543c",
          900: "#124533",
        },
      },
    },
  },
  plugins: [],
};
