import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Aurora violet — the new primary accent (replaces the old flat blue).
        brand: {
          DEFAULT: "#6C5CE7",
          dark: "#4A38D6",
          light: "#A78BFA",
          50: "#F1EDFF",
        },
        // Secondary aurora accents — used sparingly for glow blobs, chips, gradients.
        aurora: {
          cyan: "#22D3EE",
          pink: "#F472B6",
          amber: "#FBBF24",
        },
        // Deep indigo-black — the base of every dark glass / gradient surface.
        navy: {
          950: "#0A0618",
          900: "#160B33",
          800: "#251354",
          700: "#3B2280",
        },
        ink: {
          900: "#170F33",
        },
        // Pale lavender tints for light-glass washes.
        cloud: {
          50: "#F5F2FF",
          100: "#EAE2FF",
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
        soft: "0 6px 24px rgba(30, 16, 74, 0.10)",
        glow: "0 10px 34px rgba(108, 92, 231, 0.45)",
        lift: "0 16px 38px rgba(30, 16, 74, 0.18)",
        glass: "0 8px 32px rgba(30, 16, 74, 0.14), inset 0 1px 0 rgba(255,255,255,0.6)",
        "glass-dark": "0 8px 32px rgba(4, 2, 12, 0.45), inset 0 1px 0 rgba(255,255,255,0.10)",
        "glass-sm": "0 4px 16px rgba(30, 16, 74, 0.10), inset 0 1px 0 rgba(255,255,255,0.5)",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        aurora: {
          "0%,100%": { backgroundPosition: "0% 50%, 100% 30%, 40% 80%" },
          "50%": { backgroundPosition: "30% 60%, 70% 50%, 60% 40%" },
        },
        haloping: {
          "0%": { transform: "scale(0.7)", opacity: "0.55" },
          "80%,100%": { transform: "scale(1.7)", opacity: "0" },
        },
      },
      animation: {
        shimmer: "shimmer 1.4s infinite",
        floaty: "floaty 3.6s ease-in-out infinite",
        aurora: "aurora 18s ease-in-out infinite",
        haloping: "haloping 2.6s cubic-bezier(0.22,1,0.36,1) infinite",
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
