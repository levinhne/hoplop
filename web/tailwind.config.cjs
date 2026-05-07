/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        serif: ["Fraunces", "Crimson Pro", "serif"],
        hand: ["Dancing Script", "cursive"],
      },
      colors: {
        reunion: {
          paper: "#FDFCF8",   // Warm off-white
          sepia: "#704214",   // Classic sepia
          forest: "#1B4332",  // Deep nostalgic green
          wine: "#641220",    // Deep emotional red
          gold: "#B08D57",    // Aged gold
          ink: "#2D2D2D",     // Soft charcoal
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#1B4332", // Forest
          foreground: "#FDFCF8",
        },
        secondary: {
          DEFAULT: "#B08D57", // Gold
          foreground: "#FDFCF8",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        polaroid: "0 4px 15px -3px rgba(0, 0, 0, 0.07), 0 2px 6px -2px rgba(0, 0, 0, 0.05)",
        journal: "0 10px 30px -10px rgba(112, 66, 20, 0.1)",
      },
      backgroundImage: {
        'paper-texture': "url('https://www.transparenttextures.com/patterns/cream-paper.png')",
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
