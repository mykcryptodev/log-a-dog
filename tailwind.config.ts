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
        // "Candy Pop" light — condiments kept as *semantic* accents (CTA / live /
        // valid / sus), but the neutral + base layer is pulled from the pink
        // candy-pop background so the frosted cards refract the gradient behind
        // them instead of sitting on flat cream. See docs/REDESIGN.md §11.
        logadog: {
          primary: "#F5C518", // mustard — brand / primary CTAs
          "primary-content": "#2B1F3B",
          secondary: "#E23B2E", // ketchup — energy, rank #1, live
          "secondary-content": "#FFF1F6",
          accent: "#5BA84A", // relish — VALID DOG, streaks
          "accent-content": "#FFF1F6",
          neutral: "#2B1F3B", // deep plum — text, dark surfaces
          "neutral-content": "#FFF1F6",
          "base-100": "#FFF1F6", // soft pink-cream app background
          "base-200": "#FBE0EC", // candy pink — cards
          "base-300": "#F6CCE0",
          "base-content": "#2B1F3B", // deep plum ink (matches navy confetti dots)
          info: "#9B7BE0", // periwinkle — quiet metadata
          success: "#5BA84A",
          warning: "#F5C518",
          error: "#D7263D", // sus red — invalid verdicts
          "--rounded-box": "1.5rem",
          "--rounded-btn": "1rem",
          "--rounded-badge": "1rem",
        },
      },
      {
        // "Candy Pop" dark — the purple party twin of the pink light theme.
        // Deep indigo-purple base matches the new purple background; condiments
        // stay neon for energy.
        "logadog-night": {
          primary: "#FFD428", // neon mustard
          "primary-content": "#1A1140",
          secondary: "#FF4D3D", // bright ketchup
          "secondary-content": "#1A1140",
          accent: "#6FCB5A", // bright relish
          "accent-content": "#1A1140",
          neutral: "#3A2A6B", // purple — dark surfaces
          "neutral-content": "#F3E9FF",
          "base-100": "#1A1140", // deep indigo-purple — party at night
          "base-200": "#271858", // purple — cards
          "base-300": "#341E6E",
          "base-content": "#F3E9FF", // soft lavender ink
          info: "#A78BFA", // periwinkle
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
