import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Segment", "system-ui", "sans-serif"],
        display: ["Segment", "system-ui", "sans-serif"],
        body: ["Segment", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // Warm condiment shadow instead of gray box-shadows.
        dog: "0 8px 30px rgba(226,59,46,0.12)",
        "dog-lg": "0 12px 40px rgba(226,59,46,0.18)",
      },
      keyframes: {
        // Grill-mark shimmer for skeleton loaders.
        "grill-shimmer": {
          "0%": { backgroundPosition: "-150% 0" },
          "100%": { backgroundPosition: "250% 0" },
        },
      },
      animation: {
        "grill-shimmer": "grill-shimmer 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    // First theme = default (light). darkTheme auto-applies under
    // prefers-color-scheme: dark, matching the existing Tailwind `dark:` media
    // variants used across the app.
    darkTheme: "logadog-night",
    themes: [
      {
        logadog: {
          primary: "#F5C518", // mustard — brand / primary CTAs
          "primary-content": "#1E1A17",
          secondary: "#E23B2E", // ketchup — energy, rank #1, live
          "secondary-content": "#FFF8EC",
          accent: "#5BA84A", // relish — VALID DOG, streaks
          "accent-content": "#FFF8EC",
          neutral: "#1E1A17", // char — text, grill marks
          "neutral-content": "#FFF8EC",
          "base-100": "#FFF8EC", // bun — warm cream app background
          "base-200": "#F4E7CE", // toasted bun — cards
          "base-300": "#E8D5AE",
          "base-content": "#1E1A17",
          info: "#7FB7D9", // sky picnic — quiet metadata
          success: "#5BA84A",
          warning: "#F5C518",
          error: "#D7263D", // sus red — invalid verdicts
          "--rounded-box": "1.5rem",
          "--rounded-btn": "1rem",
          "--rounded-badge": "1rem",
        },
      },
      {
        "logadog-night": {
          primary: "#FFD428", // neon mustard
          "primary-content": "#16110D",
          secondary: "#FF4D3D", // bright ketchup
          "secondary-content": "#16110D",
          accent: "#6FCB5A", // bright relish
          "accent-content": "#16110D",
          neutral: "#2A211A",
          "neutral-content": "#FFF8EC",
          "base-100": "#16110D", // char — stadium at night
          "base-200": "#221913",
          "base-300": "#2F231A",
          "base-content": "#F6ECD8",
          info: "#7FB7D9",
          success: "#6FCB5A",
          warning: "#FFD428",
          error: "#FF5C6E",
          "--rounded-box": "1.5rem",
          "--rounded-btn": "1rem",
          "--rounded-badge": "1rem",
        },
      },
    ],
  },
} satisfies Config;
