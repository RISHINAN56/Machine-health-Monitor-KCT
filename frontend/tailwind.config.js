/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          950: "#04070e",
          900: "#070c17",
          850: "#0b1222",
          800: "#101a30",
          700: "#1a2849",
          600: "#273b68",
          500: "#3b558f",
        },
        cyber: {
          cyan: "#00f0ff",
          emerald: "#10b981",
          amber: "#f59e0b",
          crimson: "#ef4444",
          violet: "#8b5cf6",
        },
      },
      fontFamily: {
        hud: ["Orbitron", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(0, 240, 255, 0.35)",
        "glow-emerald": "0 0 20px rgba(16, 185, 129, 0.4)",
        "glow-amber": "0 0 20px rgba(245, 158, 11, 0.4)",
        "glow-crimson": "0 0 25px rgba(239, 68, 68, 0.5)",
        "panel": "0 8px 32px 0 rgba(0, 0, 0, 0.5)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "sweep": "sweep 2.5s linear infinite",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        sweep: {
          "0%": { left: "-10%" },
          "100%": { left: "110%" },
        },
      },
    },
  },
  plugins: [],
};
