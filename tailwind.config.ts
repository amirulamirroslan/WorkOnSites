import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1A6BFF",
          dark: "#0F4FD1",
          light: "#4C9BFF",
          50: "#EAF2FF",
        },
        navy: {
          950: "#04122E",
          900: "#061B45",
          800: "#0A2A5E",
          700: "#123A7A",
        },
        ink: {
          900: "#0B1B3A",
        },
        cloud: {
          50: "#F2F6FD",
          100: "#E6EEFB",
        },
        success: { 500: "#22C55E", 600: "#16A34A" },
        warning: { 500: "#F59E0B" },
        danger: { 500: "#EF4444" },
      },
      fontFamily: {
        display: ["'Inter Tight'", "Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        soft: "0 6px 24px rgba(10, 42, 94, 0.08)",
        glow: "0 10px 30px rgba(26, 107, 255, 0.35)",
        lift: "0 14px 34px rgba(10, 42, 94, 0.14)",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
      },
      animation: {
        shimmer: "shimmer 1.4s infinite",
        floaty: "floaty 3.6s ease-in-out infinite",
      },
      fontSize: {
        xs: "12px",
        sm: "14px",
        base: "16px",
        lg: "20px",
        xl: "28px",
        "2xl": "40px",
      },
      borderRadius: {
        card: "20px",
        xl2: "28px",
        pill: "999px",
      },
    },
  },
  plugins: [],
} satisfies Config;
