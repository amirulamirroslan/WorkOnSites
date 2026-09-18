import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2E6BFF",
          dark: "#1B48CC",
        },
        navy: {
          950: "#0A1220",
          800: "#121C2E",
        },
        ink: {
          900: "#0F172A",
        },
        cloud: {
          50: "#F5F7FB",
        },
        success: { 500: "#22C55E" },
        warning: { 500: "#F59E0B" },
        danger: { 500: "#EF4444" },
      },
      fontFamily: {
        display: ["'Inter Tight'", "Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
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
        pill: "999px",
      },
    },
  },
  plugins: [],
} satisfies Config;
