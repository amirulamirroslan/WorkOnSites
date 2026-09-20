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
