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
      // `screen` (used by h-screen / min-h-screen everywhere) is 100vh by
      // default, which is the *static* viewport height on phones — it
      // doesn't track the browser chrome (address bar) hiding/showing or
      // the window resizing (e.g. Android split-screen). Using the dynamic
      // viewport unit here keeps every screen sized to what's actually
      // visible instead of leaving a gap or clipping content after a resize.
      height: {
        screen: "100dvh",
      },
      minHeight: {
        screen: "100dvh",
      },
    },
  },
  plugins: [],
} satisfies Config;
